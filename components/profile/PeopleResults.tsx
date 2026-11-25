"use client";

import { useState, useTransition } from "react";

import { loadPeople } from "@/app/people/actions";
import { useLoadMore } from "@/components/common/useLoadMore";
import type { FollowPerson } from "@/lib/profile/follow";

import FollowList from "./FollowList";

type PeopleResultsProps = {
  query: string;
  initial: { people: FollowPerson[]; nextOffset: number | null };
  viewerId: string;
  emptyText: string;
};

/* Resultados da busca de pessoas, carregando mais ao chegar no fim. */
export default function PeopleResults({ query, initial, viewerId, emptyText }: PeopleResultsProps) {
  const [people, setPeople] = useState(initial.people);
  const [nextOffset, setNextOffset] = useState(initial.nextOffset);
  const [error, setError] = useState(false);
  const [isLoading, startLoading] = useTransition();

  const sentinelRef = useLoadMore({
    hasMore: nextOffset !== null && !error,
    isLoading,
    onLoadMore: () =>
      startLoading(async () => {
        try {
          const next = await loadPeople(query, nextOffset);

          setPeople((current) => [
            ...current,
            ...next.people.filter((person) => !current.some((item) => item.id === person.id)),
          ]);
          setNextOffset(next.nextOffset);
        } catch {
          setError(true);
        }
      }),
  });

  return (
    <>
      <FollowList people={people} viewerId={viewerId} emptyText={emptyText} />
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
    </>
  );
}
