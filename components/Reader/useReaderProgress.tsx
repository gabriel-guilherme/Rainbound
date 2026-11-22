"use client";

import { useCallback, useEffect, useRef } from "react";

import { saveBookProgress } from "@/app/read/actions";

import type { ReaderProgress } from "./readerTypes";

type UseReaderProgressProps = {
  bookId: number;
  progress: ReaderProgress | null;
  enabled?: boolean;
  delay?: number;
};

const BEACON_URL = "/api/reading-progress";

function sendProgressBeacon(bookId: number, progress: ReaderProgress) {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) {
    return false;
  }

  const body = new Blob([JSON.stringify({ bookId, ...progress })], {
    type: "application/json",
  });

  return navigator.sendBeacon(BEACON_URL, body);
}

/*
 * Salva o progresso com debounce. O que ainda não foi salvo é enviado:
 * - ao esconder/fechar a aba, via sendBeacon (sobrevive ao descarregamento);
 * - ao sair do leitor pela navegação do app (desmontagem), via Server Action.
 */
export function useReaderProgress({
  bookId,
  progress,
  enabled = true,
  delay = 0,
}: UseReaderProgressProps) {
  const pendingRef = useRef<ReaderProgress | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  const flush = useCallback(
    (transport: "action" | "beacon") => {
      const pending = pendingRef.current;

      if (!pending) {
        return;
      }

      pendingRef.current = null;

      /* Evita regravar a mesma posição (ex.: abrir e fechar sem virar página). */
      const key = `${pending.locator}|${pending.percentage}`;

      if (key === lastSavedRef.current) {
        return;
      }

      lastSavedRef.current = key;

      if (transport === "beacon" && sendProgressBeacon(bookId, pending)) {
        return;
      }

      void saveBookProgress(bookId, pending).catch((error) => {
        console.error("Erro ao salvar progresso:", error);
      });
    },
    [bookId],
  );

  /* Debounce: cada mudança reinicia o prazo. */
  useEffect(() => {
    if (!enabled || !progress) {
      return;
    }

    pendingRef.current = progress;

    const timeout = setTimeout(() => flush("action"), delay);

    return () => clearTimeout(timeout);
  }, [progress, enabled, delay, flush]);

  /* Aba escondida (troca de app no celular) ou fechada. */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush("beacon");
      }
    };

    const handlePageHide = () => flush("beacon");

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);

      /* Saindo do leitor (ou trocando de livro): salva o que faltou. */
      flush("action");
    };
  }, [flush]);
}
