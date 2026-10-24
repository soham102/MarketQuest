"use client";

/**
 * The only module that reads or writes MarketQuest data in Supabase. Ownership is decided
 * server-side by auth.uid() inside the RPCs — no user id is ever sent from the browser.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CloudProgress, ProgressPayload } from "./mapping";

export interface SaveResult {
  simulation_applied: boolean;
  session_id: string | null;
  stored_rank: number | null;
}

export class CloudError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "network" | "server",
  ) {
    super(message);
    this.name = "CloudError";
  }
}

function classify(error: { message?: string; code?: string; status?: number } | null | undefined, fallback: string): CloudError {
  const message = error?.message ?? fallback;
  const code = error?.code ?? "";
  if (code === "PGRST301" || code === "PGRST303" || code === "28000" || error?.status === 401 || /jwt|not authenticated|expired/i.test(message)) {
    return new CloudError(message, "auth");
  }
  if (/fetch|network|failed to|timeout|load failed/i.test(message)) return new CloudError(message, "network");
  return new CloudError(message, "server");
}

export async function loadCloudProgress(supabase: SupabaseClient): Promise<CloudProgress> {
  try {
    const { data, error } = await supabase.rpc("load_progress");
    if (error) throw classify(error, "Couldn't load saved progress.");
    return data as CloudProgress;
  } catch (e) {
    throw e instanceof CloudError ? e : classify(e as Error, "Couldn't load saved progress.");
  }
}

export async function saveCloudProgress(supabase: SupabaseClient, payload: ProgressPayload): Promise<SaveResult> {
  try {
    const { data, error } = await supabase.rpc("save_progress", { payload });
    if (error) throw classify(error, "Couldn't save progress.");
    return data as SaveResult;
  } catch (e) {
    throw e instanceof CloudError ? e : classify(e as Error, "Couldn't save progress.");
  }
}

export async function deleteCloudProgress(supabase: SupabaseClient): Promise<void> {
  try {
    const { error } = await supabase.rpc("delete_my_progress");
    if (error) throw classify(error, "Couldn't delete saved progress.");
  } catch (e) {
    throw e instanceof CloudError ? e : classify(e as Error, "Couldn't delete saved progress.");
  }
}
