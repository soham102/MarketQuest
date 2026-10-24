"use client";

import Link from "next/link";
import { CandlestickChart, History, Trophy } from "lucide-react";
import { getRound } from "@/content/rounds";
import { useStore } from "@/lib/store/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/misc";
import { Debrief } from "./debrief";
import { Terminal } from "./terminal";

export function SimulationSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading simulation">
      <Skeleton className="h-24" />
      <Skeleton className="h-24 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-[32rem] rounded-2xl lg:col-span-7" />
        <Skeleton className="h-[32rem] rounded-2xl lg:col-span-5" />
      </div>
    </div>
  );
}

export function PlayView() {
  const { state, hydrated } = useStore();
  if (!hydrated) return <SimulationSkeleton />;
  const sim = state.simulation;

  if (!sim) {
    return (
      <EmptyState
        icon={<CandlestickChart />}
        title="No simulation in progress"
        className="mx-auto mt-10 max-w-lg"
        action={
          <Button asChild>
            <Link href="/simulate">Go to the simulation lobby</Link>
          </Button>
        }
      >
        Choose a risk profile and start with ₹1,00,000 of virtual money.
      </EmptyState>
    );
  }

  if (sim.status === "completed") {
    return (
      <EmptyState
        icon={<Trophy />}
        title="You've completed all ten rounds"
        className="mx-auto mt-10 max-w-lg"
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/simulate/report">View your report</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/simulate/review/1">
                <History /> Review rounds
              </Link>
            </Button>
          </div>
        }
      >
        Review your decisions or restart from the lobby.
      </EmptyState>
    );
  }

  if (sim.phase === "debrief") {
    const record = sim.rounds.find((r) => r.round === sim.currentRound)!;
    return <Debrief key={`debrief-${sim.startedAt}-${sim.currentRound}`} round={getRound(sim.currentRound)} record={record} mode="live" completedRounds={sim.rounds.length} />;
  }

  return <Terminal key={`round-${sim.startedAt}-${sim.currentRound}`} sim={sim} />;
}

export function ReviewView({ roundId }: { roundId: number }) {
  const { state, hydrated } = useStore();
  if (!hydrated) return <SimulationSkeleton />;
  const sim = state.simulation;
  const record = sim?.rounds.find((r) => r.round === roundId);
  if (!sim || !record) {
    return (
      <EmptyState
        icon={<History />}
        title={`Round ${roundId} hasn't been played yet`}
        className="mx-auto mt-10 max-w-lg"
        action={
          <Button asChild>
            <Link href={sim ? "/simulate/play" : "/simulate"}>{sim ? "Continue the simulation" : "Go to the lobby"}</Link>
          </Button>
        }
      >
        Debriefs become available for review once a round is resolved.
      </EmptyState>
    );
  }
  return <Debrief key={`review-${sim.startedAt}-${roundId}`} round={getRound(roundId)} record={record} mode="review" completedRounds={sim.rounds.length} />;
}
