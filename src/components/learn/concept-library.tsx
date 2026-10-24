"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import { CATEGORIES, CONCEPTS } from "@/content/concepts";
import type { ConceptCategory } from "@/lib/types";
import { useStore } from "@/lib/store/store";
import { conceptStatus, learningProgress } from "@/lib/selectors";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ConceptCard } from "./concept-card";

type Filter = ConceptCategory | "all";

export function ConceptLibrary() {
  const { state, hydrated } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CONCEPTS.filter((c) => {
      if (filter !== "all" && c.category !== filter) return false;
      if (!q) return true;
      const haystack = [c.title, c.summary, ...c.intro.keyTerms.map((k) => k.term)].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, filter]);

  const progress = learningProgress(state);
  const grouped = CATEGORIES.map((cat) => ({ ...cat, items: results.filter((c) => c.category === cat.id) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-up">
      <SectionHeading
        as="h1"
        eyebrow="Learn"
        title="Concept library"
        description="Interactive lessons on how markets work. Each one ends with a quick check and links to a simulation round where you can apply it."
        action={
          hydrated ? (
            <div className="w-full min-w-56 rounded-xl border border-border bg-surface p-4 sm:w-auto">
              <p className="text-xs text-muted">
                <span className="num font-semibold text-fg">{progress.completed}</span> of {progress.total} completed
              </p>
              <Progress value={progress.pct} label="Concepts completed" className="mt-2" />
            </div>
          ) : (
            <Skeleton className="h-16 w-56 rounded-xl" />
          )
        }
      />

      <div className="flex flex-col gap-3">
        <div className="relative max-w-md" data-tour="learn-search">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts, e.g. P/E, inflation, diversification"
            aria-label="Search concepts"
            className="pl-9"
          />
        </div>
        <div role="group" aria-label="Filter by category" data-tour="learn-filters" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ id: "all" as const, name: "All topics" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={filter === c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === c.id
                  ? "border-brand/50 bg-brand/15 text-fg"
                  : "border-border text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <p className="text-sm text-subtle" aria-live="polite">
          {results.length} module{results.length === 1 ? "" : "s"}
        </p>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="No modules match your search"
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        >
          Try a broader term like &ldquo;rates&rdquo; or &ldquo;portfolio&rdquo;.
        </EmptyState>
      ) : (
        grouped.map((g) => (
          <section key={g.id} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{g.name}</h2>
              <p className="text-sm text-muted">{g.description}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((c) =>
                hydrated ? (
                  <div key={c.slug} data-tour="learn-card" className="flex">
                    <ConceptCard concept={c} status={conceptStatus(state, c.slug)} className="flex-1" />
                  </div>
                ) : (
                  <Skeleton key={c.slug} className="h-64 rounded-2xl" />
                ),
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
