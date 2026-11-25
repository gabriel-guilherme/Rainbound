"use client";

import { useState } from "react";
import { Droplet } from "lucide-react";

import { formatDays, toMinutes, type StreakSummary } from "@/lib/streak";

import GoalButton from "./GoalButton";
import GoalPicker from "./GoalPicker";
import StreakWeek from "./StreakWeek";

type StreakPanelProps = {
  summary: StreakSummary;
  todaySeconds: number;
};

/*
 * Painel da sequência no rodapé do leitor: dias e semana.
 */
export default function StreakPanel({ summary, todaySeconds }: StreakPanelProps) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden="true"
          className="flex size-12 shrink-0 items-center justify-center bg-interaction/15 text-interaction"
        >
          <Droplet size={26} fill="currentColor" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col gap-1">
          <span className="title-shelf text-4xl text-contrast">{formatDays(summary.current)}</span>
          <span className="text-sm text-contrast/70">
            recorde: {summary.best} · hoje:{" "}
            {summary.metToday
              ? "meta batida"
              : `${toMinutes(todaySeconds)} de ${summary.goalMinutes} min`}
          </span>
        </div>
      </div>

      <StreakWeek week={summary.week} today={summary.today} size="sm" />

      <div className="flex flex-col gap-3 border-t border-contrast/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="title-shelf text-xl text-contrast">Meta diária</p>
          <GoalButton
            goalMinutes={summary.goalMinutes}
            isOpen={isEditingGoal}
            onToggle={() => setIsEditingGoal((open) => !open)}
          />
        </div>

        {isEditingGoal && <GoalPicker goalMinutes={summary.goalMinutes} />}
      </div>
    </div>
  );
}
