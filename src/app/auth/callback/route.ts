import { NextResponse, type NextRequest } from "next/server";
import { AUTH_CONFIGURED, safeNextPath } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * OAuth callback. Google → Supabase → here with `?code=…` (PKCE). We exchange the code for a
 * session server-side (setting the auth cookies), then send the user back where they started.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get("next"));
  const toSignIn = (error: string) => {
    const target = new URL("/sign-in", url.origin);
    target.searchParams.set("error", error);
    if (next !== "/") target.searchParams.set("next", next);
    return NextResponse.redirect(target);
  };

  if (!AUTH_CONFIGURED) return toSignIn("unconfigured");

  // The provider reports cancellation/denial as ?error=access_denied.
  const providerError = url.searchParams.get("error");
  if (providerError) return toSignIn(providerError === "access_denied" ? "cancelled" : "provider");

  const code = url.searchParams.get("code");
  if (!code) return toSignIn("missing_code");

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return toSignIn("exchange_failed");
  } catch {
    return toSignIn("exchange_failed");
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
