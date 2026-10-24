"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, HelpCircle, X } from "lucide-react";
import { TOURS, tourKeyFor, type TourStep } from "@/content/tours";
import { actions, useStore } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Pages where the helper isn't useful (sign-in flow). */
const HIDDEN_ON = ["/sign-in", "/login", "/auth"];

/** First visible element for a tour target (desktop and mobile variants can share a target). */
function findTarget(target: string | undefined): HTMLElement | null {
  if (!target) return null;
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Helper button                                                       */
/* ------------------------------------------------------------------ */

export function TourHelper() {
  const pathname = usePathname();
  const { state, hydrated } = useStore();
  const [steps, setSteps] = useState<TourStep[] | null>(null);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  const isNew = hydrated && !state.onboarded;

  const start = () => {
    const key = tourKeyFor(pathname, (t) => !!findTarget(t));
    setSteps(TOURS[key]);
  };

  const close = () => {
    setSteps(null);
    if (!state.onboarded) actions.completeOnboarding();
  };

  return (
    <>
      <button
        type="button"
        data-tour="tour-helper"
        onClick={start}
        aria-haspopup="dialog"
        aria-label={isNew ? "New here? Take a quick tour of this page" : "Help: tour this page"}
        className={cn(
          "tour-helper fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full border shadow-xl shadow-black/40 transition-[transform,background-color] hover:-translate-y-0.5 md:bottom-6 md:right-6",
          // Lift above sticky call-to-action bars (e.g. the debrief's Continue bar).
          "[body:has([data-sticky-cta])_&]:bottom-56 md:[body:has([data-sticky-cta])_&]:bottom-28",
          isNew
            ? "border-brand/60 bg-brand py-2.5 pl-3 pr-4 text-sm font-semibold text-brand-fg hover:bg-brand-strong"
            : "size-12 justify-center border-border-strong bg-surface-2 text-fg hover:bg-surface-3",
        )}
      >
        {isNew && <span aria-hidden className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand/40 [animation-duration:2.4s]" />}
        {isNew ? <Compass className="size-4" aria-hidden /> : <HelpCircle className="size-5" aria-hidden />}
        {isNew && <span>New here? Take a tour</span>}
      </button>
      {steps && <GuidedTour steps={steps} onClose={close} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Tour overlay                                                        */
/* ------------------------------------------------------------------ */

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 8;
const CARD_W = 360;
const GAP = 14;

export function GuidedTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardH, setCardH] = useState(200);
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const step = steps[index];
  const last = index === steps.length - 1;

  const measure = useCallback(() => {
    const el = findTarget(step.target);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step.target]);

  // Bring the target into view, then keep the spotlight on it while scrolling/resizing.
  useLayoutEffect(() => {
    const el = findTarget(step.target);
    if (el) {
      const r = el.getBoundingClientRect();
      const offscreen = r.top < 80 || r.bottom > window.innerHeight - 120;
      if (offscreen) el.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    const frame = requestAnimationFrame(measure);
    const t = setTimeout(measure, 450); // after smooth scroll settles
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(t);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step.target, measure]);

  // Track the card's real height so it can be placed above/below the target without overflowing.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const ro = new ResizeObserver(([entry]) => setCardH(entry.target instanceof HTMLElement ? entry.target.offsetHeight : 200));
    ro.observe(card);
    return () => ro.disconnect();
  }, []);

  // Move keyboard focus to the card on every step, for screen readers and keyboard users.
  useEffect(() => {
    cardRef.current?.focus();
  }, [index]);

  const next = () => (last ? onClose() : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));

  // Keyboard: Esc skips, arrows move, Tab stays inside the card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") back();
      else if (e.key === "Tab" && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>("button");
        const first = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Return focus to the helper button when the tour ends.
  useEffect(() => {
    return () => document.querySelector<HTMLElement>('[data-tour="tour-helper"]')?.focus();
  }, []);

  // Card position: below the target if it fits, otherwise above, otherwise centred.
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const width = Math.min(CARD_W, vw - 32);
  let cardStyle: React.CSSProperties;
  if (rect) {
    const left = Math.min(Math.max(16, rect.left + rect.width / 2 - width / 2), vw - width - 16);
    const below = rect.top + rect.height + GAP;
    const above = rect.top - GAP - cardH;
    const top = below + cardH <= vh - 16 ? below : above >= 16 ? above : Math.max(16, (vh - cardH) / 2);
    cardStyle = { top, left, width };
  } else {
    cardStyle = { top: Math.max(16, (vh - cardH) / 2), left: (vw - width) / 2, width };
  }

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {/* Dim layer with a cut-out spotlight around the target */}
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl ring-2 ring-brand transition-[top,left,width,height] duration-300 ease-out"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: "0 0 0 9999px rgba(4, 8, 17, 0.72)" }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-[#040811]/72" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="fixed flex animate-fade-up flex-col gap-3 rounded-2xl border border-border-strong bg-surface p-5 shadow-2xl shadow-black/60 outline-none"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="num text-xs font-semibold uppercase tracking-wider text-brand">
            Step {index + 1} of {steps.length}
          </p>
          <button type="button" onClick={onClose} className="-m-1 rounded p-1 text-subtle hover:text-fg" aria-label="Close tour">
            <X className="size-4" />
          </button>
        </div>
        <h2 id={titleId} className="text-lg font-semibold leading-snug text-fg">
          {step.title}
        </h2>
        <p id={bodyId} className="text-sm leading-relaxed text-muted">
          {step.body}
        </p>
        <div className="flex gap-1" aria-hidden>
          {steps.map((_, i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-brand" : "bg-surface-3")} />
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Skip tour
          </Button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" onClick={back}>
                <ArrowLeft /> Back
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {last ? "Finish" : "Next"} {!last && <ArrowRight />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
