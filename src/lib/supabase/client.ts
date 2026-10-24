"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_CONFIGURED, SUPABASE_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** Browser Supabase client (session kept in cookies so the server can read it). Null if not configured. */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!AUTH_CONFIGURED) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
