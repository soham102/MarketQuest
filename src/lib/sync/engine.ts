"use client";

/**
 * Sync engine: keeps the signed-in user's progress in Supabase.
 *
 *   sign-in      → load cloud → merge with this device (see merge.ts) → save → show
 *   every change → saved locally at once (per-account cache) → debounced upload
 *   failures     → retried with backoff; the device copy is kept and marked "unsynced"
 *   expiry       → one silent refresh attempt, then a clear "sign in again" state
 *   sign-out     → final upload, then this device's copy of the account is removed
 *
 * The simulation engine knows nothing about any of this.
 */
import { useSyncExternalStore } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";
import { portfolioValue } from "@/lib/engine/portfolio";
import { clearState, defaultState, peekState, setActiveUser, STORAGE_KEY, userStorageKey } from "@/lib/store/persistence";
import { storeScope, type CommitReason } from "@/lib/store/store";
import type { AppState, SimulationState } from "@/lib/types";
import { CloudError, deleteCloudProgress, loadCloudProgress, saveCloudProgress } from "./cloud";
import { progressRank, stateFromCloud, toPayload } from "./mapping";
import { mergeStates, type LocalSource } from "./merge";

export interface AccountUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export interface ConflictSide {
  roundsCompleted: number;
  completed: boolean;
  valuePaise: number;
  startedAt: number;
}

export interface SyncMessage {
  id: number;
  tone: "up" | "down" | "warn" | "neutral";
  text: string;
}

export interface SyncSnapshot {
  auth: "disabled" | "loading" | "signed-out" | "signed-in";
  user: AccountUser | null;
  save: "idle" | "syncing" | "saving" | "saved" | "error" | "expired";
  lastSavedAt: number | null;
  message: SyncMessage | null;
  conflict: { local: ConflictSide; cloud: ConflictSide } | null;
}

/* ------------------------------------------------------------------ */
/* Observable status                                                   */
/* ------------------------------------------------------------------ */

const SERVER_SYNC: SyncSnapshot = { auth: "loading", user: null, save: "idle", lastSavedAt: null, message: null, conflict: null };
let snap: SyncSnapshot = SERVER_SYNC;
const listeners = new Set<() => void>();
let messageId = 0;

function set(patch: Partial<SyncSnapshot>) {
  snap = { ...snap, ...patch };
  for (const l of listeners) l();
}

function notify(tone: SyncMessage["tone"], text: string) {
  set({ message: { id: ++messageId, tone, text } });
}

export function useSync(): SyncSnapshot {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snap,
    () => SERVER_SYNC,
  );
}

/* ------------------------------------------------------------------ */
/* Internal state                                                      */
/* ------------------------------------------------------------------ */

let initialized = false;
let currentUser: AccountUser | null = null;
let initialSyncInProgress = false;
let pendingAfterInitial = false;
let inFlight = false;
let saveAgain = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
let explicitSignOut = false;
let conflictData: { local: SimulationState; cloud: SimulationState } | null = null;
let lastRefreshAt = 0;

const RETRY_DELAYS = [2_000, 5_000, 15_000, 30_000];
const SAVE_DEBOUNCE_MS = 600;
const REFRESH_THROTTLE_MS = 30_000;

const dirtyKey = (uid: string) => `${userStorageKey(uid)}:dirty`;
function markDirty(uid: string) {
  try {
    window.localStorage.setItem(dirtyKey(uid), "1");
  } catch {
    /* ignore */
  }
}
function clearDirty(uid: string) {
  try {
    window.localStorage.removeItem(dirtyKey(uid));
  } catch {
    /* ignore */
  }
}
function isDirty(uid: string) {
  try {
    return window.localStorage.getItem(dirtyKey(uid)) === "1";
  } catch {
    return false;
  }
}

function toAccountUser(u: User): AccountUser {
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    email: u.email ?? null,
    name: (meta.full_name as string) ?? (meta.name as string) ?? null,
    avatarUrl: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
  };
}

