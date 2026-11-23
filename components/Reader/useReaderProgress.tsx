"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveBookProgress, setBookProgress } from "@/app/read/actions";

import type { ReaderProgress } from "./readerTypes";

type UseReaderProgressProps = {
  bookId: number;
  progress: ReaderProgress | null;
  /* Progresso já salvo no banco quando o leitor abriu. */
  initialSaved: ReaderProgress | null;
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
 * Mesma regra do servidor (saveReadingProgress): o automático só avança,
 * a não ser que o total de posições tenha mudado (arquivo trocado).
 */
function isAhead(next: ReaderProgress, saved: ReaderProgress | null) {
  return (
    !saved ||
    saved.totalPositions !== next.totalPositions ||
    next.currentPosition > saved.currentPosition
  );
}

/*
 * Salva o progresso com debounce, só quando avança: voltar páginas para
 * reler não muda o salvo. O que ainda não foi salvo é enviado:
 * - ao esconder/fechar a aba, via sendBeacon (sobrevive ao descarregamento);
 * - ao sair do leitor pela navegação do app (desmontagem), via Server Action.
 *
 * `forceSave` grava a posição mesmo para trás (botão "Salvar aqui").
 */
export function useReaderProgress({
  bookId,
  progress,
  initialSaved,
  enabled = true,
  delay = 0,
}: UseReaderProgressProps) {
  const pendingRef = useRef<ReaderProgress | null>(null);

  /* Último progresso salvo (ou enviado): o marcador "Onde parei". */
  const [saved, setSaved] = useState(initialSaved);
  const savedRef = useRef(initialSaved);

  const markSaved = useCallback((value: ReaderProgress | null) => {
    savedRef.current = value;
    setSaved(value);
  }, []);

  const flush = useCallback(
    (transport: "action" | "beacon") => {
      const pending = pendingRef.current;

      if (!pending) {
        return;
      }

      pendingRef.current = null;

      if (!isAhead(pending, savedRef.current)) {
        return;
      }

      markSaved(pending);

      if (transport === "beacon" && sendProgressBeacon(bookId, pending)) {
        return;
      }

      void saveBookProgress(bookId, pending).catch((error) => {
        console.error("Erro ao salvar progresso:", error);
      });
    },
    [bookId, markSaved],
  );

  const forceSave = useCallback(
    async (value: ReaderProgress) => {
      const previous = savedRef.current;

      pendingRef.current = null;
      markSaved(value);

      try {
        await setBookProgress(bookId, value);
      } catch (error) {
        markSaved(previous);
        throw error;
      }
    },
    [bookId, markSaved],
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

  return { saved, forceSave };
}
