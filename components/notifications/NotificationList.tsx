"use client";

import Link from "next/link";

import Avatar from "@/components/profile/Avatar";
import FollowButton from "@/components/profile/FollowButton";
import { formatActorNames, formatNotificationWhen } from "@/lib/notifications/format";
import type { NotificationGroup } from "@/lib/notifications/server";

type NotificationListProps = {
  groups: NotificationGroup[];
  now: number;
  onNavigate?: () => void;
};

function describe(group: NotificationGroup) {
  const names = formatActorNames(group.actors.map((actor) => actor.name));

  switch (group.type) {
    case "FOLLOW":
      return `${names} ${group.actors.length === 1 ? "começou" : "começaram"} a seguir você`;
    case "LIKE":
      return `${names} curtiu sua atividade`;
    case "COMMENT":
      return `${names} comentou na sua atividade`;
  }
}

/*
 * Linhas de notificação (painel do sino e /notificacoes): avatar (dois
 * sobrepostos quando agrupadas), texto, quando e "Seguir de volta" para
 * quem ainda não segue de volta. As não lidas ficam destacadas.
 */
export default function NotificationList({ groups, now, onNavigate }: NotificationListProps) {
  return (
    <ul className="flex flex-col">
      {groups.map((group) => {
        const [first, second] = group.actors;
        const single = group.actors.length === 1;

        return (
          <li
            key={group.key}
            className={`flex items-center gap-3 border-b border-contrast/10 px-4 py-3 last:border-b-0 ${
              group.unread ? "bg-interaction/8" : ""
            }`}
          >
            <Link
              href={`/u/${first.username}`}
              onClick={onNavigate}
              aria-label={`Perfil de ${first.name}`}
              className="relative size-10 shrink-0"
            >
              {second ? (
                <>
                  <Avatar avatar={second.avatar} size={28} className="absolute bottom-0 right-0 ring-2 ring-primary" />
                  <Avatar avatar={first.avatar} size={28} className="absolute left-0 top-0 ring-2 ring-primary" />
                </>
              ) : (
                <Avatar avatar={first.avatar} size={40} />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                {single ? (
                  <Link href={`/u/${first.username}`} onClick={onNavigate} className="hover:text-danger">
                    {describe(group)}
                  </Link>
                ) : (
                  describe(group)
                )}
              </p>
              <p className="text-xs text-contrast/65">{formatNotificationWhen(group.createdAt, now)}</p>
            </div>

            {group.type === "FOLLOW" && single && !first.followedBack && (
              <FollowButton
                userId={first.id}
                name={first.name}
                following={false}
                size="sm"
                followLabel="Seguir de volta"
              />
            )}

            {group.unread && (
              <span aria-label="Não lida" className="size-2 shrink-0 bg-danger" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
