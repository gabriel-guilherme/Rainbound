"use client";

import { useState, useTransition, type KeyboardEvent } from "react";

import { updateDailyGoal } from "@/app/streak/actions";
import {
  GOAL_PRESETS_MIN,
  MAX_DAILY_GOAL_MIN,
  MIN_DAILY_GOAL_MIN,
  clampGoal,
} from "@/lib/streak";

import { setSummary } from "./streakStore";

/*
 * Meta diária: atalhos ou outro valor digitado (Enter ou sair do campo
 * confirma).
 */
export default function GoalPicker({ goalMinutes }: { goalMinutes: number }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(minutes: number) {
    const value = clampGoal(minutes);

    setDraft(null);

    if (value === goalMinutes) return;

    setError(null);
    startTransition(async () => {
      const result = await updateDailyGoal(value);

      if (result.summary) setSummary(result.summary);
      if (result.error) setError(result.error);
    });
  }

  function commitDraft() {
    if (draft === null) return;

    const minutes = Number(draft);

    if (draft.trim() !== "" && Number.isFinite(minutes)) {
      save(minutes);
    } else {
      setDraft(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
    }

    if (event.key === "Escape") {
      event.stopPropagation();
      setDraft(null);
    }
  }

  return (
    <div className="flex flex-col gap-2.5" aria-busy={isPending}>
      <div role="group" aria-label="Minutos por dia" className="grid grid-cols-5 gap-1">
        {GOAL_PRESETS_MIN.map((minutes) => {
          const selected = goalMinutes === minutes;

          return (
            <button
              key={minutes}
              type="button"
              aria-pressed={selected}
              disabled={isPending}
              onClick={() => save(minutes)}
              className={[
                "h-9 cursor-pointer text-sm tabular-nums transition-colors disabled:cursor-wait",
                selected
                  ? "bg-contrast font-semibold text-primary"
                  : "text-contrast/75 ring-1 ring-inset ring-contrast/15 hover:bg-contrast/10",
              ].join(" ")}
            >
              {minutes} min
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2.5 text-sm text-contrast/70">
        Outro valor
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          disabled={isPending}
          aria-label={`Minutos por dia, de ${MIN_DAILY_GOAL_MIN} a ${MAX_DAILY_GOAL_MIN}`}
          value={draft ?? String(goalMinutes)}
          onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
          onFocus={(event) => event.target.select()}
          onBlur={commitDraft}
          onKeyDown={handleKeyDown}
          className="h-9 w-16 border border-contrast/15 bg-darkest text-center tabular-nums text-contrast outline-none focus:border-danger"
        />
        min/dia
      </label>

      <p role={error ? "alert" : undefined} className={`text-xs ${error ? "text-danger" : "text-contrast/55"}`}>
        {error ?? "Vale a partir de hoje. Os dias já garantidos continuam contando."}
      </p>
    </div>
  );
}
