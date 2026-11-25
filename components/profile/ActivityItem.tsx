import { BookCheck, BookOpen, Droplet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DEFAULT_COVER } from "@/lib/books/labels";
import { formatActivityWhen, type ActivityEvent } from "@/lib/reading/activityFormat";
import type { Avatar as AvatarData } from "@/lib/profile/avatar";

import Avatar from "./Avatar";

type ActivityItemProps = {
  event: ActivityEvent;
  isMine: boolean;
  person?: { name: string; username: string; avatar: AvatarData };
  now: number;
};

const ICON = { started: BookOpen, finished: BookCheck, streak: Droplet };

const VERB = {
  started: ["começou", "Começou"],
  finished: ["terminou", "Terminou"],
  streak: ["chegou a", "Chegou a"],
} as const;

/*
 * Uma linha de atividade: quem, o quê, o livro e quando. Os livros só
 * levam à página do livro quando são de quem está vendo.
 */
export default function ActivityItem({ event, isMine, person, now }: ActivityItemProps) {
  const Icon = ICON[event.kind];
  const hasBook = event.kind !== "streak";
  const bookHref = isMine && hasBook ? `/library/${event.bookId}` : undefined;

  const subject = isMine ? (
    <>Você {VERB[event.kind][0]}</>
  ) : person ? (
    <>
      <Link href={`/u/${person.username}`} className="font-semibold hover:text-danger">
        {person.name}
      </Link>{" "}
      {VERB[event.kind][0]}
    </>
  ) : (
    <>{VERB[event.kind][1]}</>
  );

  const what =
    event.kind === "streak" ? (
      <>
        <strong>{event.days} dias seguidos</strong> lendo
      </>
    ) : (
      <>
        {bookHref ? (
          <Link href={bookHref} className="font-semibold hover:text-danger">
            {event.title}
          </Link>
        ) : (
          <strong>{event.title}</strong>
        )}
        {event.kind === "finished" && event.rating ? (
          <span className="text-contrast/70"> · ★ {event.rating}</span>
        ) : null}
      </>
    );

  const thumb = hasBook ? (
    <span className="relative aspect-[7/10] w-8 shrink-0">
      <Image src={event.coverUrl ?? DEFAULT_COVER} alt="" fill sizes="32px" className="object-cover" />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="flex aspect-[7/10] w-8 shrink-0 items-center justify-center bg-interaction/15 text-interaction"
    >
      <Droplet size={16} fill="currentColor" strokeWidth={1.5} />
    </span>
  );

  return (
    <div className="flex items-center gap-3 py-2.5">
      {person ? (
        <Link href={`/u/${person.username}`} aria-label={`Perfil de ${person.name}`} className="shrink-0">
          <Avatar avatar={person.avatar} size={40} />
        </Link>
      ) : (
        thumb
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          {subject} {what}
        </p>
        <p className="flex items-center gap-1 text-xs text-contrast/60">
          <Icon size={12} aria-hidden="true" />
          {formatActivityWhen(event.at, now)}
        </p>
      </div>

      {person && thumb}
    </div>
  );
}
