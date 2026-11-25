"use client";

import { useState, useTransition } from "react";

import { loadFeed } from "@/app/people/actions";
import { useLoadMore } from "@/components/common/useLoadMore";
import type { FollowingFeedPage } from "@/lib/profile/feed";

import ActivityItem from "./ActivityItem";

type ActivityFeedProps = {
  initial: FollowingFeedPage;
  viewerId: string;
  now: number;
};

/* Aba Atividade de /pessoas: carrega mais ao chegar no fim. */
export default function ActivityFeed({ initial, viewerId, now }: ActivityFeedProps) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [error, setError] = useState(false);
  const [isLoading, startLoading] = useTransition();

  const sentinelRef = useLoadMore({
    hasMore: Boolean(cursor) && !error,
    isLoading,
    onLoadMore: () =>
      startLoading(async () => {
        try {
          const next = await loadFeed(cursor);

          setItems((current) => [...current, ...next.items]);
          setCursor(next.nextCursor);
        } catch {
          setError(true);
        }
      }),
  });

  if (items.length === 0) {
    return (
      <p className="bg-primary px-5 py-10 text-center text-sm text-contrast/75">
        Nenhuma atividade por enquanto.
      </p>
    );
  }

  return (
    <>
      <ol className="flex flex-col bg-primary px-4 sm:px-5">
        {items.map(({ event, person }, index) => (
          <li
            key={`${event.userId}-${event.kind}-${event.at.toString()}-${index}`}
            className="border-t border-contrast/10 first:border-t-0"
          >
            <ActivityItem event={event} isMine={event.userId === viewerId} person={person} now={now} />
          </li>
        ))}
      </ol>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      {isLoading && <p className="text-center text-xs text-contrast/60">Carregando mais…</p>}
      {error && (
        <button
          type="button"
          onClick={() => setError(false)}
          className="mx-auto cursor-pointer text-xs text-danger underline-offset-4 hover:underline"
        >
          Não foi possível carregar. Tentar de novo
        </button>
      )}
      {!cursor && (
        <p className="text-center text-xs text-contrast/60">Isso é tudo dos últimos meses.</p>
      )}
    </>
  );
}
