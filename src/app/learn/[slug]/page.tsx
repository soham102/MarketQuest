import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONCEPTS, getConcept } from "@/content/concepts";
import { LessonView } from "@/components/learn/lesson-view";
import { Skeleton } from "@/components/ui/skeleton";

export function generateStaticParams() {
  return CONCEPTS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: getConcept(slug)?.title ?? "Lesson" };
}

export default function LessonPage({ params }: PageProps<"/learn/[slug]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading lesson">
          <Skeleton className="h-24" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      }
    >
      <Lesson params={params} />
    </Suspense>
  );
}

async function Lesson({ params }: Pick<PageProps<"/learn/[slug]">, "params">) {
  const { slug } = await params;
  const concept = getConcept(slug);
  if (!concept) notFound();
  return <LessonView key={concept.slug} concept={concept} />;
}
