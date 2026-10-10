"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { DocumentProps } from "react-pdf";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

import type { PageInfo } from "./Reader";
import type { ReaderProgress } from "./readerTypes";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfReaderProps {
  file: DocumentProps["file"];
  pageNumber: number;
  onPageChange?: (pageInfo: PageInfo) => void;
  onProgressChange?: (progress: ReaderProgress) => void;
}

export default function PdfReader({
  file,
  pageNumber,
  onPageChange,
  onProgressChange,
}: PdfReaderProps) {
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

  useEffect(() => {
    if (!numPages) {
      return;
    }

    const percentage = Math.round((pageNumber / numPages) * 100);

    onPageChange?.({
      currentPage: pageNumber,
      totalPages: numPages,
      progress: percentage,
      isTwoPages: false,
      chapterTitle: "PDF",
    });

    onProgressChange?.({
      currentPosition: pageNumber - 1,
      totalPositions: numPages,
      percentage,
      locator: `pdf-page:${pageNumber}`,
    });
  }, [numPages, onPageChange, onProgressChange, pageNumber]);

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center gap-3">
        <p>Failed to load: {loadError.message}</p>

        <button
          type="button"
          onClick={() => {
            setLoadError(null);
            setRetryKey((previous) => previous + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Zoom */}
      <div className="flex shrink-0 items-center justify-center gap-2 p-2">
        <button
          type="button"
          onClick={zoomOut}
          disabled={scale <= 0.5}
          aria-label="Diminuir zoom"
        >
          −
        </button>

        <span aria-live="polite">{Math.round(scale * 100)}%</span>

        <button
          type="button"
          onClick={zoomIn}
          disabled={scale >= 3}
          aria-label="Aumentar zoom"
        >
          +
        </button>
      </div>

      {/* PDF */}
      <div
        ref={viewerRef}
        className="z-0 flex min-h-0 min-w-0 flex-1 items-start justify-start overflow-auto"
      >
        <div className="flex min-h-full min-w-full w-max items-center justify-center">
          <Document
            key={retryKey}
            file={file}
            onLoadSuccess={({ numPages }) => {
              setNumPages(numPages);
            }}
            onLoadError={setLoadError}
            loading={<div>Loading PDF...</div>}
          >
            <Page pageNumber={pageNumber} scale={scale} width={pageWidth} />
          </Document>
        </div>
      </div>
    </div>
  );
}
