import type { AppState } from "@/lib/types";

/** Anonymous progress. Signed-in users get their own key (see userStorageKey). */
export const STORAGE_KEY = "marketquest:v1";

/** Per-account cache, so different accounts (and anonymous use) never share local data. */
export function userStorageKey(userId: string) {
  return `${STORAGE_KEY}:user:${userId}`;
}

/** Remembers which account's cache to show on the next page load (cleared on sign-out). */
const ACTIVE_USER_KEY = `${STORAGE_KEY}:active-user`;

export function getActiveUser(): string | null {
  try {
    return window.localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

export function setActiveUser(userId: string | null) {
  try {
    if (userId) window.localStorage.setItem(ACTIVE_USER_KEY, userId);
    else window.localStorage.removeItem(ACTIVE_USER_KEY);
  } catch {
    /* storage unavailable */
  }
}

export const STATE_VERSION = 1;

export function defaultState(): AppState {
  return {
    version: STATE_VERSION,
    onboarded: false,
    concepts: {},
    simulation: null,
    achievements: {},
    analytics: [],
  };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Light structural validation so a corrupted or outdated save can't crash the app. */
export function parseState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!isObject(data) || data.version !== STATE_VERSION) return null;
    if (!isObject(data.concepts) || !isObject(data.achievements) || !Array.isArray(data.analytics)) return null;
    const sim = data.simulation;
    if (sim !== null) {
      if (!isObject(sim) || typeof sim.cash !== "number" || !isObject(sim.holdings) || !isObject(sim.prices) || !Array.isArray(sim.rounds)) {
        return null;
      }
    }
    return { ...defaultState(), ...(data as unknown as AppState) };
  } catch {
    return null;
  }
}

export type LoadResult = { state: AppState; error: string | null };

export function loadState(key: string = STORAGE_KEY): LoadResult {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return { state: defaultState(), error: null };
    const parsed = parseState(raw);
    if (!parsed) {
      return { state: defaultState(), error: "Your saved progress couldn't be read, so MarketQuest started fresh." };
    }
    return { state: parsed, error: null };
  } catch {
    return { state: defaultState(), error: "Browser storage is unavailable, so progress won't be saved in this session." };
  }
}

/** Read a stored state without switching to it. Null when absent or unreadable. */
export function peekState(key: string): AppState | null {
  try {
    return parseState(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

export function saveState(state: AppState, key: string = STORAGE_KEY): string | null {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
    return null;
  } catch {
    return "Progress couldn't be saved — your browser storage may be full or disabled.";
  }
}

export function clearState(key: string = STORAGE_KEY) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage unavailable; nothing to clear */
  }
}
