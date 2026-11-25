import { AccountStatus, ReadingStatus } from "@/generated/prisma/enums";

import { prisma } from "../services/prisma";
import { DEFAULT_TIME_ZONE, dateKeyToUtc, isValidTimeZone } from "../streak/rules";
import { getStreakSummary, todayIn } from "../streak/server";
import { getAvatar } from "./avatar";
import { readProfileLayout } from "./layout";
import { normalizeUsername } from "./rules";

/*
 * Perfil no banco: a página /u/<username> e os números do cabeçalho.
 */

/* Perfil de uma conta aprovada pelo usuário do endereço; null se não existe. */
export async function getProfileByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username: normalizeUsername(username) },
    select: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      status: true,
      avatarColor: true,
      avatarLetter: true,
      bio: true,
      isProfilePublic: true,
      profileLayout: true,
      timeZone: true,
      createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });

  if (!user || user.status !== AccountStatus.APPROVED || !user.username) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    displayUsername: user.displayUsername || user.username,
    avatar: getAvatar(user),
    bio: user.bio,
    isPublic: user.isProfilePublic,
    layout: readProfileLayout(user.profileLayout),
    /* Fuso da última leitura; sem nenhuma ainda, o padrão do app. */
    timeZone: isValidTimeZone(user.timeZone) ? user.timeZone : DEFAULT_TIME_ZONE,
    createdAt: user.createdAt,
    followers: user._count.followers,
    following: user._count.following,
  };
}

export type Profile = NonNullable<Awaited<ReturnType<typeof getProfileByUsername>>>;

/* Os quatro números do cabeçalho, no ano e no fuso do dono do perfil. */
export async function getProfileStats(userId: string, timeZone: string) {
  const year = todayIn(timeZone).slice(0, 4);
  const yearStart = `${year}-01-01`;

  const [readThisYear, readingNow, yearTime, streak] = await Promise.all([
    prisma.book.count({
      where: {
        userId,
        status: ReadingStatus.READ,
        finishedAt: { gte: new Date(`${yearStart}T00:00:00Z`) },
      },
    }),
    prisma.book.count({ where: { userId, status: ReadingStatus.READING } }),
    prisma.readingDay.aggregate({
      where: { userId, date: { gte: dateKeyToUtc(yearStart) } },
      _sum: { seconds: true },
    }),
    getStreakSummary(userId, timeZone),
  ]);

  return {
    year,
    readThisYear,
    readingNow,
    secondsThisYear: yearTime._sum.seconds ?? 0,
    currentStreak: streak.current,
  };
}
