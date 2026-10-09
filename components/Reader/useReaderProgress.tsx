"use client";

import { useEffect } from "react";

import { saveBookProgress } from "@/app/read/actions";

import type { ReaderProgress } from "./readerTypes";

type UseReaderProgressProps = {
  bookId: number;
  progress: ReaderProgress | null;
  enabled?: boolean;
  delay?: number;
};

export function useReaderProgress({
  bookId,
  progress,
  enabled = true,
  delay = 0,
}: UseReaderProgressProps) {
  useEffect(() => {
    if (!enabled || !progress) {
      return;
    }

    const timeout = setTimeout(() => {
      void saveBookProgress(bookId, progress).catch((error) => {
        console.error("Erro ao salvar progresso:", error);
      });
    }, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [bookId, progress, enabled, delay]);
}
