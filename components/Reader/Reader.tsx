"use client";

import BookmarksPanel from "@/components/Reader/BookmarksPanel";
import FullscreenButton from "@/components/Reader/FullScreenButton";
import HeaderActionWindow from "@/components/Reader/HeaderActionWindow";
import NavigatorPanel from "@/components/Reader/NavigatorPanel";
import ReaderFooter from "@/components/Reader/ReaderFooter";
import ReaderNavigation from "@/components/Reader/ReaderNavigation";
import SettingsPanel from "@/components/Reader/SettingsPanel";
import { useBookmarks } from "@/components/Reader/useBookmarks";
import { usePageTurn } from "@/components/Reader/usePageTurn";
import { useReaderKeyboard } from "@/components/Reader/useReaderKeyboard";
import { useReaderProgress } from "@/components/Reader/useReaderProgress";
import { useReaderSettings } from "@/components/Reader/useReaderSettings";
import SessionFinishedNotice from "@/components/ReadingSession/SessionFinishedNotice";

import {
  ArrowLeft,
  Bookmark as BookmarkIcon,
  CloudRainWind,
  Expand,
  ListOrdered,
  Minimize,
  Settings,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useRef, useState, type ComponentType } from "react";
import type {
  Bookmark,
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
  atStart: true,
  atEnd: false,
  chapterTitle: "",
};

/*
 * Leitor em tela cheia: junta o motor do formato, o cabeçalho (navegação,
 * marcadores, configurações, tela cheia), as setas, o teclado e o rodapé.
 * Tudo o que vai para o motor (`handleReady`, `turnPage` e os setters)
 * não muda entre renderizações: o motor recarregaria o livro.
 */
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
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  /*
   * Celular: esconde cabeçalho, rodapé e setas para o conteúdo ocupar
   * a tela toda (no lugar da tela cheia do navegador, que o Safari do
   * iPhone não oferece). As páginas viram arrastando para o lado.
   */
  const [isImmersive, setIsImmersive] = useState(false);

  const settings = useReaderSettings(format);
  const { theme, zoom, limits, setZoom } = settings;
  const canZoom = Boolean(Engine) && limits.max > limits.min;

  const zoomIn = useCallback(() => setZoom(zoom + limits.step), [setZoom, zoom, limits.step]);
  const zoomOut = useCallback(() => setZoom(zoom - limits.step), [setZoom, zoom, limits.step]);
  const resetZoom = useCallback(() => setZoom(1), [setZoom]);

  const { saved, forceSave } = useReaderProgress({
    bookId,
    progress: readerProgress,
    initialSaved: savedProgress,
    delay: 800,
  });

  const { bookmarks, addBookmark, renameBookmark, removeBookmark } =
    useBookmarks(bookId, initialBookmarks, readerProgress);

  const handleReady = useCallback((controller: ReaderController) => {
    controllerRef.current = controller;
    setIsReady(true);
  }, []);

  const { currentPage, totalPages } = pageInfo;
  const canNavigate = isReady && totalPages > 0;

  const { pageRef, turnPage, goToPrevious, goToNext, cancelTurn } = usePageTurn(
    controllerRef,
    pageInfo,
  );

  const exitImmersive = useCallback(() => setIsImmersive(false), []);

  useReaderKeyboard({
    canNavigate,
    canZoom,
    onPrevious: goToPrevious,
    onNext: goToNext,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onResetZoom: resetZoom,
    onEscape: exitImmersive,
  });

  /* Saltos pelo seletor de página, sumário ou marcadores (sem animação). */
  function goToPage(page: number) {
    cancelTurn();
    controllerRef.current?.goToPage?.(page);
    setIsNavigatorOpen(false);
  }

  function goToChapter(href: string) {
    cancelTurn();
    controllerRef.current?.goToChapter?.(href);
    setIsNavigatorOpen(false);
  }

  function goToLocator(target: string) {
    cancelTurn();
    controllerRef.current?.goToLocator(target);
    setIsBookmarksOpen(false);
  }

  /* "Salvar aqui": grava a posição atual mesmo que seja anterior à salva. */
  async function saveHere() {
    if (readerProgress) await forceSave(readerProgress);
  }

  /* Nome sugerido para um marcador novo. */
  const suggestedBookmarkName = isPaged
    ? `Página ${currentPage}`
    : pageInfo.chapterTitle || `Página ${currentPage}`;

  /* No EPUB o cabeçalho mostra o capítulo; nos demais, o título do livro. */
  const headerTitle = pageInfo.chapterTitle || title;

  const hasNavigator = isPaged ? totalPages > 0 : chapters.length > 0;

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
            <NavigatorPanel
              isPaged={isPaged}
              chapters={chapters}
              pageInfo={pageInfo}
              onGoToPage={goToPage}
              onGoToChapter={goToChapter}
            />
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
              onRename={renameBookmark}
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
            <SettingsPanel
              canZoom={canZoom}
              zoom={zoom}
              limits={limits}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onResetZoom={resetZoom}
              theme={theme}
              onThemeChange={settings.setTheme}
              showClock={settings.showClock}
              onShowClockChange={settings.setShowClock}
              showSession={settings.showSession}
              onShowSessionChange={settings.setShowSession}
            />
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
            onClick={exitImmersive}
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

      <ReaderFooter
        hasEngine={Boolean(Engine)}
        pageInfo={pageInfo}
        showClock={settings.showClock}
        showSession={settings.showSession}
        isImmersive={isImmersive}
      />

      {settings.showSession && (
        <SessionFinishedNotice className="fixed left-1/2 top-[calc(4.5rem+env(safe-area-inset-top))] z-50 w-[min(28rem,calc(100vw-1rem))] -translate-x-1/2" />
      )}
    </div>
  );
}
