/**
 * "Continue without signing in" choice. Stored as a cookie (not localStorage) so the
 * server-side proxy can decide whether to show the sign-in page first.
 *
 * It's a session cookie: it lasts until the browser is closed, so every fresh visit
 * starts on the sign-in page. (Renamed from the older year-long "mq_guest" cookie.)
 */
export const GUEST_COOKIE = "mq_guest_session";

export function continueAsGuest() {
  document.cookie = `${GUEST_COOKIE}=1; path=/; samesite=lax`;
}

export function clearGuest() {
  document.cookie = `${GUEST_COOKIE}=; path=/; max-age=0; samesite=lax`;
  document.cookie = "mq_guest=; path=/; max-age=0; samesite=lax"; // remove the legacy long-lived cookie too
}
