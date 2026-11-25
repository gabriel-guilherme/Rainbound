import { addDays, weekdayOf } from "@/lib/streak/rules";

/*
 * Mapa da "Atividade do ano": colunas de semanas (domingo a sábado), um
 * quadradinho por dia, mais forte quanto mais a pessoa leu em relação à
 * meta diária. Funções puras (ActivityCard).
 */

export type ActivityDay = { seconds: number; met: boolean };

export type ActivityCell = {
  date: string;
  seconds: number;
  met: boolean;
  /* 0: sem leitura; 1: abaixo da meta; 2: meta; 3: 2× a meta; 4: 4× a meta. */
  level: 0 | 1 | 2 | 3 | 4;
  /* "outside": fora do ano mostrado (completa a primeira e a última semana). */
  state: "day" | "future" | "outside";
};

export type ActivityWeek = {
  start: string;
  cells: ActivityCell[];
  /* Mês que começa nesta semana (rótulo acima da coluna). */
  month: number | null;
};

export function activityLevel(seconds: number, goal: number): ActivityCell["level"] {
  if (seconds <= 0) return 0;
  if (seconds < goal) return 1;
  if (seconds < goal * 2) return 2;
  if (seconds < goal * 4) return 3;

  return 4;
}

type BuildOptions = {
  /* Primeiro e último dia mostrados (as semanas se completam em volta). */
  from: string;
  to: string;
  today: string;
  days: Map<string, ActivityDay>;
  goal: number;
};

export function buildActivityWeeks({ from, to, today, days, goal }: BuildOptions) {
  const weeks: ActivityWeek[] = [];

  for (
    let start = addDays(from, -weekdayOf(from));
    start <= to;
    start = addDays(start, 7)
  ) {
    let month: number | null = null;

    const cells = Array.from({ length: 7 }, (_, index): ActivityCell => {
      const date = addDays(start, index);
      const day = days.get(date);
      const seconds = day?.seconds ?? 0;
      const inRange = date >= from && date <= to;

      if (inRange && date.endsWith("-01")) month = Number(date.slice(5, 7)) - 1;

      return {
        date,
        seconds,
        met: Boolean(day?.met),
        level: activityLevel(seconds, goal),
        state: !inRange ? "outside" : date > today ? "future" : "day",
      };
    });

    weeks.push({ start, cells, month });
  }

  return weeks;
}

export function yearTotals(days: Map<string, ActivityDay>, year: number) {
  const prefix = `${year}-`;
  let seconds = 0;
  let readDays = 0;
  let metDays = 0;

  for (const [date, day] of days) {
    if (!date.startsWith(prefix) || day.seconds <= 0) continue;

    seconds += day.seconds;
    readDays += 1;
    if (day.met) metDays += 1;
  }

  return { seconds, readDays, metDays };
}
