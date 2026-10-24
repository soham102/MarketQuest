import Link from "next/link";
import { CheckCircle2, CircleDashed, Clock, PlayCircle } from "lucide-react";
import { CATEGORIES } from "@/content/concepts";
import type { ConceptModule } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ConceptPreview } from "./concept-preview";

export type ConceptStatus = "not-started" | "in-progress" | "completed";

const STATUS = {
  "not-started": { label: "Not started", icon: CircleDashed, tone: "neutral" as const },
  "in-progress": { label: "In progress", icon: PlayCircle, tone: "brand" as const },
  completed: { label: "Completed", icon: CheckCircle2, tone: "up" as const },
};

export function ConceptCard({ concept, status, className }: { concept: ConceptModule; status: ConceptStatus; className?: string }) {
  const s = STATUS[status];
  const category = CATEGORIES.find((c) => c.id === concept.category);
  return (
    <Link
      href={`/learn/${concept.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:bg-surface-2/60",
        className,
      )}
    >
      <div className="relative h-28 border-b border-border bg-surface-2/60 px-10 pt-6 pb-2">
        <ConceptPreview kind={concept.preview} />
        <Badge tone={s.tone} className="absolute left-3 top-3 bg-bg/80 backdrop-blur">
          <s.icon aria-hidden />
          {s.label}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{category?.name}</p>
        <h3 className="font-semibold leading-snug text-fg group-hover:text-brand">{concept.title}</h3>
        <p className="line-clamp-2 text-sm text-muted">{concept.summary}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-subtle">
          <span>{concept.difficulty}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {concept.minutes} min
          </span>
        </div>
      </div>
    </Link>
  );
}
