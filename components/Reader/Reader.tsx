"use client";

import BookmarksPanel from "@/components/Reader/BookmarksPanel";
import FullscreenButton from "@/components/Reader/FullScreenButton";
import HeaderActionWindow from "@/components/Reader/HeaderActionWindow";
import ReaderNavigation from "@/components/Reader/ReaderNavigation";
import { useReaderProgress } from "@/components/Reader/useReaderProgress";
import {
  READER_THEMES,
  useReaderSettings,
} from "@/components/Reader/useReaderSettings";

import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  CloudRainWind,
  Expand,
  ListOrdered,
  Minimize,
  Minus,
  Plus,
  Settings,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import {
  createBookmark,
  deleteBookmark,
  moveBookmark,
} from "@/app/read/actions";
import type {
  Bookmark,
  Chapter,
  PageInfo,
  ReaderController,
  ReaderEngineProps,
  ReaderProgress,
  TurnDirection,
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

/* Animação ao virar a página: deslocamento (px), duração e validade (ms). */
const TURN_OFFSET = 48;
const TURN_DURATION = 280;
const TURN_TIMEOUT = 1500;

/* Formatos navegados por página (com seletor de página). */
const PAGED_FORMATS: FileFormat[] = ["PDF", "CBZ"];

const initialPageInfo: PageInfo = {
  currentPage: 1,
  totalPages: 0,
  progress: 0,
  atStart: true,
  atEnd: false,
  chapterTitle: "",
};

export default function Reader({
  bookId,
  bookUrl,
  title,
  format,
  locator,
  savedProgress,
  bookmarks: initialBookmarks,
}: {
  bookId: number;
  bookUrl: string;
  title: string;
  format: FileFormat;
  locator?: string | null;
  /* Marcador padrão: progresso salvo no banco. */
  savedProgress: ReaderProgress | null;
  bookmarks: Bookmark[];
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
  /*
   * Celular: esconde cabeçalho, rodapé e setas para o conteúdo ocupar
   * a tela toda (no lugar da tela cheia do navegador, que o Safari do
   * iPhone não oferece). As páginas viram arrastando para o lado.
   */
  const [isImmersive, setIsImmersive] = useState(false);

  const { theme, zoom, limits, setTheme, setZoom } = useReaderSettings(format);
  const canZoom = Boolean(Engine) && limits.max > limits.min;
  const zoomPercent = Math.round(zoom * 100);

  const zoomIn = useCallback(() => setZoom(zoom + limits.step), [setZoom, zoom, limits.step]);
  const zoomOut = useCallback(() => setZoom(zoom - limits.step), [setZoom, zoom, limits.step]);
  const resetZoom = useCallback(() => setZoom(1), [setZoom]);

  const { saved, forceSave } = useReaderProgress({
    bookId,
    progress: readerProgress,
    initialSaved: savedProgress,
    delay: 800,
  });

  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);

  const handleReady = useCallback((controller: ReaderController) => {
    controllerRef.current = controller;
    setIsReady(true);
  }, []);

  const { currentPage, totalPages } = pageInfo;
  const canNavigate = isReady && totalPages > 0;

  /*
   * Animação ao virar a página: o pedido fica guardado e a animação só
   * roda quando o motor avisa a nova posição (onPageChange), para não
   * animar a página antiga antes da troca. Pedidos que não mudam nada
   * (fim do livro) expiram.
   */
  const pageRef = useRef<HTMLDivElement>(null);
  const pendingTurnRef = useRef<{ direction: TurnDirection; time: number } | null>(
    null,
  );

  /* Início/fim atuais para barrar viradas (teclado, setas, arraste). */
  const pageInfoRef = useRef(pageInfo);

  useEffect(() => {
    pageInfoRef.current = pageInfo;
  });

  const turnPage = useCallback((direction: TurnDirection) => {
    const { atStart, atEnd } = pageInfoRef.current;

    if (direction === "next" ? atEnd : atStart) return;

    pendingTurnRef.current = { direction, time: Date.now() };

    if (direction === "next") controllerRef.current?.next();
    else controllerRef.current?.previous();
  }, []);

  useEffect(() => {
    const pending = pendingTurnRef.current;
    const element = pageRef.current;

    pendingTurnRef.current = null;

    if (!pending || !element || Date.now() - pending.time > TURN_TIMEOUT) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const offset = pending.direction === "next" ? TURN_OFFSET : -TURN_OFFSET;

    element.animate(
      [
        { opacity: 0.2, transform: `translateX(${offset}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: TURN_DURATION, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [pageInfo]);

  const goToPrevious = useCallback(() => turnPage("previous"), [turnPage]);
  const goToNext = useCallback(() => turnPage("next"), [turnPage]);

  function goToPage(page: number) {
    pendingTurnRef.current = null;
    controllerRef.current?.goToPage?.(page);
    setIsNavigatorOpen(false);
  }

  function goToChapter(href: string) {
    pendingTurnRef.current = null;
    controllerRef.current?.goToChapter?.(href);
    setIsNavigatorOpen(false);
  }

  /* Marcadores: ir até um, "Salvar aqui" e os personalizados. */
  function goToLocator(target: string) {
    pendingTurnRef.current = null;
    controllerRef.current?.goToLocator(target);
    setIsBookmarksOpen(false);
  }

  async function saveHere() {
    if (readerProgress) await forceSave(readerProgress);
  }

  async function addBookmark(name: string) {
    if (!readerProgress) return;

    const bookmark = await createBookmark(bookId, name, readerProgress);

    setBookmarks((current) => [...current, bookmark]);
  }

  async function moveBookmarkHere(bookmarkId: number) {
    if (!readerProgress) return;

    const bookmark = await moveBookmark(bookId, bookmarkId, readerProgress);

    setBookmarks((current) =>
      current.map((item) => (item.id === bookmark.id ? bookmark : item)),
    );
  }

  async function removeBookmark(bookmarkId: number) {
    await deleteBookmark(bookId, bookmarkId);

    setBookmarks((current) => current.filter((item) => item.id !== bookmarkId));
  }

  /* Nome sugerido para um marcador novo. */
  const suggestedBookmarkName = isPaged
    ? `Página ${pageInfo.currentPage}`
    : pageInfo.chapterTitle || `Página ${pageInfo.currentPage}`;

  /*
   * Teclado (exceto quando há um campo em foco):
   * ← → viram páginas; + − mudam o zoom; 0 volta ao 100%.
   * No EPUB, o motor repassa para cá as teclas de dentro do iframe.
   */
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

      if (event.key === "Escape") setIsImmersive(false);

      if (canNavigate && event.key === "ArrowLeft") goToPrevious();
      if (canNavigate && event.key === "ArrowRight") goToNext();

      if (canZoom && (event.key === "+" || event.key === "=")) zoomIn();
      if (canZoom && (event.key === "-" || event.key === "_")) zoomOut();
      if (canZoom && event.key === "0") resetZoom();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNavigate, canZoom, goToPrevious, goToNext, zoomIn, zoomOut, resetZoom]);

  /* No EPUB o cabeçalho mostra o capítulo; nos demais, o título do livro. */
  const headerTitle = pageInfo.chapterTitle || title;

  const hasNavigator = isPaged ? totalPages > 0 : chapters.length > 0;

  function renderNavigator() {
    if (!isPaged) {
      return (
        <div className="max-h-80 overflow-y-auto pr-1">
          <p className="px-2 pb-2 text-[11px] uppercase tracking-widest text-contrast/50">Sumário</p>

          <div className="flex flex-col gap-0.5">
            {chapters.map((chapter, index) => {
              const isCurrent = pageInfo.chapterHref
                ? chapter.href === pageInfo.chapterHref
                : chapter.title === pageInfo.chapterTitle;

              return (
                <button
                  key={`${chapter.href}-${index}`}
                  type="button"
                  onClick={() => goToChapter(chapter.href)}
                  aria-current={isCurrent ? "true" : undefined}
                  /* Subitens (capítulos dentro de partes) indentados. */
                  style={{ paddingLeft: `${0.75 + Math.min(chapter.level, 3) * 1}rem` }}
                  className={[
                    "w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors",
                    isCurrent
                      ? "bg-contrast text-primary"
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
          <label htmlFor="reader-go-to-page" className="text-[11px] uppercase tracking-widest text-contrast/50">
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
            className="w-20 border border-contrast/15 bg-darkest px-2 py-1 text-sm text-contrast outline-none focus:border-interaction"
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
                    "flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                    page === currentPage
                      ? "bg-contrast text-primary"
                      : "text-contrast/75 hover:bg-contrast/10 hover:text-contrast",
                  ].join(" ")}
                >
                  <span>Página {page}</span>
                  {page === currentPage && (
                    <span className="text-[11px] uppercase tracking-widest text-primary/60">atual</span>
                  )}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderSettings() {
    const zoomButtonClass =
      "flex size-8 cursor-pointer items-center justify-center text-contrast/70 transition-colors hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-30";

    return (
      <div className="space-y-3 p-1">
        <p className="px-2 text-[11px] uppercase tracking-widest text-contrast/50">
          Configurações
        </p>

        {canZoom && (
          <div className="space-y-1.5 px-2">
            <p className="text-sm text-contrast/75">{limits.label}</p>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= limits.min}
                aria-label={`Diminuir ${limits.label.toLowerCase()}`}
                title="Diminuir (−)"
                className={zoomButtonClass}
              >
                <Minus size={16} />
              </button>

              <button
                type="button"
                onClick={resetZoom}
                disabled={zoom === 1}
                title="Voltar ao padrão (0)"
                aria-label={`${limits.label}: ${zoomPercent}%. Voltar ao padrão`}
                className="min-w-16 cursor-pointer px-2 py-1 text-center text-sm tabular-nums text-contrast transition-colors hover:bg-contrast/10 disabled:cursor-default disabled:hover:bg-transparent"
              >
                <span aria-live="polite">{zoomPercent}%</span>
              </button>

              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= limits.max}
                aria-label={`Aumentar ${limits.label.toLowerCase()}`}
                title="Aumentar (+)"
                className={zoomButtonClass}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        <fieldset className="space-y-1.5 px-2">
          <legend className="pb-1.5 text-sm text-contrast/75">Tema</legend>

          <div className="grid grid-cols-3 gap-1">
            {READER_THEMES.map((option) => {
              const isCurrent = option.value === theme;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={isCurrent}
                  className={[
                    "flex cursor-pointer flex-col items-center gap-1 px-1 py-2 text-xs transition-colors",
                    isCurrent
                      ? "bg-contrast text-primary"
                      : "text-contrast/75 hover:bg-contrast/10 hover:text-contrast",
                  ].join(" ")}
                >
                  <span
                    aria-hidden="true"
                    data-reader-theme={option.value}
                    className="reader-theme-swatch size-5 border border-current/30"
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
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
        {/* EPUB: "página" é uma posição de ~1024 caracteres (estável com o zoom). */}
        <div className="flex items-baseline justify-center gap-2 tabular-nums">
          <span className="font-display text-base font-bold uppercase tracking-wide text-contrast/85">
            Página {currentPage}{" "}
            <span className="text-contrast/40">de</span> {totalPages}
          </span>
          <span className="text-xs text-contrast/40">
            {pageInfo.progress}%
          </span>
        </div>

        <div
          aria-hidden="true"
          className="mx-auto h-0.5 w-full max-w-md overflow-hidden bg-contrast/10"
        >
          <div
            className="h-full bg-danger transition-[width] duration-300"
            style={{ width: `${pageInfo.progress}%` }}
          />
        </div>
      </>
    );
  }

  return (
    <div
      data-reader-theme={theme}
      className="reader-shell relative flex w-full flex-col bg-darkest font-sans text-contrast transition-colors"
    >
      <header
        className={[
          "reader-header relative flex shrink-0 items-center justify-between border-b border-contrast/10 px-3 sm:px-5",
          isImmersive ? "max-sm:hidden" : "",
        ].join(" ")}
      >
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/library"
            aria-label="Voltar para a biblioteca"
            title="Voltar para a biblioteca"
            className="p-2 text-contrast/80 transition-colors hover:bg-contrast/10 hover:text-contrast"
          >
            <ArrowLeft size={20} />
          </Link>
          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            title="Página inicial"
            className="hidden p-2 text-contrast/60 transition-colors hover:bg-contrast/10 hover:text-danger sm:block"
          >
            <CloudRainWind size={20} />
          </Link>
        </div>

        {/*
          * Celular: o título ocupa o espaço entre os botões (não cabe
          * centralizado na tela sem cobrir os ícones). A partir de sm,
          * fica centralizado de verdade.
          */}
        <h1 className="title-shelf min-w-0 flex-1 truncate px-2 text-center text-lg text-contrast/85 sm:pointer-events-none sm:absolute sm:left-1/2 sm:top-1/2 sm:max-w-[45%] sm:flex-none sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-0 sm:text-2xl">
          {headerTitle}
        </h1>

        <div className="flex shrink-0 items-center sm:gap-2">
          <HeaderActionWindow
            isOpen={isNavigatorOpen}
            onOpenChange={setIsNavigatorOpen}
            label={isPaged ? "Selecionar página" : "Sumário"}
            disabled={!hasNavigator}
            icon={<ListOrdered size={18} strokeWidth={2} />}
            buttonClassName="cursor-pointer"
            panelClassName={isPaged ? "sm:w-64" : "sm:w-80"}
          >
            {renderNavigator()}
          </HeaderActionWindow>

          <HeaderActionWindow
            isOpen={isBookmarksOpen}
            onOpenChange={setIsBookmarksOpen}
            label="Marcadores"
            disabled={!canNavigate}
            icon={<BookmarkIcon size={18} strokeWidth={2} />}
            buttonClassName="cursor-pointer"
            panelClassName="sm:w-80"
          >
            <BookmarksPanel
              current={readerProgress}
              suggestedName={suggestedBookmarkName}
              saved={saved}
              bookmarks={bookmarks}
              onGo={goToLocator}
              onSaveHere={saveHere}
              onCreate={addBookmark}
              onMove={moveBookmarkHere}
              onDelete={removeBookmark}
            />
          </HeaderActionWindow>

          <HeaderActionWindow
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            label="Configurações"
            icon={<Settings size={18} strokeWidth={2} />}
            buttonClassName="cursor-pointer"
            panelClassName="sm:w-60"
          >
            {renderSettings()}
          </HeaderActionWindow>

          {/* Celular: modo imersivo. A partir de sm: tela cheia do navegador. */}
          <button
            type="button"
            onClick={() => setIsImmersive(true)}
            aria-label="Tela cheia"
            title="Tela cheia"
            className="flex h-10 w-10 cursor-pointer items-center justify-center text-contrast/80 transition-colors hover:bg-contrast/10 hover:text-contrast sm:hidden"
          >
            <Expand size={20} strokeWidth={1.8} />
          </button>

          <FullscreenButton className="max-sm:hidden" />
        </div>
      </header>

      <main
        className={[
          "relative min-h-0 flex-1",
          isImmersive ? "reader-immersive" : "",
        ].join(" ")}
      >
        {isImmersive && (
          <button
            type="button"
            onClick={() => setIsImmersive(false)}
            aria-label="Sair da tela cheia"
            title="Sair da tela cheia"
            className="reader-immersive-exit absolute right-2 z-20 flex size-9 cursor-pointer items-center justify-center bg-darkest/60 text-contrast/60 backdrop-blur-sm transition-colors hover:text-contrast sm:hidden"
          >
            <Minimize size={18} strokeWidth={1.8} />
          </button>
        )}

        {Engine ? (
          <ReaderNavigation
            hideArrowsOnMobile={isImmersive}
            onPrevious={goToPrevious}
            onNext={goToNext}
            previousDisabled={!canNavigate || pageInfo.atStart}
            nextDisabled={!canNavigate || pageInfo.atEnd}
          >
            <div ref={pageRef} className="h-full w-full">
              <Engine
                bookId={bookId}
                bookUrl={bookUrl}
                locator={locator}
                onReady={handleReady}
                onPageChange={setPageInfo}
                onProgressChange={setReaderProgress}
                onContentsChange={setChapters}
                onTurnPage={turnPage}
                zoom={zoom}
                theme={theme}
              />
            </div>
          </ReaderNavigation>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="title-shelf text-3xl">
              Arquivos {format} não podem ser lidos aqui.
            </p>

            <p className="max-w-md text-sm text-contrast/50">
              Converta o arquivo para CBZ (por exemplo, com o Calibre) e envie
              de novo na página do livro.
            </p>

            <Link
              href={`/library/${bookId}`}
              className="mt-3 text-sm text-danger underline-offset-4 hover:underline"
            >
              Abrir página do livro
            </Link>
          </div>
        )}
      </main>

      <footer
        className={[
          "reader-footer flex shrink-0 flex-col justify-center gap-1.5 border-t border-contrast/10 px-4",
          isImmersive ? "max-sm:hidden" : "",
        ].join(" ")}
      >
        {renderFooter()}
      </footer>
    </div>
  );
}
