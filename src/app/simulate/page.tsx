import type { Metadata } from "next";
import { Lobby } from "@/components/simulate/lobby";

export const metadata: Metadata = { title: "Simulation lobby" };

export default function SimulatePage() {
  return <Lobby />;
}
