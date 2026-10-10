"use client";

import FullscreenButton from "@/components/Reader/FullScreenButton";
import ReaderNavigation from "@/components/Reader/ReaderNavigation";
import { useReaderProgress } from "@/components/Reader/useReaderProgress";

import { ArrowLeft, CloudRainWind, Summary } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPdfPage } from "./readerUtils";
import type { ReaderProgress } from "./readerTypes";

const PdfReader = dynamic(() => import("@/components/Reader/PdfReader"), {
  ssr: false,
});

type ReaderType = "pdf" | "disabled";

type FileFormat = "EPUB" | "PDF" | "CBZ" | "CBR";

export type PageInfo = {
  currentPage: number;
  totalPages: number;
  progress: number;
  isTwoPages: boolean;
  chapterTitle: string;
};

const readerConfig: Record<FileFormat, ReaderType> = {
  PDF: "pdf",
  EPUB: "disabled",
  CBZ: "disabled",
  CBR: "disabled",
};

export default function Reader({
  bookId,
  bookUrl,
  format,
  locator,
}: {
  bookId: number;
  bookUrl: string;
  format: FileFormat;
  locator?: string | null;
}) {
  const readerType = readerConfig[format];
  const initialPage = getPdfPage(locator);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [readerProgress, setReaderProgress] = useState<ReaderProgress | null>(
    null,
  );

  useReaderProgress({
    bookId,
    progress: readerProgress,
    delay: 800,
  });

  useEffect(() => {
    const updateIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    updateIsMobile();

    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  const [pageInfo, setPageInfo] = useState<PageInfo>({
    currentPage: initialPage,
    totalPages: 0,
    progress: 0,
    isTwoPages: true,
    chapterTitle: "Carregando...",
  });
  const canNavigate = readerType === "pdf" && pageInfo.totalPages > 0;

  const goToPreviousPage = () => {
    setPageInfo((previous) => ({
      ...previous,
      currentPage: Math.max(previous.currentPage - 1, 1),
    }));
  };

  const goToNextPage = () => {
    setPageInfo((previous) => ({
      ...previous,
      currentPage: Math.min(
        previous.currentPage + 1,
        previous.totalPages || previous.currentPage,
      ),
    }));
  };

  function renderReader() {
    if (readerType === "pdf") {
      return (
        <PdfReader
          file={bookUrl}
          pageNumber={pageInfo.currentPage}
          onPageChange={setPageInfo}
          onProgressChange={setReaderProgress}
        />
      );
    }

    return (
      <div className="flex h-full items-center justify-center">
        <p>Este formato está temporariamente indisponível.</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col">
      {/* Header */}
      <header className="grid h-20 shrink-0 grid-cols-3 items-center px-5">
        <div className="flex items-center gap-3 justify-self-start">
          <Link href="/library">
            <ArrowLeft />
          </Link>
          <Link href="/">
            <CloudRainWind className="justify-self-start" />
          </Link>
        </div>

        <h1 className="max-w-xs truncate justify-self-center">
          {pageInfo.chapterTitle}
        </h1>

        <div className="flex items-center gap-3 justify-self-end">
          <p>Aa</p>

          <Summary />

          <FullscreenButton />
        </div>
      </header>

      {/* Leitor */}
      <main className="relative min-h-0 flex-1">
        <ReaderNavigation
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
          previousDisabled={!canNavigate || pageInfo.currentPage <= 1}
          nextDisabled={
            !canNavigate || pageInfo.currentPage >= pageInfo.totalPages
          }
        >
          {renderReader()}
        </ReaderNavigation>
      </main>

      {/* Footer */}
      <footer className="flex h-12 shrink-0 items-center justify-center">
        {pageInfo.currentPage}

        {pageInfo.isTwoPages &&
          pageInfo.currentPage < pageInfo.totalPages &&
          `-${pageInfo.currentPage + 1}`}

        {" de "}
        {pageInfo.totalPages}

        {" ("}
        {pageInfo.progress}
        {"%)"}
      </footer>
    </div>
  );
}
