"use client";

import { useId, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import type { KnowledgeCheck as KC } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * One multiple-choice question. The first submitted answer is final (it's what's scored),
 * and the explanation is shown whether the answer was right or wrong.
 */
export function KnowledgeCheck({
  check,
  answered,
  onAnswer,
  index,
}: {
  check: KC;
  /** Previously recorded answer, if any. */
  answered?: number | null;
  onAnswer: (answer: number, correct: boolean) => void;
  index?: number;
}) {
  const [selected, setSelected] = useState<number | null>(answered ?? null);
  const locked = answered !== undefined && answered !== null;
  const name = useId();
  const correct = locked && answered === check.correctIndex;

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 font-medium leading-snug text-fg">
        {index !== undefined && <span className="mr-2 text-subtle">Q{index + 1}.</span>}
        {check.question}
      </legend>
      <div className="flex flex-col gap-2">
        {check.options.map((opt, i) => {
          const isCorrect = i === check.correctIndex;
          const isChosen = (locked ? answered : selected) === i;
          return (
            <label
              key={i}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                !locked && "hover:border-border-strong hover:bg-surface-2",
                !locked && isChosen && "border-brand bg-brand/10",
                !locked && !isChosen && "border-border",
                locked && isCorrect && "border-up/50 bg-up/10",
                locked && isChosen && !isCorrect && "border-down/50 bg-down/10",
                locked && !isChosen && !isCorrect && "border-border opacity-60",
                locked && "cursor-default",
              )}
            >
              <input
                type="radio"
                name={name}
                value={i}
                checked={isChosen}
                disabled={locked}
                onChange={() => setSelected(i)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
              />
              <span className="flex-1 text-fg/90">{opt}</span>
              {locked && isCorrect && <CheckCircle2 className="size-4 shrink-0 text-up" aria-label="Correct answer" />}
              {locked && isChosen && !isCorrect && <XCircle className="size-4 shrink-0 text-down" aria-label="Your answer" />}
            </label>
          );
        })}
      </div>
      {!locked ? (
        <Button
          className="mt-1 self-start"
          disabled={selected === null}
          onClick={() => selected !== null && onAnswer(selected, selected === check.correctIndex)}
        >
          Check answer
        </Button>
      ) : (
        <div
          role="status"
          className={cn("rounded-xl border p-4 text-sm leading-relaxed", correct ? "border-up/30 bg-up/[0.06]" : "border-warn/30 bg-warn/[0.06]")}
        >
          <p className={cn("mb-1 flex items-center gap-1.5 font-medium", correct ? "text-up" : "text-warn")}>
            {correct ? <CheckCircle2 className="size-4" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
            {correct ? "Correct" : "Not quite — here's the reasoning"}
          </p>
          <p className="text-fg/85">{check.explanation}</p>
        </div>
      )}
    </fieldset>
  );
}
