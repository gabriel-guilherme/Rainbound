"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import { getPdfPage } from "./readerUtils";
import type { ReaderEngineProps } from "./readerTypes";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PdfReader({
  bookUrl,
  locator,
  onReady,
  onPageChange,
  onProgressChange,
}: ReaderEngineProps) {
  const [pageNumber, setPageNumber] = useState(() => getPdfPage(locator));

  /*
   * Callbacks em ref: o Reader pode recriá-los a cada render sem
   * disparar os efeitos de novo.
   */
  const callbacksRef = useRef({ onReady, onPageChange, onProgressChange });

  useEffect(() => {
    callbacksRef.current = { onReady, onPageChange, onProgressChange };
  });
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1);
  const [pageWidth, setPageWidth] = useState<number>(600);

  const viewerRef = useRef<HTMLDivElement>(null);

  const [loadError, setLoadError] = useState<Error | null>(null);
  const [retryKey, setRetryKey] = useState<number>(0);

  useEffect(() => {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    const updatePageWidth = () => {
      const availableWidth = viewer.clientWidth;

      const width = Math.min(Math.floor(availableWidth * 0.8), 900);

      setPageWidth(Math.max(width, 300));
    };

    const resizeObserver = new ResizeObserver(updatePageWidth);

    updatePageWidth();
    resizeObserver.observe(viewer);

    return () => resizeObserver.disconnect();
  }, []);

  const zoomIn = () => {
    setScale((previous) => Math.min(previous + 0.25, 3));
  };

  const zoomOut = () => {
    setScale((previous) => Math.max(previous - 0.25, 0.5));
  };

  /*
   * Entrega o controle ao Reader quando o documento carrega.
   */
  useEffect(() => {
    if (!numPages) {
      return;
    }

    const clamp = (page: number) => Math.min(Math.max(page, 1), numPages);

    callbacksRef.current.onReady({
      previous: () => setPageNumber((page) => clamp(page - 1)),
      next: () => setPageNumber((page) => clamp(page + 1)),
      goToPage: (page) => setPageNumber(clamp(page)),
    });

    /* Locator salvo pode apontar além do fim (arquivo trocado). */
    setPageNumber((page) => clamp(page));
  }, [numPages]);

  useEffect(() => {
    if (!numPages || pageNumber > numPages) {
      return;
    }

    const percentage = Math.round((pageNumber / numPages) * 100);

    callbacksRef.current.onPageChange({
      currentPage: pageNumber,
      totalPages: numPages,
      progress: percentage,
      isTwoPages: false,
      chapterTitle: "",
    });

    callbacksRef.current.onProgressChange({
      currentPosition: pageNumber - 1,
      totalPositions: numPages,
      percentage,
      locator: `pdf-page:${pageNumber}`,
    });
  }, [numPages, pageNumber]);

  if (loadError) {
    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <p className="title-shelf text-3xl">Não foi possível abrir o PDF.</p>

        <p className="max-w-md text-sm text-contrast/50">
          {loadError.message}
        </p>

        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setRetryKey((previous) => previous + 1);
          }}
          className="btn-shelf mt-2 bg-danger text-primary hover:bg-contrast"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Zoom */}
      <div className="flex shrink-0 items-center justify-center gap-1 p-2">
        <button
          type="button"
          onClick={zoomOut}
          disabled={scale <= 0.5}
          aria-label="Diminuir zoom"
          className="flex size-8 cursor-pointer items-center justify-center text-lg text-contrast/70 transition-colors hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-30"
        >
          −
        </button>

        <span aria-live="polite" className="w-12 text-center text-xs text-contrast/60">
          {Math.round(scale * 100)}%
        </span>

        <button
          type="button"
          onClick={zoomIn}
          disabled={scale >= 3}
          aria-label="Aumentar zoom"
          className="flex size-8 cursor-pointer items-center justify-center text-lg text-contrast/70 transition-colors hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-30"
        >
          +
        </button>
      </div>

      {/* PDF */}
      <div
        ref={viewerRef}
        className="z-0 flex min-h-0 min-w-0 flex-1 items-start justify-start overflow-auto"
      >
        <div className="flex min-h-full w-max min-w-full shrink-0 items-center justify-center p-4">
          <Document
            key={retryKey}
            file={bookUrl}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
            }}
            onLoadError={setLoadError}
            loading={
              <div className="flex h-[60vh] items-center justify-center text-sm text-contrast/50">
                Abrindo PDF...
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              width={pageWidth}
              className="shadow-2xl shadow-black/60"
              loading={null}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