function hasProgress(s: AppState | null): boolean {
  return !!s && (Object.keys(s.concepts).length > 0 || Object.keys(s.achievements).length > 0 || !!s.simulation);
}

const side = (s: SimulationState): ConflictSide => ({
  roundsCompleted: s.rounds.length,
  completed: s.status === "completed",
  valuePaise: portfolioValue(s, s.prices),
  startedAt: s.startedAt,
});

/* ------------------------------------------------------------------ */
/* Lifecycle                                                           */
/* ------------------------------------------------------------------ */

export function initSync() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    set({ auth: "disabled" });
    return;
  }

  storeScope.onCommit(onCommit);
  // Supabase recommends not awaiting other auth calls inside this callback; defer the work.
  supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(() => void handleAuth(event, session), 0);
  });

  window.addEventListener("online", () => {
    if (currentUser && isDirty(currentUser.id)) void save();
  });
  window.addEventListener("pagehide", () => {
    if (currentUser && isDirty(currentUser.id)) void save();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshFromCloud();
  });
}

async function handleAuth(event: AuthChangeEvent, session: Session | null) {
  const user = session?.user ?? null;
  if (user) {
    if (currentUser?.id === user.id) {
      if ((event === "TOKEN_REFRESHED" || event === "SIGNED_IN") && snap.save === "expired") void save();
      return;
    }
    await attach(user);
    return;
  }
  if (currentUser) {
    detach(!explicitSignOut);
    return;
  }
  // No session at all. If this browser was showing a remembered account's cache, step back to anonymous.
  if (storeScope.key !== STORAGE_KEY) {
    setActiveUser(null);
    storeScope.switchTo(STORAGE_KEY, peekState(STORAGE_KEY) ?? defaultState());
    notify("warn", "You've been signed out. Sign in again to pick up your saved progress.");
  }
  set({ auth: "signed-out", user: null, save: "idle" });
}

async function attach(u: User) {
  const supabase = getSupabaseBrowserClient()!;
  const user = toAccountUser(u);
  currentUser = user;
  explicitSignOut = false;
  conflictData = null;
  initialSyncInProgress = true;
  set({ auth: "signed-in", user, save: "syncing", conflict: null });
  setActiveUser(user.id);

  const key = userStorageKey(user.id);
  const cached = peekState(key);
  const anonymous = peekState(STORAGE_KEY);
  const source: LocalSource = cached ? "account-cache" : "anonymous";
  const local = cached ?? anonymous ?? defaultState();
  storeScope.switchTo(key, local);

  let merged;
  try {
    const cloud = stateFromCloud(await loadCloudProgress(supabase));
    if (currentUser?.id !== user.id) return;
    merged = mergeStates(storeScope.getState(), cloud, source);
  } catch (e) {
    initialSyncInProgress = false;
    if (currentUser?.id !== user.id) return;
    await handleError(e, "load");
    return;
  }

  storeScope.replace(merged.state);
  initialSyncInProgress = false;

  if (merged.conflict) {
    conflictData = merged.conflict;
    set({ conflict: { local: side(merged.conflict.local), cloud: side(merged.conflict.cloud) } });
  }

  const migrating = source === "anonymous" && hasProgress(anonymous);
  if (merged.needsUpload || isDirty(user.id) || pendingAfterInitial) {
    pendingAfterInitial = false;
    markDirty(user.id);
    const ok = await save();
    if (ok && migrating && !merged.conflict) {
      clearState(STORAGE_KEY);
      notify("up", "Your progress on this device is now saved to your account.");
    }
  } else {
    set({ save: "saved", lastSavedAt: Date.now() });
    if (source === "anonymous" && !merged.conflict) clearState(STORAGE_KEY);
  }
}

