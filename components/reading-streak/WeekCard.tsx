"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { WidgetVariant } from "@/lib/dashboardLayout";
import {
  addDays,
  dateKeyToUtc,
  formatDuration,
  goalSeconds,
  MAX_WEEKS_BACK,
  toMinutes,
  weekStartOf,
  type StreakSummary,
} from "@/lib/streak/rules";

import { useStreak } from "./useStreak";

type WeekCardProps = {
  variant: WidgetVariant;
  initial: StreakSummary;
  /* Dias com leitura das últimas semanas (lib/streak/server.ts → getReadingDays). */
  days: { date: string; seconds: number; met: boolean }[];
};

const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

const dayMonthFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const stepClass =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center text-contrast ring-2 ring-inset ring-contrast/20 transition-colors hover:bg-secondary hover:ring-secondary disabled:pointer-events-none disabled:opacity-25";

function weekTitle(offset: number, start: string) {
  if (offset === 0) return "Esta semana";
  if (offset === 1) return "Semana passada";

  return `Semana de ${dayMonthFormat.format(dateKeyToUtc(start))}`;
}

/*
 * "Minutos da semana": barras de segunda a domingo com a meta diária
 * tracejada. Hoje soma o tempo ainda não enviado (useStreak).
 * - wide: total, média, dias com a meta e comparação com a semana
 *   anterior ao lado das barras; setas para semanas passadas;
 * - tall: só esta semana, mais compacta.
 */
export default function WeekCard({ variant, initial, days }: WeekCardProps) {
  const { summary, todaySeconds } = useStreak(initial);
  const { today } = summary;
  const goal = goalSeconds(summary.goalMinutes);
  const [offset, setOffset] = useState(0);
  const isWide = variant === "wide";
  const weekOffset = isWide ? offset : 0;

  const byDate = new Map(days.map((day) => [day.date, day]));
  const todayStored = byDate.get(today);
  const todayTotal = Math.max(todayStored?.seconds ?? 0, todaySeconds);

  byDate.set(today, {
    date: today,
    seconds: todayTotal,
    met: Boolean(todayStored?.met) || summary.metToday || todayTotal >= goal,
  });

  const start = addDays(weekStartOf(today), -7 * weekOffset);
  const week = WEEKDAYS.map((label, index) => {
    const date = addDays(start, index);
    const day = byDate.get(date);

    return {
      date,
      label,
      seconds: day?.seconds ?? 0,
      met: Boolean(day?.met),
      isToday: date === today,
      isFuture: date > today,
    };
  });

  const elapsed = week.filter((day) => !day.isFuture);
  const total = elapsed.reduce((sum, day) => sum + day.seconds, 0);
  const metCount = elapsed.filter((day) => day.met).length;
  const average = elapsed.length > 0 ? total / elapsed.length : 0;

  /* Semana anterior até o mesmo dia da semana, para comparar igual com igual. */
  const previousTotal = Array.from({ length: elapsed.length }, (_, index) =>
    byDate.get(addDays(start, index - 7)),
  ).reduce((sum, day) => sum + (day?.seconds ?? 0), 0);
  const change =
    previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null;

  /* Escala: a maior barra ou o dobro da meta, com folga para o rótulo. */
  const scaleMinutes = Math.max(
    summary.goalMinutes * 2,
    ...week.map((day) => toMinutes(day.seconds)),
    1,
  );
  const toHeight = (minutes: number) => `${(minutes / scaleMinutes) * 82}%`;

  const chart = (
    <div className="flex flex-col gap-1.5">
      <div className={`relative grid grid-cols-7 items-end ${isWide ? "h-44 gap-3" : "h-32 gap-2"}`}>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-danger/80"
          style={{ bottom: toHeight(summary.goalMinutes) }}
        />
        {isWide && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 text-[11px] text-danger"
            style={{ bottom: `calc(${toHeight(summary.goalMinutes)} + 2px)` }}
          >
            meta {summary.goalMinutes} min
          </span>
        )}

        {week.map((day) => {
          const minutes = toMinutes(day.seconds);
          const description = `${day.label}: ${day.isFuture ? "ainda não chegou" : formatDuration(day.seconds)}`;

          return (
            <div
              key={day.date}
              title={description}
              className="flex h-full flex-col items-center justify-end gap-1"
            >
              <span className="sr-only">{description}</span>
              {isWide && !day.isFuture && (
                <span aria-hidden="true" className="text-xs tabular-nums text-contrast/70">
                  {minutes} min
                </span>
              )}
              <span
                aria-hidden="true"
                className={[
                  "block w-full max-w-14",
                  day.isFuture
                    ? "bg-contrast/10"
                    : day.met
                      ? "bg-interaction"
                      : "bg-interaction/35",
                  day.isToday ? "outline-2 outline-contrast" : "",
                ].join(" ")}
                style={{ height: day.isFuture ? "2px" : `max(3px, ${toHeight(minutes)})` }}
              />
            </div>
          );
        })}
      </div>

      <div aria-hidden="true" className={`grid grid-cols-7 ${isWide ? "gap-3" : "gap-2"}`}>
        {week.map((day) => (
          <span
            key={day.date}
            className={[
              "text-center text-xs",
              day.isToday ? "font-semibold text-contrast" : "text-contrast/60",
            ].join(" ")}
          >
            {isWide ? day.label : day.label.charAt(0).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );

  const changeText =
    change === null
      ? "—"
      : change === 0
        ? "igual"
        : `${change > 0 ? "+" : "−"}${Math.abs(change)}%`;

  if (!isWide) {
    return (
      <section className="flex h-full flex-col gap-4 bg-primary p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="title-shelf text-3xl text-contrast">Semana</h2>
          <span className="title-shelf text-3xl text-contrast">{formatDuration(total)}</span>
        </div>

        {chart}

        <div className="flex justify-between gap-3 border-t border-contrast/10 pt-3 text-sm">
          <span className="text-contrast/60">média {formatDuration(average)}/dia</span>
          {change !== null && (
            <span className={change > 0 ? "font-semibold text-status-read" : "text-contrast/60"}>
              {changeText} que a anterior
            </span>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-5 bg-primary p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="title-shelf text-3xl text-contrast">{weekTitle(offset, start)}</h2>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setOffset(offset + 1)}
            disabled={offset >= MAX_WEEKS_BACK}
            aria-label="Semana anterior"
            className={stepClass}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setOffset(offset - 1)}
            disabled={offset === 0}
            aria-label="Próxima semana"
            className={stepClass}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[14rem_minmax(0,1fr)] md:items-end">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="title-shelf text-6xl text-contrast">{formatDuration(total)}</span>
            <span className="text-xs text-contrast/60">
              {offset === 0 ? "lidos de segunda até hoje" : "lidos na semana"}
            </span>
          </div>

          <dl className="flex flex-col text-sm">
            <StatRow label="Média por dia" value={formatDuration(average)} />
            <StatRow label="Meta batida" value={`${metCount} de ${elapsed.length} dias`} />
            <StatRow
              label="Semana anterior"
              value={changeText}
              highlight={change !== null && change > 0}
            />
          </dl>
        </div>

        {chart}
      </div>
    </section>
  );
}

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 border-t border-contrast/10 py-2">
      <dt className="text-contrast/60">{label}</dt>
      <dd className={`font-semibold ${highlight ? "text-status-read" : ""}`}>{value}</dd>
    </div>
  );
}
