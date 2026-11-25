import type { Metadata } from "next";

import MarkNotificationsRead from "@/components/notifications/MarkNotificationsRead";
import NotificationFeed from "@/components/notifications/NotificationFeed";
import { requireApprovedUser } from "@/lib/auth/session";
import { listNotificationGroups } from "@/lib/notifications/server";
import { getTimeZone, todayIn } from "@/lib/streak/server";

export const metadata: Metadata = { title: "Notificações" };

function pageNow() {
  return Date.now();
}

/*
 * Todas as notificações (/notificacoes), separadas por dia, carregando
 * mais ao chegar no fim. Abrir a página marca tudo como lido no navegador
 * (MarkNotificationsRead), o que também apaga as lidas com mais de 90 dias.
 */
export default async function NotificationsPage() {
  const { id: userId } = await requireApprovedUser();
  const timeZone = await getTimeZone();
  const initial = await listNotificationGroups(userId, timeZone);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 pt-32">
      <div>
        <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">Notificações</h1>
        <p className="mt-2 text-sm text-contrast/70">As lidas somem depois de 90 dias.</p>
      </div>

      <NotificationFeed initial={initial} now={pageNow()} withDays today={todayIn(timeZone)} />
      {initial.groups.some((group) => group.unread) && <MarkNotificationsRead />}
    </div>
  );
}
