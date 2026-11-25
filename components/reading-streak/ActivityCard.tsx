"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { WidgetVariant } from "@/lib/dashboardLayout";
import {
  addDays,
  dateKeyToUtc,
  formatDuration,
  goalSeconds,
  weekdayOf,
  type StreakSummary,
} from "@/lib/streak/rules";

import {
  buildActivityWeeks,
  yearTotals,
  type ActivityCell,
  type ActivityDay,
  type ActivityWeek,
} from "./activityGrid";
import { useStreak } from "./useStreak";

type ActivityCardProps = {
  variant: WidgetVariant;
  initial: StreakSummary;
  /* Dias com leitura (lib/streak/server.ts → getReadingDays). */
  days: { date: string; seconds: number; met: boolean }[];
  isOwner?: boolean;
};

const RECENT_WEEKS = 17;

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/* Do nível 0 (sem leitura) ao 4. */
const LEVEL_CLASS = [
  "bg-contrast/7",
  "bg-interaction/30",
  "bg-interaction/55",
  "bg-interaction/80",
  "bg-status-read",
];

const longFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const stepClass =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center text-contrast ring-2 ring-inset ring-contrast/20 transition-colors hover:bg-secondary hover:ring-secondary disabled:pointer-events-none disabled:opacity-25";

function cellTitle(cell: ActivityCell) {
  const date = longFormat.format(dateKeyToUtc(cell.date));

  if (cell.seconds <= 0) return `${date}: sem leitura`;

  return `${date}: ${formatDuration(cell.seconds)}${cell.met ? " · meta batida" : ""}`;
}

/* "84 h" a partir de 10 horas; abaixo disso, "2h 14min". */
function formatTotal(seconds: number) {
  return seconds >= 10 * 3600 ? `${Math.floor(seconds / 3600)} h` : formatDuration(seconds);
}

/*
 * "Atividade do ano": um quadradinho por dia, mais forte quanto mais leu
 * (em relação à meta). Hoje soma o tempo ainda não enviado (useStreak).
 * - wide: o ano inteiro, com setas para os anos anteriores;
 * - tall: os últimos 4 meses.
 */
export default function ActivityCard({ variant, initial, days, isOwner = true }: ActivityCardProps) {
  const { summary, todaySeconds } = useStreak(initial, isOwner);
  const { today } = summary;
  const goal = goalSeconds(summary.goalMinutes);
  const currentYear = Number(today.slice(0, 4));
  const firstYear = Math.min(Number(days[0]?.date.slice(0, 4) ?? currentYear), currentYear);

  const [year, setYear] = useState(currentYear);

  const byDate = new Map<string, ActivityDay>(days.map((day) => [day.date, day]));
  const todayStored = byDate.get(today);
  const todayTotal = Math.max(todayStored?.seconds ?? 0, todaySeconds);

  byDate.set(today, {
    seconds: todayTotal,
    met: Boolean(todayStored?.met) || summary.metToday || todayTotal >= goal,
  });

  if (variant === "tall") {
    const totals = yearTotals(byDate, currentYear);
    const weeks = buildActivityWeeks({
      from: addDays(today, -weekdayOf(today) - 7 * (RECENT_WEEKS - 1)),
      to: today,
      today,
      days: byDate,
      goal,
    });

    return (
      <section className="flex h-full flex-col gap-4 bg-primary p-5">
        <h2 className="title-shelf text-3xl text-contrast">Atividade</h2>

        <div className="flex gap-7 border-b border-contrast/10 pb-4">
          <Stat value={formatTotal(totals.seconds)} label={`em ${currentYear}`} size="sm" />
          <Stat value={String(totals.readDays)} label="dias lendo" size="sm" />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-contrast/60">Últimos 4 meses</p>
          <ActivityGrid
            weeks={weeks}
            label={`Leitura dos últimos 4 meses: ${totals.readDays} dias com leitura em ${currentYear}`}
            className="grid max-w-80 grid-flow-col grid-rows-7 auto-cols-fr gap-1"
            cellClassName="aspect-square w-full"
          />
        </div>
      </section>
    );
  }

  const totals = yearTotals(byDate, year);
  const weeks = buildActivityWeeks({
    from: `${year}-01-01`,
    to: `${year}-12-31`,
    today,
    days: byDate,
    goal,
  });

  return (
    <section className="flex h-full flex-col gap-5 bg-primary p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="title-shelf text-3xl text-contrast">Atividade de {year}</h2>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setYear(year - 1)}
            disabled={year <= firstYear}
            aria-label="Ano anterior"
            className={stepClass}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setYear(year + 1)}
            disabled={year >= currentYear}
            aria-label="Próximo ano"
            className={stepClass}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-3">
        <Stat value={formatTotal(totals.seconds)} label="lidas no ano" />
        <Stat value={String(totals.readDays)} label="dias com leitura" />
        <Stat value={String(totals.metDays)} label="com a meta batida" />
      </div>

      <YearGrid
        key={year}
        weeks={weeks}
        label={`Leitura de ${year}: ${totals.readDays} dias com leitura`}
        scrollToEnd={year === currentYear}
      />
    </section>
  );
}

