"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Cloud, Laptop, LockKeyhole, RefreshCcw, ShieldCheck } from "lucide-react";
import { AUTH_CONFIGURED, safeNextPath } from "@/lib/supabase/config";
import { useSync } from "@/lib/sync/engine";
import { Callout } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { continueAsGuest } from "@/lib/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/layout/logo";
import { GoogleButton } from "./google-button";

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again, or keep exploring without an account.",
  provider: "Google couldn't complete the sign-in. Please try again.",
  exchange_failed: "We couldn't finish signing you in — the sign-in link may have expired. Please try again.",
  missing_code: "The sign-in response was incomplete. Please try again.",
  unconfigured: "Sign-in isn't set up on this deployment yet.",
};

const BENEFITS = [
  { icon: Cloud, text: "Lessons, quiz answers and your 10-round simulation are saved to your account." },
  { icon: Laptop, text: "Pick up where you left off on any device." },
  { icon: RefreshCcw, text: "Progress you've already made on this device is carried over." },
  { icon: ShieldCheck, text: "We only use your Google name, email and photo. Your progress is private to you." },
];

export function SignInView() {
  const params = useSearchParams();
  const router = useRouter();
  const sync = useSync();
  const next = safeNextPath(params.get("next"));
  const errorCode = params.get("error");
  const [clientError, setClientError] = useState<string | null>(null);

  // A signed-in user whose session has expired needs to re-authenticate, so stay here for them.
  const expired = sync.auth === "signed-in" && sync.save === "expired";

  // Already signed in with a session the server has accepted (initial sync finished): continue.
  const verified = sync.auth === "signed-in" && (sync.save === "saved" || sync.save === "saving");
  useEffect(() => {
    if (verified) router.replace(next);
  }, [verified, next, router]);

  const error = clientError ?? (errorCode ? (ERRORS[errorCode] ?? ERRORS.provider) : null);

  return (
    <div className="relative mx-auto flex max-w-md flex-col items-center gap-8 py-6 sm:py-12 animate-fade-up">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-72 max-w-lg rounded-full bg-brand/10 blur-3xl" />
      <header className="relative flex flex-col items-center gap-4 text-center">
        <Logo />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Welcome to MarketQuest</h1>
          <p className="mt-2 text-muted">
            Learn how the stock market works through interactive lessons and a 10-round simulation with ₹1,00,000 of virtual money. Sign in to save your
            progress across devices.
          </p>
        </div>
      </header>

      <div className="relative flex w-full flex-col gap-5 rounded-3xl border border-border-strong bg-surface p-6 sm:p-8">
        {expired && !error && (
          <p role="status" className="flex gap-2 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-fg/90">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            Your session expired. Sign in again to resume saving — nothing on this device has been lost.
          </p>
        )}
        {error && (
          <p role="alert" className="flex gap-2 rounded-lg border border-warn/40 bg-warn/10 p-3 text-sm text-fg/90">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
            {error}
          </p>
        )}

        {!AUTH_CONFIGURED ? (
          <>
            <GoogleButton disabled />
            <Callout tone="warn" icon={<LockKeyhole />} title="Sign-in is coming soon">
              Google sign-in will be available once accounts are connected. Until then, everything works without an account — your progress is kept in
              this browser.
            </Callout>
          </>
        ) : sync.auth === "loading" || (sync.auth === "signed-in" && !expired) ? (
          <Skeleton className="h-12 rounded-lg" />
        ) : (
          <GoogleButton next={next} onError={setClientError} />
        )}

        <ul className="flex flex-col gap-3 border-t border-border pt-5">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex gap-3 text-sm text-fg/85">
              <b.icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
              {b.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex w-full flex-col items-center gap-2">
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            continueAsGuest();
            router.push(next);
          }}
        >
          Continue without signing in <ArrowRight />
        </Button>
        <p className="text-center text-xs text-subtle">No account needed to learn — your progress stays in this browser.</p>
      </div>
    </div>
  );
}
