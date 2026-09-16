"use client";

import ChaptersSummary from "@/components/ChaptersSummary";
import EpubReader from "@/components/Reader/EpubReader";
import PdfReader from "@/components/Reader/PdfReader";
import ComicReader from "@/components/Reader/ComicReader";
import FullscreenButton from "@/components/FullScreenButton";

import { CloudRainWind, Summary } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ReaderType = "epub" | "pdf" | "comic";

type FileFormat = "EPUB" | "PDF" | "CBZ" | "CBR";

type Chapter = {
  title: string;
  href: string;
};

type PageInfo = {
  currentPage: number;
  totalPages: number;
  progress: number;
  isTwoPages: boolean;
  chapterTitle: string;
};

function getReaderType(format: FileFormat): ReaderType {
  switch (format) {
    case "EPUB":
      return "epub";

    case "PDF":
      return "pdf";

    case "CBZ":
    case "CBR":
      return "comic";

    default:
      throw new Error(`Formato de arquivo não suportado: ${format}`);
  }
}

export default function Reader({
  bookId,
  bookUrl,
  format,
  initialCfi,
}: {
  bookId: number;
  bookUrl: string;
  format: FileFormat;
  initialCfi?: string | null;
}) {
  const [showContents, setShowContents] = useState(false);

  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [chapterHref, setChapterHref] = useState<string | null>(null);

  const [pageInfo, setPageInfo] = useState<PageInfo>({
    currentPage: 1,
    totalPages: 0,
    progress: 0,
    isTwoPages: true,
    chapterTitle: "Carregando...",
  });

  const readerType = getReaderType(format);

  function handleChapterSelect(href: string) {
    setChapterHref(href);
    setShowContents(false);
  }

  function renderReader() {
    switch (readerType) {
      case "epub":
        return (
          <EpubReader
            bookId={bookId}
            bookUrl={bookUrl}
            initialCfi={initialCfi}
            chapterHref={chapterHref}
            onPageChange={setPageInfo}
            onContentsChange={setChapters}
          />
        );

      /*case "pdf":
        return (
          <PdfReader
            bookId={bookId}
            bookUrl={bookUrl}
            onPageChange={setPageInfo}
          />
        );

      case "comic":
        return (
          <ComicReader
            bookId={bookId}
            bookUrl={bookUrl}
            onPageChange={setPageInfo}
          />
        );*/
    }
  }

  const supportsContents = readerType === "epub";

  return (
    <>
      {/* Header */}
      <header className="grid h-20 shrink-0 grid-cols-3 items-center px-5">
        <Link href="/">
          <CloudRainWind className="justify-self-start" />
        </Link>

        <h1 className="max-w-xs truncate justify-self-center">
          {pageInfo.chapterTitle}
        </h1>

        <div className="flex items-center gap-3 justify-self-end">
          <p>Aa</p>

          {supportsContents && (
            <button
              type="button"
              onClick={() => setShowContents((prev) => !prev)}
              className="cursor-pointer"
              aria-label="Abrir sumário"
            >
              <Summary />
            </button>
          )}

          <FullscreenButton />
        </div>
      </header>

      {/* Sumário */}
      {showContents && supportsContents && (
        <ChaptersSummary
          setShowContents={setShowContents}
          chapters={chapters}
          handleChapterSelect={handleChapterSelect}
        />
      )}

      {/* Leitor */}
      <main className="relative min-h-0 flex-1">{renderReader()}</main>

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
    </>
  );
}
