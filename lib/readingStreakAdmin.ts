import { prisma } from "./prisma";
import { getGoalMinutes } from "./readingStreak";
import {
  addDays,
  dateKeyToUtc,
  goalSeconds,
  SECONDS_PER_DAY,
  utcToDateKey,
} from "./streak";

/*
 * Testes da sequência de leitura (aba "Sequência" em /admin/pedidos).
 * Mexem direto nos dias (ReadingDay), de jeitos que a leitura de verdade
 * (lib/readingStreak.ts) nunca faz, como tirar minutos de um dia batido.
 * Para tirar a aba de testes, basta apagar este arquivo e o que o usa.
 */

/*
 * Define os segundos de um dia à mão. Diferente da leitura de verdade, a
 * meta é recalculada nos dois sentidos (tirar minutos desfaz o dia).
 */
export async function setReadingDaySeconds(userId: string, date: string, seconds: number) {
  const goal = goalSeconds(await getGoalMinutes(userId));
  const value = Math.min(Math.max(Math.round(seconds), 0), SECONDS_PER_DAY);
  const key = { userId_date: { userId, date: dateKeyToUtc(date) } };

  if (value === 0) {
    await prisma.readingDay.deleteMany({ where: { userId, date: dateKeyToUtc(date) } });
    return;
  }

  await prisma.readingDay.upsert({
    where: key,
    create: { userId, date: dateKeyToUtc(date), seconds: value, goalMet: value >= goal },
    update: { seconds: value, goalMet: value >= goal },
  });
}

export async function getReadingDaySeconds(userId: string, date: string) {
  const day = await prisma.readingDay.findUnique({
    where: { userId_date: { userId, date: dateKeyToUtc(date) } },
    select: { seconds: true },
  });

  return day?.seconds ?? 0;
}

/* Dias registrados entre duas datas (inclusive), do mais novo ao mais antigo. */
export async function listReadingDays(userId: string, from: string, to: string) {
  const rows = await prisma.readingDay.findMany({
    where: { userId, date: { gte: dateKeyToUtc(from), lte: dateKeyToUtc(to) } },
    orderBy: { date: "desc" },
    select: { date: true, seconds: true, goalMet: true },
  });

  return rows.map((row) => ({ ...row, date: utcToDateKey(row.date) }));
}

/* Sequência de `days` dias batidos terminando em `lastDay`. */
export async function seedReadingStreak(userId: string, lastDay: string, days: number) {
  const goal = goalSeconds(await getGoalMinutes(userId));

  for (let index = 0; index < days; index++) {
    const date = dateKeyToUtc(addDays(lastDay, -index));

    await prisma.readingDay.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, seconds: goal, goalMet: true },
      update: { seconds: goal, goalMet: true },
    });
  }
}

export async function clearReadingDays(userId: string) {
  await prisma.readingDay.deleteMany({ where: { userId } });
}
