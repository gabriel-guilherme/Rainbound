"use client";

import { useState } from "react";
import { Droplet } from "lucide-react";

import type { WidgetVariant } from "@/lib/dashboardLayout";
import { goalSeconds, toMinutes, type StreakSummary } from "@/lib/streak";

import GoalButton from "./GoalButton";
import GoalPicker from "./GoalPicker";
import StreakNotice from "./StreakNotice";
import StreakWeek from "./StreakWeek";
import { useStreak } from "./useStreak";

type StreakWidgetProps = {
  variant: WidgetVariant;
  initial: StreakSummary;
};

/*
 * Conteúdo do widget "Sequência": gota com os dias
 * seguidos, o progresso de hoje e a semana. "Meta" abre a troca de
 * minutos no lugar da semana.
 * - wide: dias à esquerda, hoje e semana à direita;
 * - tall: tudo empilhado.
 */
export default function StreakWidget({ variant, initial }: StreakWidgetProps) {
  const { summary, todaySeconds, todayProgress } = useStreak(initial);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const isWide = variant === "wide";

  const minutes = toMinutes(todaySeconds);
  const missing = Math.max(
    1,
    Math.ceil((goalSeconds(summary.goalMinutes) - todaySeconds) / 60),
  );

  return (
    <section className="flex h-full flex-col gap-4 bg-primary p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="title-shelf text-3xl text-contrast">Sequência</h2>

        <GoalButton
          goalMinutes={summary.goalMinutes}
          isOpen={isEditingGoal}
          onToggle={() => setIsEditingGoal((open) => !open)}
          showPerDay={isWide}
        />
      </div>

      <StreakNotice initial={initial} />

      <div
        className={
          isWide
            ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:items-center md:gap-8"
            : "flex flex-col gap-4"
        }
      >
        <div
          className={[
            "flex items-center",
            isWide ? "gap-4.5" : "gap-3.5 border-b border-contrast/10 pb-4",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "flex shrink-0 items-center justify-center bg-interaction/15 text-interaction",
              isWide ? "size-18" : "size-13",
            ].join(" ")}
          >
            <Droplet size={isWide ? 40 : 28} fill="currentColor" strokeWidth={1.5} />
          </span>

          <div className="flex flex-col gap-1.5">
            <span className={`title-shelf text-contrast ${isWide ? "text-8xl" : "text-6xl"}`}>
              {summary.current}{" "}
              <span className={`text-contrast/80 ${isWide ? "text-4xl" : "text-3xl"}`}>
                {summary.current === 1 ? "dia" : "dias"}
              </span>
            </span>
            <span className="text-sm text-contrast/70">
              {isWide ? "seguidos · " : ""}recorde: {summary.best}{" "}
              {summary.best === 1 ? "dia" : "dias"}
            </span>
          </div>
        </div>

        <div
          className={[
            "flex flex-col gap-3.5",
            isWide ? "md:border-l md:border-contrast/10 md:pl-8" : "",
          ].join(" ")}
        >
          {isEditingGoal ? (
            <div className="flex flex-col gap-2.5">
              <p className="title-shelf text-xl text-contrast">Meta diária</p>
              <GoalPicker goalMinutes={summary.goalMinutes} />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="title-shelf text-xl text-contrast">Hoje</span>
                  <span className="text-sm tabular-nums text-contrast/75">
                    {summary.metToday ? (
                      "meta batida"
                    ) : (
                      <>
                        <b className="text-contrast">{minutes}</b> de {summary.goalMinutes} min
                      </>
                    )}
                  </span>
                </div>
                <div
                  role="meter"
                  aria-label="Leitura de hoje"
                  aria-valuemin={0}
                  aria-valuemax={summary.goalMinutes}
                  aria-valuenow={Math.min(minutes, summary.goalMinutes)}
                  className="h-1 bg-contrast/10"
                >
                  <div
                    className="h-full bg-interaction transition-[width] duration-500"
                    style={{ width: `${todayProgress * 100}%` }}
                  />
                </div>
                {isWide && (
                  <span className="text-[13px] text-contrast/65">
                    {summary.metToday
                      ? "Dia garantido. Continue lendo à vontade."
                      : `Faltam ${missing} min para garantir hoje`}
                  </span>
                )}
              </div>

              <StreakWeek week={summary.week} today={summary.today} size={isWide ? "md" : "sm"} />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
