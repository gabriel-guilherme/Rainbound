"use client";

import { useEffect } from "react";

type ReaderKeyboardOptions = {
  canNavigate: boolean;
  canZoom: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onEscape: () => void;
};

/*
 * Teclado do leitor (exceto quando há um campo em foco):
 * ← → viram páginas; + − mudam o zoom; 0 volta ao 100%; Esc sai do modo
 * imersivo. No EPUB, o motor repassa para cá as teclas de dentro do iframe.
 */
export function useReaderKeyboard({
  canNavigate,
  canZoom,
  onPrevious,
  onNext,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onEscape,
}: ReaderKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key === "Escape") onEscape();

      if (canNavigate && event.key === "ArrowLeft") onPrevious();
      if (canNavigate && event.key === "ArrowRight") onNext();

      if (canZoom && (event.key === "+" || event.key === "=")) onZoomIn();
      if (canZoom && (event.key === "-" || event.key === "_")) onZoomOut();
      if (canZoom && event.key === "0") onResetZoom();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNavigate, canZoom, onPrevious, onNext, onZoomIn, onZoomOut, onResetZoom, onEscape]);
}
