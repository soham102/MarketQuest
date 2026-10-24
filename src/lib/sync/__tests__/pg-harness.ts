/**
 * Test harness: runs the real migration on PGlite (Postgres compiled to WASM) with a
 * minimal stand-in for Supabase's auth schema and API roles, so RLS is enforced exactly
 * as Postgres would enforce it for signed-in users.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

const AUTH_STUB = `
  create schema auth;
  create table auth.users (
    id uuid primary key,
    email text,
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  -- Same contract as Supabase: the user id comes from the verified JWT's "sub" claim.
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;
  create role anon nologin;
  create role authenticated nologin;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;

export async function createTestDb() {
  const db = new PGlite();
  await db.exec(AUTH_STUB);
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }

  /** Create an auth user the way Supabase does (fires the profile trigger). */
  async function createUser(id: string, email: string, name: string) {
    await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`, [
      id,
      email,
      JSON.stringify({ full_name: name, avatar_url: `https://example.com/${id}.png` }),
    ]);
  }

  /** Run SQL as a signed-in user (role `authenticated`, JWT sub = userId), or as `anon`. */
  async function as<T>(userId: string | null, fn: (q: <R = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<R[]>) => Promise<T>) {
    return db.transaction(async (tx) => {
      if (userId) {
        await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [userId]);
        await tx.exec(`set local role authenticated`);
      } else {
        await tx.exec(`set local role anon`);
      }
      return fn(async <R,>(sql: string, params?: unknown[]) => (await tx.query<R>(sql, params)).rows);
    });
  }

  async function saveProgress(userId: string, payload: unknown) {
    return as(userId, async (q) => {
      const rows = await q<{ save_progress: { simulation_applied: boolean; session_id: string; stored_rank: number } }>(
        `select public.save_progress($1::jsonb)`,
        [JSON.stringify(payload)],
      );
      return rows[0].save_progress;
    });
  }

  async function loadProgress(userId: string) {
    return as(userId, async (q) => {
      const rows = await q<{ load_progress: unknown }>(`select public.load_progress()`);
      return rows[0].load_progress;
    });
  }

  return { db, createUser, as, saveProgress, loadProgress };
}
