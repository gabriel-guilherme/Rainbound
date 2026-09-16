"use client";

import ChaptersSummary from "@/components/ChaptersSummary";
import EpubReader from "@/components/EpubReader";
import FullscreenButton from "@/components/FullScreenButton";
import { CloudRainWind, Summary } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Chapter = {
  title: string;
  href: string;
};

export default function Reader({
  bookId,
  bookUrl,
  initialCfi,
}: {
  bookId: number;
  bookUrl: string;
  initialCfi?: string | null;
}) {
  const [showContents, setShowContents] = useState(false);

  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [chapterHref, setChapterHref] = useState<string | null>(null);

  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 0,
    progress: 0,
    isTwoPages: true,
    chapterTitle: "Carregando...",
  });

  function handleChapterSelect(href: string) {
    setChapterHref(href);
    setShowContents(false);
  }

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

          <button
            type="button"
            onClick={() => setShowContents((prev) => !prev)}
            className="cursor-pointer"
            aria-label="Abrir sumário"
          >
            <Summary />
          </button>

          <FullscreenButton />
        </div>
      </header>

      {/* Sumário */}
      {showContents && (
        <ChaptersSummary
          setShowContents={setShowContents}
          chapters={chapters}
          handleChapterSelect={handleChapterSelect}
        />
      )}

      {/* Leitor */}
      <main className="relative min-h-0 flex-1">
        <EpubReader
          bookId={bookId}
          bookUrl={bookUrl}
          initialCfi={initialCfi}
          chapterHref={chapterHref}
          onPageChange={setPageInfo}
          onContentsChange={setChapters}
        />
      </main>

      {/* Footer */}
      <footer className="flex h-12 shrink-0 items-center justify-center">
        {pageInfo.currentPage}
        {pageInfo.isTwoPages && `-${pageInfo.currentPage + 1}`} de{" "}
        {pageInfo.totalPages} ({pageInfo.progress}%)
      </footer>
    </>
  );
}
