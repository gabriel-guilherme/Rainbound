"use client";

import { useEffect, useRef, useState } from "react";
import ePub, { Rendition } from "epubjs";
import { ChevronRight, ChevronLeft } from "lucide-react";

const EPUB_URL = "/books/pride-and-prejudice.epub";

interface EpubLocation {
  start: {
    cfi?: string;
    displayed: {
      page: number;
      total: number;
    };
  };
}

type PageInfo = {
  currentPage: number;
  totalPages: number;
  progress: number;
};

type EpubReaderProps = {
  onPageChange: (info: PageInfo) => void;
};

export default function EpubReader({ onPageChange }: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    let cancelled = false;
    let book: ReturnType<typeof ePub> | null = null;

    async function loadBook() {
      try {
        book = ePub();

        await book.open(EPUB_URL);

        await book.locations.generate(1024);

        if (cancelled || !viewerRef.current) {
          book.destroy();
          return;
        }

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          allowScriptedContent: true,
          spread: "always",
        });

        rendition.themes.default({
          body: {
            "font-family": "Georgia, serif",
            "font-size": "18px",
            "line-height": "1.7",
            color: "#e0e4ce",
            background: "none",
            margin: "0",
            padding: "40px",
          },

          p: {
            "text-align": "justify",
            "margin-bottom": "1em",
          },

          h1: {
            "font-family": "Georgia, serif",
            "margin-bottom": "1em",
          },

          a: {
            color: "#6e9987",
          },
        });

        rendition.on("relocated", (location: EpubLocation) => {
          const cfi = location.start.cfi;

          if (!cfi) return;

          const currentLocation = Number(book!.locations.locationFromCfi(cfi));

          const totalLocations = book!.locations.length();

          const progress = Math.round((currentLocation / totalLocations) * 100);

          onPageChange({
            currentPage: currentLocation,
            totalPages: totalLocations,
            progress,
          });
        });

        renditionRef.current = rendition;

        await rendition.display();

        if (cancelled) {
          rendition.destroy();
          return;
        }

        console.log("EPUB renderizado");
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar EPUB:", error);
        }
      }
    }

    loadBook();

    return () => {
      cancelled = true;

      renditionRef.current?.destroy();
      renditionRef.current = null;

      book?.destroy();
      book = null;
    };
  }, []);

  function previousPage() {
    renditionRef.current?.prev();
  }

  function nextPage() {
    renditionRef.current?.next();
  }

  return (
    <div className="flex relative h-full w-full">
      <div ref={viewerRef} className="h-full w-full" />

      <button
        onClick={previousPage}
        className="absolute left-0 top-1/2 -translate-y-1/2 cursor-pointer"
      >
        <ChevronLeft size={64} />
      </button>

      <button
        onClick={nextPage}
        className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer"
      >
        <ChevronRight size={64} />
      </button>
    </div>
  );
}
