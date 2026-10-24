"use client";

import { useState } from "react";
import { BarChart3, ShieldCheck, Trash2 } from "lucide-react";
import type { AnalyticsEventName } from "@/lib/types";
import { actions, useStore } from "@/lib/store/store";
import { useSync } from "@/lib/sync/engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout, EmptyState, SectionHeading } from "@/components/ui/misc";

const LABELS: Record<AnalyticsEventName, string> = {
  concept_opened: "Concept opened",
  concept_completed: "Concept completed",
  simulation_started: "Simulation started",
  order_submitted: "Order submitted",
  round_completed: "Round completed",
  debrief_viewed: "Debrief viewed",
  knowledge_check_answered: "Knowledge check answered",
  simulation_completed: "Simulation completed",
  simulation_restarted: "Simulation restarted",
};

export function DataView() {
  const { state, hydrated } = useStore();
  const sync = useSync();
  const signedIn = sync.auth === "signed-in";
  const [done, setDone] = useState(false);
  if (!hydrated) return <Skeleton className="h-96 rounded-2xl" />;

  const counts = Object.keys(LABELS).map((name) => ({
    name: name as AnalyticsEventName,
    count: state.analytics.filter((e) => e.name === name).length,
  }));
  const recent = [...state.analytics].reverse().slice(0, 25);

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <SectionHeading
        as="h1"
        eyebrow="Privacy"
        title="Your data"
        description={
          signedIn
            ? "You're signed in, so your progress is also saved to your account. The event log below stays only in this browser."
            : "You're not signed in, so everything below lives only in this browser's local storage."
        }
      />
      <Callout tone="up" icon={<ShieldCheck />} title="What we store">
        Lesson progress, your virtual simulation state, achievements, and a short log of product events (listed below) used to understand how the learning
        flow is used. No real financial information or device identifiers are collected. If you sign in with Google, your name, email and photo
        identify your account and your progress is stored privately in it — the event log is never uploaded.
      </Callout>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <BarChart3 className="size-4 text-brand" aria-hidden /> Event counts
            </CardTitle>
            <CardDescription>Most recent {state.analytics.length} events are kept (older ones roll off).</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <caption className="sr-only">Count of each tracked event</caption>
              <tbody>
                {counts.map((c) => (
                  <tr key={c.name} className="border-t border-border/60 first:border-0">
                    <td className="py-2 text-muted">{LABELS[c.name]}</td>
                    <td className="num py-2 text-right font-medium text-fg">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState icon={<BarChart3 />} title="No events yet">
                Open a lesson or start the simulation and activity will appear here.
              </EmptyState>
            ) : (
              <ul className="flex flex-col gap-1.5 text-sm">
                {recent.map((e, i) => (
                  <li key={`${e.at}-${i}`} className="flex justify-between gap-3 border-t border-border/60 pt-1.5 first:border-0 first:pt-0">
                    <span className="text-fg/90">
                      {LABELS[e.name]}
                      {e.props && (
                        <span className="block truncate text-xs text-subtle">
                          {Object.entries(e.props)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                    <time className="num shrink-0 text-xs text-subtle" dateTime={new Date(e.at).toISOString()}>
                      {new Date(e.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="flex flex-col gap-4 border-down/30 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-fg">Erase this browser&apos;s data</p>
          <p className="text-sm text-muted">
            {signedIn ? (
              <>
                Clears this browser&apos;s copy and the event log. Your account progress is kept and reloads automatically — to delete it, use your{" "}
                <a href="/account" className="text-brand hover:underline">
                  account page
                </a>
                .
              </>
            ) : (
              "Deletes lessons, simulation, achievements and the event log from this browser."
            )}
          </p>
          {done && (
            <p role="status" className="mt-1 text-sm text-up">
              All data erased.
            </p>
          )}
        </div>
        <ConfirmDialog
          trigger={
            <Button variant="danger">
              <Trash2 /> Erase all data
            </Button>
          }
          destructive
          title="Erase all MarketQuest data?"
          description="This can't be undone. You'll start again as a new learner."
          confirmLabel="Erase everything"
          onConfirm={() => {
            actions.resetAll();
            setDone(true);
          }}
        />
      </Card>
    </div>
  );
}
