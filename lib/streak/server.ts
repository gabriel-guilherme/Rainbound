import { cookies } from "next/headers";

import { prisma } from "../services/prisma";
import {
  addDays,
  clampGoal,
  computeStreak,
  DEFAULT_DAILY_GOAL_MIN,
  DEFAULT_TIME_ZONE,
  dateKeyIn,
  dateKeyToUtc,
  goalSeconds,
  isDateKey,
  isValidTimeZone,
  SECONDS_PER_DAY,
  TIME_ZONE_COOKIE,
  utcToDateKey,
  type StreakSummary,
} from "./rules";

/*
 * Sequência de leitura no banco (ReadingDay): um registro por dia com os
 * segundos lidos. Regras e datas em lib/streak/rules.ts; os testes do admin
 * ficam em lib/streak/admin.ts.
 */

/* Fuso do aparelho (cookie gravado pelo ReadingTracker); padrão: Brasília. */
export async function getTimeZone() {
  const value = (await cookies()).get(TIME_ZONE_COOKIE)?.value;
  const decoded = value ? decodeURIComponent(value) : null;

  return isValidTimeZone(decoded) ? decoded : DEFAULT_TIME_ZONE;
}

export function todayIn(timeZone: string) {
  return dateKeyIn(new Date(), timeZone);
}

/* Meta diária do usuário, em minutos. */
export async function getGoalMinutes(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyGoalMinutes: true },
  });

  return user?.dailyGoalMinutes ?? DEFAULT_DAILY_GOAL_MIN;
}

export async function getStreakSummary(
  userId: string,
  timeZone: string,
): Promise<StreakSummary> {
  const today = todayIn(timeZone);
  const weekStart = addDays(today, -6);

  const [goalMinutes, metRows, weekRows] = await Promise.all([
    getGoalMinutes(userId),
    prisma.readingDay.findMany({
      where: { userId, goalMet: true },
      select: { date: true },
    }),
    prisma.readingDay.findMany({
      where: {
        userId,
        date: { gte: dateKeyToUtc(weekStart), lte: dateKeyToUtc(today) },
      },
      select: { date: true, seconds: true, goalMet: true },
    }),
  ]);

  const goal = goalSeconds(goalMinutes);
  const weekByDate = new Map(weekRows.map((row) => [utcToDateKey(row.date), row]));
  const todayRow = weekByDate.get(today);
  const todaySeconds = todayRow?.seconds ?? 0;
  /* A meta pode ter baixado depois do último registro de hoje. */
  const metToday = Boolean(todayRow?.goalMet) || todaySeconds >= goal;

  const metDates = metRows.map((row) => utcToDateKey(row.date));

  if (metToday) metDates.push(today);

  const { current, best } = computeStreak(metDates, today);

  const week = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index);
    const row = weekByDate.get(date);

    return {
      date,
      seconds: row?.seconds ?? 0,
      met: date === today ? metToday : Boolean(row?.goalMet),
    };
  });

  return {
    today,
    todaySeconds,
    goalMinutes,
    metToday,
    current,
    best,
    week,
    generatedAt: Date.now(),
  };
}

/* Um dia lido, para os widgets de histórico (Atividade do ano, Semana). */
export type ReadingDayRecord = { date: string; seconds: number; met: boolean };

/* Dias com leitura a partir de `from` (sem ele, todos), do mais antigo ao mais novo. */
export async function getReadingDays(
  userId: string,
  from?: string,
): Promise<ReadingDayRecord[]> {
  const rows = await prisma.readingDay.findMany({
    where: {
      userId,
      seconds: { gt: 0 },
      ...(from ? { date: { gte: dateKeyToUtc(from) } } : {}),
    },
    orderBy: { date: "asc" },
    select: { date: true, seconds: true, goalMet: true },
  });

  return rows.map((row) => ({
    date: utcToDateKey(row.date),
    seconds: row.seconds,
    met: row.goalMet,
  }));
}

export type ReadingTimeEntry = { date: string; seconds: number };

/*
 * Confere o que veio do navegador: só hoje e ontem (no fuso informado;
 * ontem para o que foi lido antes da meia-noite e enviado depois),
 * segundos inteiros e no máximo um dia.
 */
export function parseReadingTimeEntries(value: unknown, timeZone: string) {
  if (!Array.isArray(value)) return null;

  const today = todayIn(timeZone);
  const allowed = new Set([today, addDays(today, -1)]);
  const entries: ReadingTimeEntry[] = [];

  for (const item of value.slice(0, 4)) {
    if (typeof item !== "object" || item === null) return null;

    const { date, seconds } = item as Record<string, unknown>;

    if (!isDateKey(date) || typeof seconds !== "number" || !Number.isInteger(seconds)) {
      return null;
    }

    if (allowed.has(date) && seconds > 0) {
      entries.push({ date, seconds: Math.min(seconds, SECONDS_PER_DAY) });
    }
  }

  return entries;
}

/* Soma o tempo lido e marca o dia quando a meta é batida. */
export async function recordReadingTime(userId: string, entries: ReadingTimeEntry[]) {
  if (entries.length === 0) return;

  const goal = goalSeconds(await getGoalMinutes(userId));

  for (const { date, seconds } of entries) {
    const where = { userId_date: { userId, date: dateKeyToUtc(date) } };

    const day = await prisma.readingDay.upsert({
      where,
      create: { userId, date: dateKeyToUtc(date), seconds },
      update: { seconds: { increment: seconds } },
      select: { seconds: true, goalMet: true },
    });

    const capped = Math.min(day.seconds, SECONDS_PER_DAY);
    const goalMet = day.goalMet || capped >= goal;

    if (capped !== day.seconds || goalMet !== day.goalMet) {
      await prisma.readingDay.update({ where, data: { seconds: capped, goalMet } });
    }
  }
}

/*
 * Troca a meta. Vale a partir de hoje: dias já garantidos continuam; se
 * hoje já passou da meta nova, hoje fica garantido.
 */
export async function setDailyGoal(userId: string, minutes: number, timeZone: string) {
  const goalMinutes = clampGoal(minutes);

  await prisma.user.update({
    where: { id: userId },
    data: { dailyGoalMinutes: goalMinutes },
  });

  await prisma.readingDay.updateMany({
    where: {
      userId,
      date: dateKeyToUtc(todayIn(timeZone)),
      seconds: { gte: goalSeconds(goalMinutes) },
    },
    data: { goalMet: true },
  });
}
