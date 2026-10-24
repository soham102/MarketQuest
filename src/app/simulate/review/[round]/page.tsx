import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ROUNDS } from "@/content/rounds";
import { ReviewView, SimulationSkeleton } from "@/components/simulate/play-view";

export function generateStaticParams() {
  return ROUNDS.map((r) => ({ round: String(r.id) }));
}

export async function generateMetadata({ params }: PageProps<"/simulate/review/[round]">): Promise<Metadata> {
  const { round } = await params;
  return { title: `Round ${round} review` };
}

export default function ReviewPage({ params }: PageProps<"/simulate/review/[round]">) {
  return (
    <Suspense fallback={<SimulationSkeleton />}>
      <Review params={params} />
    </Suspense>
  );
}

async function Review({ params }: Pick<PageProps<"/simulate/review/[round]">, "params">) {
  const { round } = await params;
  const id = Number(round);
  if (!ROUNDS.some((r) => r.id === id)) notFound();
  return <ReviewView roundId={id} />;
}
