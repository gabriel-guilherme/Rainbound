"use server";

import { getApprovedUserId } from "@/lib/auth/session";
import { listNotificationGroups, markAllRead } from "@/lib/notifications/server";
import { getTimeZone } from "@/lib/streak/server";

/* Notificações recentes para o painel do sino (agrupadas por tipo e dia). */
export async function loadNotifications() {
  const userId = await getApprovedUserId();

  return listNotificationGroups(userId, await getTimeZone());
}

/* Marca todas como lidas. */
export async function markNotificationsRead() {
  const userId = await getApprovedUserId();

  await markAllRead(userId);
}
