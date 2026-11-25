/*
 * Sequência de leitura: regras e datas. Funções puras, usadas no servidor
 * (lib/streak/server.ts) e no navegador (components/reading-streak).
 *
 * Um dia conta quando a pessoa lê a meta diária (leitor em uso ou
 * cronômetro/timer da Sessão). O dia é o do calendário, no fuso do
 * aparelho: um dia inteiro sem bater a meta zera a sequência. Hoje ainda
 * não batido não quebra nada até a meia-noite.
 *
 * Dias são guardados como "AAAA-MM-DD" (sem hora nem fuso).
 */

export const DEFAULT_DAILY_GOAL_MIN = 10;
export const MIN_DAILY_GOAL_MIN = 1;
export const MAX_DAILY_GOAL_MIN = 240;
export const GOAL_PRESETS_MIN = [5, 10, 15, 30, 60] as const;

/* Fuso do aparelho, gravado pelo navegador para o servidor saber o "hoje". */
export const TIME_ZONE_COOKIE = "rainbound-tz";
export const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

export const SECONDS_PER_DAY = 24 * 60 * 60;

export type StreakDay = {
  date: string;
  seconds: number;
  met: boolean;
};

export type StreakSummary = {
  /* Hoje no fuso usado no cálculo. */
  today: string;
  todaySeconds: number;
  goalMinutes: number;
  metToday: boolean;
  /* Dias seguidos até hoje (ou até ontem, se hoje ainda não foi batido). */
  current: number;
  /* Maior sequência de todas. */
  best: number;
  /* Últimos 7 dias, terminando hoje. */
  week: StreakDay[];
  /* Quando o servidor montou (o navegador fica com o mais novo). */
  generatedAt: number;
};

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    DATE_KEY_PATTERN.test(value) &&
    dateKeyToUtc(value).toISOString().startsWith(value)
  );
}

/* Dia de um instante num fuso ("en-CA" já formata como AAAA-MM-DD). */
export function dateKeyIn(time: Date | number, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(time);
}

/* Dia de um instante no fuso do aparelho (navegador). */
export function localDateKey(time: number) {
  const date = new Date(time);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* Meia-noite (fuso do aparelho) do dia seguinte ao instante. */
export function nextLocalMidnight(time: number) {
  const date = new Date(time);

  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
}

/* "AAAA-MM-DD" como meia-noite UTC (o formato da coluna @db.Date). */
export function dateKeyToUtc(key: string) {
  return new Date(`${key}T00:00:00Z`);
}

export function utcToDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: string, days: number) {
  const date = dateKeyToUtc(key);
  date.setUTCDate(date.getUTCDate() + days);

  return utcToDateKey(date);
}

export function goalSeconds(goalMinutes: number) {
  return goalMinutes * 60;
}

export function clampGoal(minutes: number) {
  return Math.min(Math.max(Math.round(minutes), MIN_DAILY_GOAL_MIN), MAX_DAILY_GOAL_MIN);
}

/*
 * Sequência atual e recorde a partir dos dias batidos. A atual conta de
 * hoje para trás; se hoje ainda não foi batido, começa de ontem.
 */
export function computeStreak(metDates: Iterable<string>, today: string) {
  const met = new Set(metDates);

  let current = 0;
  let day = met.has(today) ? today : addDays(today, -1);

  while (met.has(day)) {
    current += 1;
    day = addDays(day, -1);
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of [...met].sort()) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  return { current, best: Math.max(best, current) };
}

/* "1 dia", "12 dias". */
export function formatDays(count: number) {
  return `${count} ${count === 1 ? "dia" : "dias"}`;
}

/* Minutos inteiros já lidos (arredonda para baixo: 9:59 ainda é 9). */
export function toMinutes(seconds: number) {
  return Math.floor(seconds / 60);
}

/* Dia da semana de um "AAAA-MM-DD": 0 = domingo, 6 = sábado. */
export function weekdayOf(key: string) {
  return dateKeyToUtc(key).getUTCDay();
}

/* "45 min", "2h 14min", "3h". */
export function formatDuration(seconds: number) {
  const minutes = toMinutes(seconds);

  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`;
}

/* Segunda-feira da semana de um dia. */
export function weekStartOf(key: string) {
  return addDays(key, -((weekdayOf(key) + 6) % 7));
}

/* Semanas que o widget "Minutos da semana" deixa voltar com as setas. */
export const MAX_WEEKS_BACK = 11;
