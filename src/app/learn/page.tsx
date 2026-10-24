import type { Metadata } from "next";
import { ConceptLibrary } from "@/components/learn/concept-library";

export const metadata: Metadata = { title: "Concept library" };

export default function LearnPage() {
  return <ConceptLibrary />;
}