function detach(expired: boolean) {
  const uid = currentUser!.id;
  const unsynced = isDirty(uid);
  currentUser = null;
  conflictData = null;
  if (saveTimer) clearTimeout(saveTimer);
  if (retryTimer) clearTimeout(retryTimer);
  setActiveUser(null);
  // On an explicit sign-out with everything uploaded, remove this account's copy from the device.
  // Otherwise keep it (privately keyed to the account) so nothing is lost; it merges on next sign-in.
  if (!expired && !unsynced) clearState(userStorageKey(uid));
  storeScope.switchTo(STORAGE_KEY, peekState(STORAGE_KEY) ?? defaultState());
  set({ auth: "signed-out", user: null, save: "idle", conflict: null, lastSavedAt: null });
  if (expired) notify("warn", "Your session has ended. Sign in again to continue saving — your recent progress is kept on this device.");
  else if (unsynced) notify("warn", "Signed out. Some recent progress couldn't be uploaded yet; it will sync the next time you sign in on this device.");
  else notify("neutral", "Signed out. Your progress is safely saved to your account.");
  explicitSignOut = false;
}

/* ------------------------------------------------------------------ */
/* Saving                                                              */
/* ------------------------------------------------------------------ */

function onCommit(_state: AppState, reason: CommitReason) {
  if (!currentUser) return;
  if (reason === "reset") {
    // The device copy was erased (Your data page): restore from the account.
    lastRefreshAt = 0;
    void refreshFromCloud(true);
    return;
  }
  markDirty(currentUser.id);
  if (initialSyncInProgress) {
    pendingAfterInitial = true;
    return;
  }
  // Never claim "saved" while a change is waiting to upload.
  if (snap.save !== "expired") set({ save: "saving" });
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void save(), SAVE_DEBOUNCE_MS);
}

/** Upload the current state. Resolves true when the cloud has it. */
async function save(): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !currentUser) return false;
  if (initialSyncInProgress) {
    pendingAfterInitial = true;
    return false;
  }
  if (inFlight) {
    saveAgain = true;
    return false;
  }
  if (saveTimer) clearTimeout(saveTimer);
  inFlight = true;
  const uid = currentUser.id;
  set({ save: "saving" });
  let ok = false;
  try {
    const state = storeScope.getState();
    const result = await saveCloudProgress(supabase, toPayload(state));
    if (currentUser?.id !== uid) return false;
    retryCount = 0;
    if (!saveAgain) clearDirty(uid);
    set({ save: "saved", lastSavedAt: Date.now() });
    ok = true;
    // The cloud is further along for this run (another tab or device): adopt it.
    if (state.simulation && !result.simulation_applied && (result.stored_rank ?? 0) > progressRank(state.simulation)) {
      await refreshFromCloud(true);
    }
  } catch (e) {
    if (currentUser?.id === uid) await handleError(e, "save");
  } finally {
    inFlight = false;
    if (saveAgain && currentUser) {
      saveAgain = false;
      void save();
    }
  }
  return ok;
}

async function handleError(e: unknown, op: "load" | "save") {
  const supabase = getSupabaseBrowserClient();
  const kind = e instanceof CloudError ? e.kind : "server";
  if (kind === "auth" && supabase) {
    const { error } = await supabase.auth.refreshSession();
    if (!error) {
      if (op === "load" && currentUser) {
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          currentUser = null;
          await attach(data.user);
        }
      } else void save();
      return;
    }
    set({ save: "expired" });
    notify("warn", "Your session has expired. Sign in again to keep saving — progress on this device is kept.");
    return;
  }
  set({ save: "error" });
  if (retryCount === 0) {
    notify(
      "down",
      op === "load"
        ? "Couldn't load your saved progress. You can keep going — we'll retry and merge automatically."
        : "Couldn't save your progress. It's safe on this device and we'll keep retrying.",
    );
  }
  if (retryCount < RETRY_DELAYS.length) {
    const delay = RETRY_DELAYS[retryCount++];
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (!currentUser) return;
      if (op === "load") {
        const supabase2 = getSupabaseBrowserClient();
        void supabase2?.auth.getUser().then(({ data }) => {
          if (data.user && currentUser) {
            currentUser = null;
            void attach(data.user);
          }
        });
      } else void save();
    }, delay);
  }
}

