"use server";

import { getApprovedUserId } from "@/lib/auth/session";
import { listNotificationGroups, markAllRead } from "@/lib/notifications/server";
import { getTimeZone } from "@/lib/streak/server";

/*
 * Uma página de notificações agrupadas por tipo e dia (painel do sino e
 * /notificacoes). Sem `cursor`, as mais recentes; com ele, as anteriores.
 */
export async function loadNotifications(cursor: unknown = null) {
  const userId = await getApprovedUserId();
  const date = typeof cursor === "string" ? new Date(cursor) : null;

  return listNotificationGroups(
    userId,
    await getTimeZone(),
    date && !Number.isNaN(date.getTime()) ? date : null,
  );
}

/* Marca todas como lidas. */
export async function markNotificationsRead() {
  const userId = await getApprovedUserId();

  await markAllRead(userId);
}
