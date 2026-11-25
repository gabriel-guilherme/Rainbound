import { NotificationType } from "@/generated/prisma/enums";

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
