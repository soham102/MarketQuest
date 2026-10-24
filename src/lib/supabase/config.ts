/**
 * Public Supabase settings. Both values are safe to expose to the browser: the publishable
 * (anon) key only grants what Row Level Security allows. Never put the service-role key here.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** When false, the app runs exactly as before: anonymous, browser-only progress. */
export const AUTH_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Only allow same-site relative redirects after sign-in (prevents open redirects). */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
