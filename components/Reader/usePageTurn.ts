"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

import type { PageInfo, ReaderController, TurnDirection } from "./readerTypes";

/* Animação ao virar a página: deslocamento (px), duração e validade (ms). */
const TURN_OFFSET = 48;
const TURN_DURATION = 280;
const TURN_TIMEOUT = 1500;

/*
 * Virar página (setas, teclado, arraste e o EPUB por onTurnPage) com a
 * animação. O pedido fica guardado e a animação só roda quando o motor
 * avisa a nova posição (onPageChange), para não animar a página antiga
 * antes da troca. Pedidos que não mudam nada (fim do livro) expiram.
 *
 * `turnPage` não muda entre renderizações (lê tudo por refs): ele vai
 * para o motor, que recarregaria o livro se a função mudasse.
 */
export function usePageTurn(
  controllerRef: RefObject<ReaderController | null>,
  pageInfo: PageInfo,
) {
  const pageRef = useRef<HTMLDivElement>(null);
  const pendingTurnRef = useRef<{ direction: TurnDirection; time: number } | null>(
    null,
  );

  /* Início/fim atuais para barrar viradas além do livro. */
  const pageInfoRef = useRef(pageInfo);

  useEffect(() => {
    pageInfoRef.current = pageInfo;
  });

  const turnPage = useCallback(
    (direction: TurnDirection) => {
      const { atStart, atEnd } = pageInfoRef.current;

      if (direction === "next" ? atEnd : atStart) return;

      pendingTurnRef.current = { direction, time: Date.now() };

      if (direction === "next") controllerRef.current?.next();
      else controllerRef.current?.previous();
    },
    [controllerRef],
  );

  useEffect(() => {
    const pending = pendingTurnRef.current;
    const element = pageRef.current;

    pendingTurnRef.current = null;

    if (!pending || !element || Date.now() - pending.time > TURN_TIMEOUT) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const offset = pending.direction === "next" ? TURN_OFFSET : -TURN_OFFSET;

    element.animate(
      [
        { opacity: 0.2, transform: `translateX(${offset}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: TURN_DURATION, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [pageInfo]);

  const goToPrevious = useCallback(() => turnPage("previous"), [turnPage]);
  const goToNext = useCallback(() => turnPage("next"), [turnPage]);

  /* Saltos (seletor de página, sumário, marcadores) não animam. */
  const cancelTurn = useCallback(() => {
    pendingTurnRef.current = null;
  }, []);

  return { pageRef, turnPage, goToPrevious, goToNext, cancelTurn };
}
