"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode } from "react";

type ReaderNavigationProps = {
  children?: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
};

export default function ReaderNavigation({
  children,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
}: ReaderNavigationProps) {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-between">
      <button
        type="button"
        onClick={onPrevious}
        disabled={previousDisabled}
        className="flex w-7 shrink-0 cursor-pointer items-center justify-center self-stretch p-0 text-contrast/40 transition-colors hover:text-contrast disabled:pointer-events-none disabled:opacity-0 sm:w-auto sm:p-2"
        aria-label="Página anterior"
      >
        <ChevronLeft strokeWidth={1.5} className="size-6 sm:size-10 md:size-12" />
      </button>

      <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        {children}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="flex w-7 shrink-0 cursor-pointer items-center justify-center self-stretch p-0 text-contrast/40 transition-colors hover:text-contrast disabled:pointer-events-none disabled:opacity-0 sm:w-auto sm:p-2"
        aria-label="Próxima página"
      >
        <ChevronRight strokeWidth={1.5} className="size-6 sm:size-10 md:size-12" />
      </button>
    </div>
  );
}
