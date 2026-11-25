import { prisma } from "../services/prisma";
import { addDays, dateKeyToUtc, utcToDateKey } from "../streak/rules";
import { todayIn } from "../streak/server";

/*
 * Atividade recente (widget "Atividade recente" e aba Atividade de
 * /pessoas), montada com o que já está no banco, sem tabela de eventos:
 * - começou um livro (Book.startedAt);
 * - terminou um livro (Book.finishedAt, com a nota);
 * - marcos da sequência (ReadingDay.goalMet): 7, 30, 50, 100, 200 e 365
 *   dias seguidos.
 */

/* Até quantos dias para trás a atividade olha. */
export const ACTIVITY_WINDOW_DAYS = 120;

const STREAK_MILESTONES = [7, 30, 50, 100, 200, 365];

type EventBase = { userId: string; at: Date };

export type ActivityEvent =
  | (EventBase & { kind: "started"; bookId: number; title: string; coverUrl: string | null })
  | (EventBase & {
      kind: "finished";
      bookId: number;
      title: string;
      coverUrl: string | null;
      rating: number | null;
    })
  | (EventBase & { kind: "streak"; days: number });

function streakMilestones(metDates: string[]) {
  const events: { date: string; days: number }[] = [];
  let run = 0;
  let previous: string | null = null;

  for (const date of [...metDates].sort()) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    previous = date;

    if (STREAK_MILESTONES.includes(run)) events.push({ date, days: run });
  }

  return events;
}

/*
 * Atividade de várias pessoas, do mais novo ao mais antigo, a partir de
 * `today` ("AAAA-MM-DD"; a janela conta para trás dele).
 */
export async function getActivity(
  userIds: string[],
  today: string,
  limit: number,
): Promise<ActivityEvent[]> {
  if (userIds.length === 0) return [];

  const since = dateKeyToUtc(addDays(today, -ACTIVITY_WINDOW_DAYS));
  /* A sequência precisa de dias antes da janela para contar os marcos. */
  const streakSince = dateKeyToUtc(addDays(today, -ACTIVITY_WINDOW_DAYS - 365));
  const userId = { in: userIds };

  const [started, finished, metDays] = await Promise.all([
    prisma.book.findMany({
      where: { userId, startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: limit,
      select: { id: true, userId: true, title: true, coverUrl: true, startedAt: true },
    }),
    prisma.book.findMany({
      where: { userId, finishedAt: { gte: since } },
      orderBy: { finishedAt: "desc" },
      take: limit,
      select: { id: true, userId: true, title: true, coverUrl: true, finishedAt: true, rating: true },
    }),
    prisma.readingDay.findMany({
      where: { userId, goalMet: true, date: { gte: streakSince } },
      select: { userId: true, date: true },
    }),
  ]);

  const metByUser = new Map<string, string[]>();

  for (const day of metDays) {
    const dates = metByUser.get(day.userId) ?? [];
    dates.push(utcToDateKey(day.date));
    metByUser.set(day.userId, dates);
  }

  const events: ActivityEvent[] = [
    ...started.map((book) => ({
      kind: "started" as const,
      userId: book.userId!,
      at: book.startedAt!,
      bookId: book.id,
      title: book.title,
      coverUrl: book.coverUrl,
    })),
    ...finished.map((book) => ({
      kind: "finished" as const,
      userId: book.userId!,
      at: book.finishedAt!,
      bookId: book.id,
      title: book.title,
      coverUrl: book.coverUrl,
      rating: book.rating,
    })),
    ...[...metByUser].flatMap(([owner, dates]) =>
      streakMilestones(dates)
        .filter(({ date }) => dateKeyToUtc(date) >= since)
        .map(({ date, days }) => ({
          kind: "streak" as const,
          userId: owner,
          /* Meio-dia do dia do marco, para cair no dia certo em qualquer fuso. */
          at: new Date(`${date}T12:00:00Z`),
          days,
        })),
    ),
  ];

  return events.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export function getRecentActivity(userId: string, timeZone: string, limit: number) {
  return getActivity([userId], todayIn(timeZone), limit);
}

const DAY_MS = 24 * 60 * 60 * 1000;

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });

/* "hoje", "ontem", "há 3 dias", "há 2 semanas" ou a data. */
export function formatActivityWhen(at: Date, now: number) {
  const days = Math.floor((now - at.getTime()) / DAY_MS);

  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 35) {
    const weeks = Math.floor(days / 7);

    return `há ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }

  return shortDateFormatter.format(at);
}
