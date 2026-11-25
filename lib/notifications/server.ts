import { AccountStatus, NotificationType } from "@/generated/prisma/enums";

import { getAvatar } from "../profile/avatar";
import { prisma } from "../services/prisma";
import { dateKeyIn } from "../streak/rules";

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

export const PANEL_LIMIT = 30;

export async function countUnread(userId: string) {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}

export type NotificationActor = {
  id: string;
  name: string;
  username: string;
  avatar: ReturnType<typeof getAvatar>;
  followedBack: boolean;
};

/* Uma linha do painel: uma notificação ou várias do mesmo tipo e dia. */
export type NotificationGroup = {
  key: string;
  type: NotificationType;
  actors: NotificationActor[];
  createdAt: Date;
  unread: boolean;
};

/*
 * Notificações recentes, agrupadas por tipo e dia (no fuso de quem vê):
 * "Marina, Caio e mais 2 começaram a seguir você". Por enquanto só FOLLOW.
 */
export async function listNotificationGroups(
  userId: string,
  timeZone: string,
  limit = PANEL_LIMIT,
): Promise<NotificationGroup[]> {
  const rows = await prisma.notification.findMany({
    where: { userId, actor: { status: AccountStatus.APPROVED, username: { not: null } } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      readAt: true,
      createdAt: true,
      actor: {
        select: { id: true, name: true, username: true, avatarColor: true, avatarLetter: true },
      },
    },
  });

  const followedBack = new Set(
    (
      await prisma.follow.findMany({
        where: { followerId: userId, followedId: { in: rows.map((row) => row.actor.id) } },
        select: { followedId: true },
      })
    ).map((row) => row.followedId),
  );

  const groups = new Map<string, NotificationGroup>();

  for (const row of rows) {
    const key = `${row.type}:${dateKeyIn(row.createdAt, timeZone)}`;
    const actor: NotificationActor = {
      id: row.actor.id,
      name: row.actor.name,
      username: row.actor.username!,
      avatar: getAvatar(row.actor),
      followedBack: followedBack.has(row.actor.id),
    };
    const group = groups.get(key);

    if (group) {
      if (!group.actors.some((item) => item.id === actor.id)) group.actors.push(actor);
      group.unread ||= row.readAt === null;
    } else {
      groups.set(key, {
        key,
        type: row.type,
        actors: [actor],
        createdAt: row.createdAt,
        unread: row.readAt === null,
      });
    }
  }

  return [...groups.values()];
}
