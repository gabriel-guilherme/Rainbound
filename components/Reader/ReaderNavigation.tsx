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
        className="flex w-7 shrink-0 cursor-pointer items-center justify-center p-0 transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:w-auto sm:p-2"
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-6 sm:size-12 md:size-16" />
      </button>

      <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        {children}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="flex w-7 shrink-0 cursor-pointer items-center justify-center p-0 transition-opacity disabled:pointer-events-none disabled:opacity-0 sm:w-auto sm:p-2"
        aria-label="Próxima página"
      >
        <ChevronRight className="size-6 sm:size-12 md:size-16" />
      </button>
    </div>
  );
}
