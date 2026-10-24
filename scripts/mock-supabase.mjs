// Local stand-in for Supabase, for end-to-end testing only. Never used in production.
//
//   * Auth (GoTrue-compatible): /authorize (PKCE) → stand-in Google consent page → redirect with ?code
//     /token?grant_type=pkce|refresh_token, /user, /logout — HS256 JWTs signed with a local secret.
//   * Data (PostgREST-compatible): /rest/v1/rpc/<fn> runs the REAL migration on PGlite, as role
//     `authenticated` with the JWT's sub claim, so Row Level Security is genuinely enforced.
//   * /__test/* control endpoints let the QA script expire sessions, inject failures and inspect rows.
//
// Usage: node scripts/mock-supabase.mjs [port=54321]
import { createServer } from "node:http";
import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const PORT = Number(process.argv[2] ?? 54321);
const SECRET = randomBytes(32);
const ACCESS_TTL = 3600;

const USERS = {
  alice: { id: "aaaaaaaa-0000-4000-8000-000000000001", email: "alice.learner@example.com", name: "Alice Learner" },
  bob: { id: "bbbbbbbb-0000-4000-8000-000000000002", email: "bob.investor@example.com", name: "Bob Investor" },
};

/* ---------------------------------- database ---------------------------------- */

const db = new PGlite();
await db.exec(`
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon nologin; create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
const migrations = join(process.cwd(), "supabase", "migrations");
for (const f of readdirSync(migrations).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(join(migrations, f), "utf8"));
for (const u of Object.values(USERS)) {
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
    u.id,
    u.email,
    JSON.stringify({ full_name: u.name, name: u.name }),
  ]);
}

/* ------------------------------------ auth ------------------------------------ */

const b64url = (buf) => Buffer.from(buf).toString("base64url");
function sign(payload) {
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  return `${head}.${body}.${b64url(createHmac("sha256", SECRET).update(`${head}.${body}`).digest())}`;
}
let tokenGeneration = 0; // bumping this invalidates every issued access and refresh token
function verify(token) {
  const [head, body, sig] = (token ?? "").split(".");
  if (!sig || b64url(createHmac("sha256", SECRET).update(`${head}.${body}`).digest()) !== sig) return null;
  const claims = JSON.parse(Buffer.from(body, "base64url").toString());
  if (claims.exp * 1000 < Date.now() || claims.gen !== tokenGeneration) return null;
  return claims;
}

const userObject = (u) => ({
  id: u.id,
  aud: "authenticated",
  role: "authenticated",
  email: u.email,
  email_confirmed_at: new Date(0).toISOString(),
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: { full_name: u.name, name: u.name, email: u.email },
  identities: [],
  created_at: new Date(0).toISOString(),
  updated_at: new Date().toISOString(),
});

const codes = new Map(); // auth code -> { user, challenge }
const refreshTokens = new Map(); // refresh token -> { user, gen }

function session(user) {
  const now = Math.floor(Date.now() / 1000);
  const access = sign({
    sub: user.id,
    email: user.email,
    role: "authenticated",
    aud: "authenticated",
    iat: now,
    exp: now + ACCESS_TTL,
    session_id: randomUUID(),
    gen: tokenGeneration,
    user_metadata: { full_name: user.name },
  });
  const refresh = randomBytes(16).toString("hex");
  refreshTokens.set(refresh, { user, gen: tokenGeneration });
  return { access_token: access, token_type: "bearer", expires_in: ACCESS_TTL, expires_at: now + ACCESS_TTL, refresh_token: refresh, user: userObject(user) };
}

/* ----------------------------------- server ----------------------------------- */

const failures = { saves: 0 };

function send(res, req, status, body, headers = {}) {
  res.writeHead(status, {
    "access-control-allow-origin": req.headers.origin ?? "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": req.headers["access-control-request-headers"] ?? "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...headers,
  });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function consentPage(params) {
  const redirect = params.get("redirect_to");
  const state = new URLSearchParams({ redirect_to: redirect, challenge: params.get("code_challenge") ?? "" });
  const link = (who, label) => `<a class="b" href="/__consent?${state}&who=${who}">${label}</a>`;
  return `<!doctype html><meta charset="utf-8"><title>Mock Google sign-in</title>
  <style>body{font-family:system-ui;background:#f1f3f4;display:grid;place-items:center;height:100vh;margin:0}
  .c{background:#fff;padding:32px;border-radius:12px;width:340px;box-shadow:0 1px 4px #0002}
  .b{display:block;margin:8px 0;padding:12px;border:1px solid #dadce0;border-radius:8px;color:#1f1f1f;text-decoration:none}</style>
  <div class="c"><h1 style="font-size:20px">Choose an account</h1><p style="color:#5f6368">Stand-in for Google (test only)</p>
  ${link("alice", "Alice Learner")}${link("bob", "Bob Investor")}${link("cancel", "Cancel")}</div>`;
}

async function rpc(req, res, fn) {
  const claims = verify((req.headers.authorization ?? "").replace(/^Bearer /i, ""));
  if (!claims) return send(res, req, 401, { code: "PGRST301", message: "JWT expired", details: null, hint: null });
  if (fn === "save_progress" && failures.saves > 0) {
    failures.saves -= 1;
    return send(res, req, 503, { code: "PGRST000", message: "Service temporarily unavailable", details: null, hint: null });
  }
  const body = await readBody(req);
  try {
    const result = await db.transaction(async (tx) => {
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [claims.sub]);
      await tx.exec(`set local role authenticated`);
      const rows =
        fn === "save_progress"
          ? (await tx.query(`select public.save_progress($1::jsonb) as r`, [JSON.stringify(body.payload)])).rows
          : (await tx.query(`select public.${fn === "load_progress" ? "load_progress" : "delete_my_progress"}() as r`)).rows;
      return rows[0].r;
    });
    if (fn === "delete_my_progress") return send(res, req, 204, undefined);
    return send(res, req, 200, result);
  } catch (e) {
    return send(res, req, 400, { code: e.code ?? "P0001", message: e.message, details: null, hint: null });
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  try {
    if (req.method === "OPTIONS") return send(res, req, 204, undefined);

    if (path === "/auth/v1/authorize") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(consentPage(url.searchParams));
    }
    if (path === "/__consent") {
      const redirect = new URL(url.searchParams.get("redirect_to"));
      const who = url.searchParams.get("who");
      if (who === "cancel") {
        redirect.searchParams.set("error", "access_denied");
        redirect.searchParams.set("error_description", "The user denied the request");
      } else {
        const code = randomUUID();
        codes.set(code, { user: USERS[who], challenge: url.searchParams.get("challenge") });
        redirect.searchParams.set("code", code);
      }
      res.writeHead(302, { location: redirect.toString() });
      return res.end();
    }
    if (path === "/auth/v1/token" && req.method === "POST") {
      const body = await readBody(req);
      const grant = url.searchParams.get("grant_type");
      if (grant === "pkce") {
        const entry = codes.get(body.auth_code);
        codes.delete(body.auth_code);
        const expected = entry && b64url(createHash("sha256").update(body.code_verifier ?? "").digest());
        if (!entry || expected !== entry.challenge) {
          return send(res, req, 400, { code: 400, error_code: "bad_code_verifier", msg: "invalid flow state" });
        }
        return send(res, req, 200, session(entry.user));
      }
      if (grant === "refresh_token") {
        const entry = refreshTokens.get(body.refresh_token);
        refreshTokens.delete(body.refresh_token);
        if (!entry || entry.gen !== tokenGeneration) {
          return send(res, req, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found" });
        }
        return send(res, req, 200, session(entry.user));
      }
      return send(res, req, 400, { msg: "unsupported grant" });
    }
    if (path === "/auth/v1/user") {
      const claims = verify((req.headers.authorization ?? "").replace(/^Bearer /i, ""));
      if (!claims) return send(res, req, 403, { code: 403, error_code: "bad_jwt", msg: "invalid JWT" });
      const user = Object.values(USERS).find((u) => u.id === claims.sub);
      return send(res, req, 200, userObject(user));
    }
    if (path === "/auth/v1/logout") return send(res, req, 204, undefined);
    if (path === "/auth/v1/.well-known/jwks.json") return send(res, req, 200, { keys: [] });

    const rpcMatch = path.match(/^\/rest\/v1\/rpc\/(save_progress|load_progress|delete_my_progress)$/);
    if (rpcMatch && req.method === "POST") return rpc(req, res, rpcMatch[1]);

    // ---- test controls ----
    if (path === "/__test/expire-sessions") {
      tokenGeneration += 1;
      return send(res, req, 200, { ok: true });
    }
    if (path === "/__test/fail-saves") {
      failures.saves = Number(url.searchParams.get("n") ?? 1);
      return send(res, req, 200, { ok: true });
    }
    if (path === "/__test/counts") {
      const who = USERS[url.searchParams.get("user")];
      const { rows } = await db.query(
        `select
           (select count(*)::int from public.concept_progress where user_id = $1) as concepts,
           (select count(*)::int from public.simulation_sessions where user_id = $1) as sessions,
           (select count(*)::int from public.round_history where user_id = $1) as rounds,
           (select count(*)::int from public.sim_orders where user_id = $1) as orders,
           (select count(*)::int from public.holdings where user_id = $1) as holdings,
           (select count(*)::int from public.achievements where user_id = $1) as achievements`,
        [who.id],
      );
      return send(res, req, 200, rows[0]);
    }
    return send(res, req, 404, { message: `mock: no route ${req.method} ${path}` });
  } catch (e) {
    return send(res, req, 500, { message: String(e) });
  }
}).listen(PORT, "127.0.0.1", () => console.log(`mock supabase on http://127.0.0.1:${PORT}`));
