import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GUEST_COOKIE } from "@/lib/guest";
import { AUTH_CONFIGURED, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/** Routes that only make sense for a signed-in user. */
const PROTECTED = ["/account"];
/** Reachable before choosing to sign in or continue as a guest. */
const ALWAYS_OPEN = ["/sign-in", "/login", "/auth", "/contact", "/data"];

const matches = (pathname: string, list: string[]) => list.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * 1. Refreshes the Supabase session cookie on navigation (so server and browser agree on who is signed in).
 * 2. Shows the sign-in page first to anyone who isn't signed in and hasn't chosen "Continue without signing in".
 * 3. Keeps account-only routes for signed-in users.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED);
  const isGuest = request.cookies.get(GUEST_COOKIE)?.value === "1";

  let response = NextResponse.next({ request });
  let signedIn = false;

  if (AUTH_CONFIGURED) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
          for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
        },
      },
    });
    // getClaims() verifies the JWT (and refreshes an expired session) — never trust getSession() on the server.
    try {
      const { data, error } = await supabase.auth.getClaims();
      signedIn = !error && Boolean(data?.claims?.sub);
    } catch {
      signedIn = false; // auth service unreachable: treat as signed out
    }
  }

  const toSignIn = () => {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  };

  if (isProtected && !signedIn) return toSignIn();
  if (!signedIn && !isGuest && !matches(pathname, ALWAYS_OPEN)) return toSignIn();
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
