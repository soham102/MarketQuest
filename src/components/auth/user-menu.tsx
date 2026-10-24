"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { AlertTriangle, Check, CloudOff, Loader2, LogIn, LogOut, RefreshCcw, UserRound } from "lucide-react";
import { sync, useSync, type SyncSnapshot } from "@/lib/sync/engine";
import { cn } from "@/lib/utils";
import { clearGuest } from "@/lib/guest";

export function Avatar({ name, url, size = 32 }: { name: string; url: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return url && !failed ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote Google avatar; next/image would need a domain allow-list
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className="flex items-center justify-center rounded-full bg-brand/20 text-xs font-semibold text-brand"
      style={{ width: size, height: size }}
    >
      {initials || <UserRound className="size-4" />}
    </span>
  );
}

export function saveStatusText(s: SyncSnapshot): { text: string; tone: "up" | "down" | "warn" | "neutral"; icon: React.ReactNode } {
  switch (s.save) {
    case "syncing":
      return { text: "Syncing your progress…", tone: "neutral", icon: <Loader2 className="size-3.5 animate-spin" aria-hidden /> };
    case "saving":
      return { text: "Saving…", tone: "neutral", icon: <Loader2 className="size-3.5 animate-spin" aria-hidden /> };
    case "error":
      return { text: "Not saved — retrying", tone: "down", icon: <CloudOff className="size-3.5" aria-hidden /> };
    case "expired":
      return { text: "Session expired — sign in again", tone: "warn", icon: <AlertTriangle className="size-3.5" aria-hidden /> };
    case "saved":
      return { text: "All progress saved", tone: "up", icon: <Check className="size-3.5" aria-hidden /> };
    default:
      return { text: "Ready", tone: "neutral", icon: <Check className="size-3.5" aria-hidden /> };
  }
}

/** Sign out, forget the guest choice, and return to the sign-in page. */
export function useSignOut() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const signOut = async () => {
    setPending(true);
    try {
      await sync.signOut();
    } finally {
      clearGuest();
      setPending(false);
      router.push("/sign-in");
    }
  };
  return { signOut, pending };
}

const toneText = { up: "text-up", down: "text-down", warn: "text-warn", neutral: "text-muted" } as const;
const toneDot = { up: "bg-up", down: "bg-down", warn: "bg-warn", neutral: "bg-subtle" } as const;

export function UserMenu() {
  const s = useSync();
  const pathname = usePathname();
  const { signOut, pending } = useSignOut();

  if (s.auth === "loading") return <span className="size-8 animate-pulse rounded-full bg-surface-3" aria-label="Checking sign-in" />;

  if (s.auth === "signed-out" || s.auth === "disabled" || !s.user) {
    const next = pathname === "/sign-in" ? "/" : pathname;
    return (
      <Link
        href={`/sign-in?next=${encodeURIComponent(next)}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong px-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
      >
        <LogIn className="size-4" aria-hidden />
        Sign in
      </Link>
    );
  }

  const status = saveStatusText(s);
  const displayName = s.user.name ?? s.user.email ?? "Your account";

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger
          className="relative rounded-full outline-offset-2 transition-opacity hover:opacity-90"
          aria-label={`Account menu for ${displayName}. ${status.text}`}
        >
          <Avatar name={displayName} url={s.user.avatarUrl} />
          <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-bg", toneDot[status.tone])} aria-hidden />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 w-72 rounded-xl border border-border-strong bg-surface p-1.5 shadow-2xl shadow-black/40"
          >
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <Avatar name={displayName} url={s.user.avatarUrl} size={36} />
              <div className="min-w-0">
                {s.user.name && <p className="truncate text-sm font-medium text-fg">{s.user.name}</p>}
                {s.user.email && <p className="truncate text-xs text-muted">{s.user.email}</p>}
              </div>
            </div>
            <p role="status" className={cn("flex items-center gap-1.5 px-2.5 pb-2 text-xs", toneText[status.tone])}>
              {status.icon}
              {status.text}
            </p>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild>
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
              >
                <UserRound className="size-4 text-muted" aria-hidden /> Account &amp; saved progress
              </Link>
            </DropdownMenu.Item>
            {(s.save === "error" || s.save === "saved") && (
              <DropdownMenu.Item
                onSelect={() => void sync.syncNow()}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
              >
                <RefreshCcw className="size-4 text-muted" aria-hidden /> Sync now
              </DropdownMenu.Item>
            )}
            {s.save === "expired" && (
              <DropdownMenu.Item asChild>
                <Link
                  href={`/sign-in?next=${encodeURIComponent(pathname)}`}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-warn outline-none data-[highlighted]:bg-surface-2"
                >
                  <LogIn className="size-4" aria-hidden /> Sign in again
                </Link>
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              onSelect={() => void signOut()}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-fg outline-none data-[highlighted]:bg-surface-2"
            >
              <LogOut className="size-4 text-muted" aria-hidden /> Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={pending}
        aria-label="Sign out"
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-strong px-2 text-sm font-medium text-fg transition-colors hover:bg-surface-2 disabled:opacity-60 sm:px-3"
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </div>
  );
}