/** Pull newer progress made on another device or tab. */
async function refreshFromCloud(force = false) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase || !currentUser || initialSyncInProgress || inFlight || conflictData) return;
  if (!force && (isDirty(currentUser.id) || Date.now() - lastRefreshAt < REFRESH_THROTTLE_MS)) return;
  lastRefreshAt = Date.now();
  const uid = currentUser.id;
  try {
    const cloud = stateFromCloud(await loadCloudProgress(supabase));
    if (currentUser?.id !== uid) return;
    const local = storeScope.getState();
    const merged = mergeStates(local, cloud, "account-cache");
    const simChanged = JSON.stringify(merged.state.simulation) !== JSON.stringify(local.simulation);
    if (simChanged || JSON.stringify(merged.state.concepts) !== JSON.stringify(local.concepts)) {
      storeScope.replace(merged.state);
      if (simChanged) notify("neutral", "Loaded your latest progress from another device.");
    }
    if (merged.needsUpload) {
      markDirty(uid);
      void save();
    }
  } catch {
    /* background refresh: stay quiet, the next save or focus will retry */
  }
}

/* ------------------------------------------------------------------ */
/* Public actions                                                      */
/* ------------------------------------------------------------------ */

export const sync = {
  async signInWithGoogle(next: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Sign-in isn't configured.");
    // Make sure the auth service is reachable before leaving the app, so a misconfigured or
    // unreachable project shows a message here instead of a browser error page.
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/health`, { headers: { apikey: SUPABASE_KEY }, signal: AbortSignal.timeout(6000) });
    } catch {
      throw new Error(
        "We can't reach the sign-in service right now. Please try again in a moment — or continue without signing in; your progress stays in this browser.",
      );
    }
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { prompt: "select_account" } },
    });
    if (error) throw error;
  },

  async signOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !currentUser) return;
    explicitSignOut = true;
    if (isDirty(currentUser.id)) {
      await Promise.race([save(), new Promise((r) => setTimeout(r, 4_000))]);
    }
    const { error } = await supabase.auth.signOut({ scope: "local" });
    // signOut clears the local session even if the network call fails; make sure we detach either way.
    if (error && currentUser) detach(false);
  },

  /** Retry now (from the user menu or an error toast). */
  async syncNow() {
    if (!currentUser) return;
    retryCount = 0;
    markDirty(currentUser.id);
    const ok = await save();
    if (ok) {
      lastRefreshAt = 0;
      await refreshFromCloud(true);
      notify("up", "All progress saved.");
    }
  },

  /** The user's explicit choice after an anonymous run met an existing account run. */
  resolveConflict(choice: "account" | "device") {
    if (!conflictData || !currentUser) return;
    const { local } = conflictData;
    conflictData = null;
    set({ conflict: null });
    if (choice === "device") {
      // Re-stamp the run so it becomes the account's most recent one (its history is unchanged).
      const adopted: SimulationState = { ...local, startedAt: Date.now() };
      storeScope.replace({ ...storeScope.getState(), simulation: adopted });
      markDirty(currentUser.id);
      void save().then((ok) => {
        if (ok) clearState(STORAGE_KEY);
      });
      notify("up", "Kept this device's simulation and saved it to your account. Your earlier run stays in your history.");
    } else {
      clearState(STORAGE_KEY);
      notify("neutral", "Kept your account's simulation.");
    }
  },

  async deleteCloudProgress() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !currentUser) return;
    await deleteCloudProgress(supabase);
    clearDirty(currentUser.id);
    storeScope.replace({ ...defaultState(), analytics: storeScope.getState().analytics });
    set({ lastSavedAt: Date.now(), save: "saved" });
    notify("neutral", "Your saved progress was deleted.");
  },

  dismissMessage() {
    set({ message: null });
  },
};
