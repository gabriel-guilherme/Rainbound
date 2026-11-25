"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import { fetchBookFile } from "@/lib/books/cache";

import FileError from "../FileError";
import { calculateProgress, getPdfPage } from "../readerUtils";
import type { ReaderEngineProps } from "../readerTypes";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function PdfReader({
  bookId,
  bookUrl,
  locator,
  onReady,
  onPageChange,
  onProgressChange,
  zoom,
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
  const [pageWidth, setPageWidth] = useState<number>(600);

  const viewerRef = useRef<HTMLDivElement>(null);

  /* Falha ao baixar (rede) ou ao abrir (arquivo inválido). */
  const [loadError, setLoadError] = useState<"download" | "file" | null>(
    null,
  );
  const [retryKey, setRetryKey] = useState<number>(0);

  /*
   * Arquivo pelo cache do navegador (lib/books/cache.ts), como EPUB e CBZ.
   * O objeto fica em estado para o react-pdf não recarregar a cada
   * render. O pdf.js transfere o buffer para o worker (ele fica
   * inutilizável aqui), então cada tentativa busca uma cópia nova.
   */
  const [file, setFile] = useState<{ data: Uint8Array } | null>(null);

  useEffect(() => {
    let cancelled = false;

    setFile(null);

    fetchBookFile(bookId, bookUrl)
      .then((data) => {
        if (!cancelled) setFile({ data: new Uint8Array(data) });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Erro ao baixar PDF:", error);
          setLoadError("download");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookId, bookUrl, retryKey]);

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
      goToLocator: (locator) => setPageNumber(clamp(getPdfPage(locator))),
    });

    /* Locator salvo pode apontar além do fim (arquivo trocado). */
    setPageNumber((page) => clamp(page));
  }, [numPages]);

  /* Com zoom, cada página nova começa do topo. */
  useEffect(() => {
    viewerRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageNumber]);

  useEffect(() => {
    if (!numPages || pageNumber > numPages) {
      return;
    }

    const percentage = calculateProgress(pageNumber, numPages);

    callbacksRef.current.onPageChange({
      currentPage: pageNumber,
      totalPages: numPages,
      progress: percentage,
      atStart: pageNumber <= 1,
      atEnd: pageNumber >= numPages,
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
      <FileError
        title="Não foi possível abrir o PDF."
        message={
          loadError === "download"
            ? "Não foi possível baixar o arquivo. Verifique a conexão."
            : "O arquivo pode estar corrompido ou fora do padrão PDF."
        }
        onRetry={() => {
          setLoadError(null);
          setRetryKey((previous) => previous + 1);
        }}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* PDF */}
      <div
        ref={viewerRef}
        className="z-0 flex min-h-0 min-w-0 flex-1 items-start justify-start overflow-auto"
      >
        <div className="flex min-h-full w-max min-w-full shrink-0 items-center justify-center p-4">
          {!file ? (
            <div className="flex h-[60vh] items-center justify-center text-sm text-contrast/50">
              Abrindo PDF...
            </div>
          ) : (
          <Document
            key={retryKey}
            file={file}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
            }}
            onLoadError={(error) => {
              console.error("Erro ao abrir PDF:", error);
              setLoadError("file");
            }}
            loading={
              <div className="flex h-[60vh] items-center justify-center text-sm text-contrast/50">
                Abrindo PDF...
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={zoom}
              width={pageWidth}
              className="reader-pdf-page shadow-2xl shadow-black/60"
              loading={null}
            />
          </Document>
          )}
        </div>
      </div>
    </div>
  );
}
