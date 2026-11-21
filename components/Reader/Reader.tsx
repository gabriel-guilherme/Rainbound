"use client";

import FullscreenButton from "@/components/Reader/FullScreenButton";
import HeaderActionWindow from "@/components/Reader/HeaderActionWindow";
import ReaderNavigation from "@/components/Reader/ReaderNavigation";
import { useReaderProgress } from "@/components/Reader/useReaderProgress";

import { ArrowLeft, CloudRainWind, ListOrdered, Settings } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import type {
  Chapter,
  PageInfo,
  ReaderController,
  ReaderEngineProps,
  ReaderProgress,
} from "./readerTypes";
import type { FileFormat } from "@/generated/prisma/enums";

/*
 * Motores de leitura (decisão registrada no CLAUDE.md):
 * - PDF: react-pdf
 * - EPUB: @likecoin/epub-ts
 * - CBZ: leitor próprio de imagens (fflate)
 * - CBR: não suportado (converter para CBZ)
 */
const engines: Partial<Record<FileFormat, ComponentType<ReaderEngineProps>>> = {
  PDF: dynamic(() => import("@/components/Reader/PdfReader"), { ssr: false }),
  EPUB: dynamic(() => import("@/components/Reader/EpubReader"), { ssr: false }),
  CBZ: dynamic(() => import("@/components/Reader/ComicReader"), { ssr: false }),
};

/* Formatos navegados por página (com seletor de página). */
const PAGED_FORMATS: FileFormat[] = ["PDF", "CBZ"];

const initialPageInfo: PageInfo = {
  currentPage: 1,
  totalPages: 0,
  progress: 0,
  isTwoPages: false,
  chapterTitle: "",
};

