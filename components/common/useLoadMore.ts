"use client";

import { useEffect, useRef, type RefObject } from "react";

type LoadMoreOptions = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  /* Caixa que rola (ex.: painel); sem ela, a página. */
  root?: RefObject<HTMLElement | null>;
};

/*
 * Carregar mais ao chegar no fim de uma lista: devolve o ref de um
 * marcador para pôr depois do último item. Quando ele aparece (com 200 px
 * de folga), chama `onLoadMore`.
 */
export function useLoadMore({ hasMore, isLoading, onLoadMore, root }: LoadMoreOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadRef = useRef(onLoadMore);

  useEffect(() => {
    loadRef.current = onLoadMore;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadRef.current();
      },
      { root: root?.current ?? null, rootMargin: "200px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, isLoading, root]);

  return sentinelRef;
}
