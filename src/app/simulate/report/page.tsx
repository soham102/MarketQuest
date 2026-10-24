import type { Metadata } from "next";
import { Report } from "@/components/simulate/report";

export const metadata: Metadata = { title: "Final report" };

export default function ReportPage() {
  return <Report />;
}
