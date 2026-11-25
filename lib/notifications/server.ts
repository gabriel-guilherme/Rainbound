import { NotificationType } from "@/generated/prisma/enums";

import { getAvatar } from "../profile/avatar";
import { prisma } from "../services/prisma";

/*
 * Notificações no banco (tabela Notification). As de seguir: no máximo
 * uma por par (seguir, deixar de seguir e seguir de novo não avisa outra
 * vez). Ninguém recebe notificação de algo que fez a si mesmo.
 */

export async function notifyFollow(followerId: string, followedId: string) {
  if (followerId === followedId) return;

  const existing = await prisma.notification.findFirst({
    where: { userId: followedId, actorId: followerId, type: NotificationType.FOLLOW },
    select: { id: true },
  });

  if (existing) return;

  await prisma.notification.create({
    data: { userId: followedId, actorId: followerId, type: NotificationType.FOLLOW },
  });
}

export const NOTIFICATION_PAGE_SIZE = 20;

/* Avatares mostrados por grupo (o resto vira "e mais N"). */
const ACTORS_PER_GROUP = 2;

const READ_RETENTION_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });

  await prisma.notification.deleteMany({
    where: { userId, readAt: { lt: new Date(Date.now() - READ_RETENTION_DAYS * DAY_MS) } },
  });
}

export type NotificationActor = {
  id: string;
  name: string;
  username: string;
  avatar: ReturnType<typeof getAvatar>;
  followedBack: boolean;
};

/* Uma linha: as notificações do mesmo tipo e do mesmo dia. */
export type NotificationGroup = {
  key: string;
  type: NotificationType;
  /* "AAAA-MM-DD", no fuso de quem vê. */
  day: string;
  actors: NotificationActor[];
  total: number;
  latestAt: Date;
  unread: boolean;
};

export type NotificationPage = {
  groups: NotificationGroup[];
  nextCursor: string | null;
};

type GroupRow = {
  type: NotificationType;
  day: string;
  latest: Date;
  total: number;
  unread: boolean;
  actorId: string;
};

/*
 * Notificações agrupadas por tipo e dia (no fuso de quem vê), da mais
 * recente para a mais antiga: "Marina, Caio e mais 2 começaram a seguir
 * você". Paginada pelos grupos: `cursor` é a data da mais recente do
 * último grupo já mostrado. Agrupamento e contagem saem do banco, para o
 * "e mais N" ficar certo.
 */
export async function listNotificationGroups(
  userId: string,
  timeZone: string,
  cursor: Date | null = null,
  limit = NOTIFICATION_PAGE_SIZE,
): Promise<NotificationPage> {
  const before = cursor ?? new Date("9999-12-31T00:00:00Z");

  const rows = await prisma.$queryRaw<GroupRow[]>`
    WITH base AS (
      SELECT n."actorId", n."type", n."createdAt", n."readAt",
             ((n."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone})::date AS day
      FROM "Notification" n
      JOIN "User" u ON u."id" = n."actorId"
      WHERE n."userId" = ${userId} AND u."status" = 'APPROVED' AND u."username" IS NOT NULL
    ),
    groups AS (
      SELECT "type", day, max("createdAt") AS latest,
             count(DISTINCT "actorId")::int AS total,
             bool_or("readAt" IS NULL) AS unread
      FROM base
      GROUP BY "type", day
      HAVING max("createdAt") < ${before}
      ORDER BY latest DESC
      LIMIT ${limit + 1}
    ),
    actors AS (
      SELECT b."type", b.day, b."actorId", max(b."createdAt") AS at
      FROM base b
      JOIN groups g ON g."type" = b."type" AND g.day = b.day
      GROUP BY b."type", b.day, b."actorId"
    ),
    ranked AS (
      SELECT *, row_number() OVER (PARTITION BY "type", day ORDER BY at DESC) AS rn
      FROM actors
    )
    SELECT g."type", g.day::text AS day, g.latest, g.total, g.unread, r."actorId"
    FROM groups g
    JOIN ranked r ON r."type" = g."type" AND r.day = g.day AND r.rn <= ${ACTORS_PER_GROUP}
    ORDER BY g.latest DESC, r.rn
  `;

  const actorIds = [...new Set(rows.map((row) => row.actorId))];

  const [users, follows] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, username: true, avatarColor: true, avatarLetter: true },
    }),
    prisma.follow.findMany({
      where: { followerId: userId, followedId: { in: actorIds } },
      select: { followedId: true },
    }),
  ]);

  const people = new Map(users.map((user) => [user.id, user]));
  const followedBack = new Set(follows.map((row) => row.followedId));
  const groups = new Map<string, NotificationGroup>();

  for (const row of rows) {
    const person = people.get(row.actorId);

    if (!person?.username) continue;

    const key = `${row.type}:${row.day}`;
    let group = groups.get(key);

    if (!group) {
      group = {
        key,
        type: row.type,
        day: row.day,
        actors: [],
        total: row.total,
        latestAt: new Date(row.latest),
        unread: row.unread,
      };
      groups.set(key, group);
    }

    group.actors.push({
      id: person.id,
      name: person.name,
      username: person.username,
      avatar: getAvatar(person),
      followedBack: followedBack.has(person.id),
    });
  }

  const all = [...groups.values()];
  const page = all.slice(0, limit);

  return {
    groups: page,
    nextCursor: all.length > limit ? page[page.length - 1].latestAt.toISOString() : null,
  };
}