export default function Reader({
  bookId,
  bookUrl,
  title,
  format,
  locator,
}: {
  bookId: number;
  bookUrl: string;
  title: string;
  format: FileFormat;
  locator?: string | null;
}) {
  const Engine = engines[format];
  const isPaged = PAGED_FORMATS.includes(format);

  const controllerRef = useRef<ReaderController | null>(null);

  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [readerProgress, setReaderProgress] = useState<ReaderProgress | null>(
    null,
  );
  const [isReady, setIsReady] = useState(false);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pageInput, setPageInput] = useState("");

  useReaderProgress({
    bookId,
    progress: readerProgress,
    delay: 800,
  });

  const handleReady = useCallback((controller: ReaderController) => {
    controllerRef.current = controller;
    setIsReady(true);
  }, []);

  const { currentPage, totalPages } = pageInfo;
  const canNavigate = isReady && totalPages > 0;

  const goToPrevious = useCallback(() => controllerRef.current?.previous(), []);
  const goToNext = useCallback(() => controllerRef.current?.next(), []);

  function goToPage(page: number) {
    controllerRef.current?.goToPage?.(page);
    setIsNavigatorOpen(false);
  }

  function goToChapter(href: string) {
    controllerRef.current?.goToChapter?.(href);
    setIsNavigatorOpen(false);
  }

  /*
   * Setas do teclado viram páginas (exceto quando há um campo em foco).
   * No EPUB, o próprio motor trata as setas dentro do iframe do livro.
   */
  useEffect(() => {
    if (!canNavigate) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowLeft") goToPrevious();
      if (event.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNavigate, goToPrevious, goToNext]);

  /* No EPUB o cabeçalho mostra o capítulo; nos demais, o título do livro. */
  const headerTitle = pageInfo.chapterTitle || title;

  const hasNavigator = isPaged ? totalPages > 0 : chapters.length > 0;

  function renderNavigator() {
    if (!isPaged) {
      return (
        <div className="max-h-80 overflow-y-auto pr-1">
          <p className="px-2 pb-2 text-xs text-contrast/50">Sumário</p>

          <div className="flex flex-col gap-0.5">
            {chapters.map((chapter, index) => {
              const isCurrent = chapter.title === pageInfo.chapterTitle;

              return (
                <button
                  key={`${chapter.href}-${index}`}
                  type="button"
                  onClick={() => goToChapter(chapter.href)}
                  aria-current={isCurrent ? "true" : undefined}
                  className={[
                    "w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isCurrent
                      ? "bg-interaction-contrast text-contrast"
                      : "text-contrast/75 hover:bg-contrast/10 hover:text-contrast",
                  ].join(" ")}
                >
                  {chapter.title}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();

            const page = Number(pageInput);

            if (Number.isInteger(page) && page >= 1 && page <= totalPages) {
              goToPage(page);
              setPageInput("");
            }
          }}
          className="flex items-center gap-2 px-1 pt-1"
        >
          <label htmlFor="reader-go-to-page" className="text-xs text-contrast/50">
            Ir para
          </label>

          <input
            id="reader-go-to-page"
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            placeholder={String(currentPage)}
            className="w-20 rounded-md border border-contrast/15 bg-contrast/[0.07] px-2 py-1 text-sm text-contrast outline-none focus:border-interaction"
          />

          <span className="text-xs text-contrast/40">de {totalPages}</span>
        </form>

        <div className="max-h-72 overflow-y-auto pr-1">
          <div className="flex flex-col gap-0.5">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={page === currentPage ? "page" : undefined}
                  className={[
                    "flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    page === currentPage
                      ? "bg-interaction-contrast text-contrast"
                      : "text-contrast/75 hover:bg-contrast/10 hover:text-contrast",
                  ].join(" ")}
                >
                  <span>Página {page}</span>
                  {page === currentPage && (
                    <span className="text-xs text-interaction">atual</span>
                  )}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderFooter() {
    if (!Engine) {
      return null;
    }

    if (totalPages === 0) {
      return (
        <span className="text-center text-xs text-contrast/40">
          Carregando...
        </span>
      );
    }

    return (
      <>
        <div className="flex items-center justify-center gap-2 text-xs text-contrast/60 sm:text-sm">
          {isPaged ? (
            <>
              <span>
                Página {currentPage} de {totalPages}
              </span>
              <span className="text-contrast/35">{pageInfo.progress}%</span>
            </>
          ) : (
            <span>{pageInfo.progress}% lido</span>
          )}
        </div>

        <div
          aria-hidden="true"
          className="mx-auto h-0.5 w-full max-w-md overflow-hidden rounded-full bg-contrast/10"
        >
          <div
            className="h-full rounded-full bg-interaction transition-[width] duration-300"
            style={{ width: `${pageInfo.progress}%` }}
          />
        </div>
      </>
    );
  }

  return (
    <div className="reader-shell relative flex w-full flex-col bg-darkest font-sans text-contrast">
      <header className="reader-header relative flex shrink-0 items-center justify-between border-b border-contrast/10 px-3 sm:px-5">
        <div className="flex items-center gap-3">
          <Link
            href="/library"
            aria-label="Voltar para a biblioteca"
            title="Voltar para a biblioteca"
            className="rounded-full p-2 text-contrast/80 transition-colors hover:bg-contrast/10 hover:text-contrast"
          >
            <ArrowLeft size={20} />
          </Link>
          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            title="Página inicial"
            className="hidden rounded-full p-2 text-interaction transition-colors hover:bg-contrast/10 sm:block"
          >
            <CloudRainWind size={20} />
          </Link>
        </div>

        <h1 className="pointer-events-none absolute left-1/2 top-1/2 max-w-[45%] -translate-x-1/2 -translate-y-1/2 truncate text-center font-display text-base text-contrast/80 sm:text-lg">
          {headerTitle}
        </h1>

        <div className="flex items-center gap-2">
          <HeaderActionWindow
            isOpen={isNavigatorOpen}
            onOpenChange={setIsNavigatorOpen}
            label={isPaged ? "Selecionar página" : "Sumário"}
            disabled={!hasNavigator}
            icon={<ListOrdered size={18} strokeWidth={2} />}
            buttonClassName="cursor-pointer"
            panelClassName={isPaged ? "w-64" : "w-80"}
          >
            {renderNavigator()}
          </HeaderActionWindow>

          <HeaderActionWindow
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            label="Configurações"
            icon={<Settings size={18} strokeWidth={2} />}
            buttonClassName="cursor-pointer"
            panelClassName="w-56"
          >
            <div className="space-y-2 p-1">
              <p className="px-2 pb-1 text-xs text-contrast/50">
                Configurações
              </p>
              <button
                type="button"
                disabled
                title="Em breve"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-contrast/40"
              >
                Ajustar zoom
                <span className="text-xs">em breve</span>
              </button>
              <button
                type="button"
                disabled
                title="Em breve"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-contrast/40"
              >
                Tema
                <span className="text-xs">em breve</span>
              </button>
            </div>
          </HeaderActionWindow>

          <FullscreenButton />
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        {Engine ? (
          <ReaderNavigation
            onPrevious={goToPrevious}
            onNext={goToNext}
            previousDisabled={!canNavigate || (isPaged && currentPage <= 1)}
            nextDisabled={
              !canNavigate || (isPaged && currentPage >= totalPages)
            }
          >
            <Engine
              bookId={bookId}
              bookUrl={bookUrl}
              locator={locator}
              onReady={handleReady}
              onPageChange={setPageInfo}
              onProgressChange={setReaderProgress}
              onContentsChange={setChapters}
            />
          </ReaderNavigation>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="font-display text-xl">
              Arquivos {format} não podem ser lidos aqui.
            </p>

            <p className="max-w-md text-sm text-contrast/50">
              Converta o arquivo para CBZ (por exemplo, com o Calibre) e envie
              de novo na página do livro.
            </p>

            <Link
              href={`/library/${bookId}`}
              className="mt-3 text-sm text-interaction underline-offset-4 hover:underline"
            >
              Abrir página do livro
            </Link>
          </div>
        )}
      </main>

      <footer className="reader-footer flex shrink-0 flex-col justify-center gap-1.5 border-t border-contrast/10 px-4">
        {renderFooter()}
      </footer>
    </div>
  );
}
