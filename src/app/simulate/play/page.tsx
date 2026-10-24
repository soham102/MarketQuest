import type { Metadata } from "next";
import { PlayView } from "@/components/simulate/play-view";

export const metadata: Metadata = { title: "Simulation terminal" };

export default function PlayPage() {
  return <PlayView />;
}