function Stat({ value, label, size = "md" }: { value: string; label: string; size?: "md" | "sm" }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={`title-shelf text-contrast ${size === "md" ? "text-5xl" : "text-4xl"}`}>
        {value}
      </span>
      <span className="text-xs text-contrast/60">{label}</span>
    </div>
  );
}

type ActivityGridProps = {
  weeks: ActivityWeek[];
  label: string;
  className: string;
  cellClassName: string;
};

/* Quadradinhos em colunas de semana (a grade preenche coluna por coluna). */
function ActivityGrid({ weeks, label, className, cellClassName }: ActivityGridProps) {
  return (
    <div role="img" aria-label={label} className={className}>
      {weeks.flatMap((week) =>
        week.cells.map((cell) => (
          <span
            key={cell.date}
            title={cell.state === "day" ? cellTitle(cell) : undefined}
            className={[
              cellClassName,
              cell.state === "outside"
                ? "invisible"
                : cell.state === "future"
                  ? "bg-contrast/3"
                  : LEVEL_CLASS[cell.level],
            ].join(" ")}
          />
        )),
      )}
    </div>
  );
}

type YearGridProps = {
  weeks: ActivityWeek[];
  label: string;
  /* No ano atual, abre mostrando o fim (hoje) quando não cabe na tela. */
  scrollToEnd: boolean;
};

function YearGrid({ weeks, label, scrollToEnd }: YearGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;

    if (scrollToEnd && element) element.scrollLeft = element.scrollWidth;
  }, [scrollToEnd]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={scrollRef} className="scrollbar-none overflow-x-auto">
        <div className="flex w-max gap-1.5">
          <div
            aria-hidden="true"
            className="mt-[19px] grid grid-rows-[repeat(7,13px)] gap-[3px] text-[10px] leading-[13px] text-contrast/60"
          >
            <span />
            <span>seg</span>
            <span />
            <span>qua</span>
            <span />
            <span>sex</span>
            <span />
          </div>

          <div className="flex flex-col gap-1.5">
            <div
              aria-hidden="true"
              className="grid h-[13px] grid-flow-col auto-cols-[13px] gap-x-[3px] text-[11px] leading-[13px] text-contrast/60"
            >
              {weeks.map((week) => (
                <span key={week.start} className="overflow-visible whitespace-nowrap">
                  {week.month === null ? "" : MONTHS[week.month]}
                </span>
              ))}
            </div>

            <ActivityGrid
              weeks={weeks}
              label={label}
              className="grid grid-flow-col grid-rows-[repeat(7,13px)] auto-cols-[13px] gap-[3px]"
              cellClassName="size-[13px]"
            />
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-contrast/60"
      >
        <span className="max-sm:hidden">Passe o mouse num dia para ver o tempo lido</span>
        <span className="flex items-center gap-1">
          menos
          {LEVEL_CLASS.map((levelClass) => (
            <span key={levelClass} className={`size-[11px] ${levelClass}`} />
          ))}
          mais
        </span>
      </div>
    </div>
  );
}
