"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useEffect, useRef } from "react";

import { attachSwipe } from "@/lib/swipe";

type ReaderNavigationProps = {
  children?: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  /* Modo imersivo do celular: esconde as setas (o gesto continua). */
  hideArrowsOnMobile?: boolean;
};

export default function ReaderNavigation({
  children,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  hideArrowsOnMobile = false,
}: ReaderNavigationProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  /* Valores atuais lidos no fim do gesto, sem re-registrar listeners. */
  const swipeRef = useRef({ onPrevious, onNext, previousDisabled, nextDisabled });

  useEffect(() => {
    swipeRef.current = { onPrevious, onNext, previousDisabled, nextDisabled };
  });

  /*
   * Arrastar para o lado vira a página (PDF e CBZ). O EPUB fica num
   * iframe, que não repassa os toques; lá o gesto é registrado pelo
   * próprio motor.
   */
  useEffect(() => {
    const content = contentRef.current;

    if (!content) return;

    return attachSwipe(
      content,
      () => {
        const current = swipeRef.current;

        return {
          onPrevious: () => !current.previousDisabled && current.onPrevious(),
          onNext: () => !current.nextDisabled && current.onNext(),
        };
      },
      { scrollRoot: content },
    );
  }, []);

  const arrowClassName = [
    "flex w-7 shrink-0 cursor-pointer items-center justify-center self-stretch p-0 text-contrast/40 transition-colors hover:text-contrast disabled:pointer-events-none disabled:opacity-0 sm:w-auto sm:p-2",
    hideArrowsOnMobile ? "max-sm:hidden" : "",
  ].join(" ");

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-between">
      <button
        type="button"
        onClick={onPrevious}
        disabled={previousDisabled}
        className={arrowClassName}
        aria-label="Página anterior"
      >
        <ChevronLeft strokeWidth={1.5} className="size-6 sm:size-10 md:size-12" />
      </button>

      <div
        ref={contentRef}
        className="h-full min-h-0 min-w-0 flex-1 overflow-hidden"
      >
        {children}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className={arrowClassName}
        aria-label="Próxima página"
      >
        <ChevronRight strokeWidth={1.5} className="size-6 sm:size-10 md:size-12" />
      </button>
    </div>
  );
}
