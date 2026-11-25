"use client";

import { useEffect, useRef, useState } from "react";

import { fetchBookFile } from "@/lib/bookCache";
import {
  getImageType,
  isComicPage,
  sortComicPages,
  unzipAsync,
} from "@/lib/comicFiles";

import FileError from "../FileError";
import { calculateProgress, getComicPage } from "../readerUtils";
import type { ReaderEngineProps } from "../readerTypes";

/*
 * Leitor de CBZ: o arquivo é um ZIP de imagens. Descompacta no navegador
 * (fflate, em worker) e mostra uma imagem por página, em ordem natural
 * de nome (página 2 antes da 10). O arquivo baixado fica em cache no
 * navegador (lib/bookCache.ts).
 */

export default function ComicReader({
  bookId,
  bookUrl,
  locator,
  onReady,
  onPageChange,
  onProgressChange,
  zoom,
}: ReaderEngineProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [pageNumber, setPageNumber] = useState(() => getComicPage(locator));
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  /* Motivo do erro mostrado na tela. */
  const [errorKind, setErrorKind] = useState<"download" | "file" | "empty">(
    "file",
  );
  const [retryKey, setRetryKey] = useState(0);

  const viewerRef = useRef<HTMLDivElement>(null);

  const callbacksRef = useRef({ onReady, onPageChange, onProgressChange });

  useEffect(() => {
    callbacksRef.current = { onReady, onPageChange, onProgressChange };
  });

  /*
   * Baixa e descompacta o CBZ.
   */
  useEffect(() => {
    let cancelled = false;
    let urls: string[] = [];

    async function load() {
      let data: ArrayBuffer;

      try {
        data = await fetchBookFile(bookId, bookUrl);
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao baixar CBZ:", error);
          setErrorKind("download");
          setStatus("error");
        }
        return;
      }

      try {

        if (cancelled) return;

        const files = await unzipAsync(new Uint8Array(data), (file) =>
          isComicPage(file.name),
        );

        if (cancelled) return;

        const names = sortComicPages(Object.keys(files));

        if (names.length === 0) {
          setErrorKind("empty");
          setStatus("error");
          return;
        }

        urls = names.map((name) =>
          URL.createObjectURL(
            new Blob([files[name] as BlobPart], { type: getImageType(name) }),
          ),
        );

        setPages(urls);
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao abrir CBZ:", error);
          setErrorKind("file");
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [bookId, bookUrl, retryKey]);

  const totalPages = pages.length;

  /*
   * Entrega o controle ao Reader quando as páginas estão prontas.
   */
  useEffect(() => {
    if (!totalPages) return;

    const clamp = (page: number) => Math.min(Math.max(page, 1), totalPages);

    callbacksRef.current.onReady({
      previous: () => setPageNumber((page) => clamp(page - 1)),
      next: () => setPageNumber((page) => clamp(page + 1)),
      goToPage: (page) => setPageNumber(clamp(page)),
      goToLocator: (locator) => setPageNumber(clamp(getComicPage(locator))),
    });

    setPageNumber((page) => clamp(page));
  }, [totalPages]);

  useEffect(() => {
    if (!totalPages || pageNumber > totalPages) return;

    const percentage = calculateProgress(pageNumber, totalPages);

    callbacksRef.current.onPageChange({
      currentPage: pageNumber,
      totalPages,
      progress: percentage,
      atStart: pageNumber <= 1,
      atEnd: pageNumber >= totalPages,
      chapterTitle: "",
    });

    callbacksRef.current.onProgressChange({
      currentPosition: pageNumber - 1,
      totalPositions: totalPages,
      percentage,
      locator: `cbz-page:${pageNumber}`,
    });
  }, [pageNumber, totalPages]);

  /* Com zoom, cada página nova começa do topo. */
  useEffect(() => {
    viewerRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageNumber]);

  if (status === "error") {
    return (
      <FileError
        title="Não foi possível abrir o CBZ."
        message={
          errorKind === "download"
            ? "Não foi possível baixar o arquivo. Verifique a conexão."
            : errorKind === "empty"
              ? "Nenhuma imagem encontrada no arquivo."
              : "O arquivo pode estar corrompido ou fora do padrão CBZ."
        }
        onRetry={() => {
          setStatus("loading");
          setRetryKey((previous) => previous + 1);
        }}
      />
    );
  }

  if (status === "loading") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-contrast/50">
        Abrindo quadrinho...
      </div>
    );
  }

  const current = pages[pageNumber - 1];
  const next = pages[pageNumber];

  return (
    <div ref={viewerRef} className="h-full w-full overflow-auto">
      {/*
        * 100% = página inteira na tela. Acima disso a área cresce e o
        * contêiner rola (centralizar com flex cortaria a borda esquerda).
        */}
      <div
        className="flex min-h-full min-w-full p-2 sm:p-4"
        style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
      >
      {current && (
        // Blob URL local: next/image não otimiza esse tipo de origem.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current}
          src={current}
          alt={`Página ${pageNumber} de ${totalPages}`}
          className="m-auto h-full w-full object-contain drop-shadow-2xl"
        />
      )}
      </div>

      {/* Pré-carrega a próxima página. */}
      {next && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={next} alt="" aria-hidden="true" className="hidden" />
      )}
    </div>
  );
}
