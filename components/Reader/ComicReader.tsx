"use client";

import { unzip, type Unzipped } from "fflate";
import { useEffect, useRef, useState } from "react";

import { getComicPage } from "./readerUtils";
import type { ReaderEngineProps } from "./readerTypes";

/*
 * Leitor de CBZ: o arquivo é um ZIP de imagens. Descompacta no navegador
 * (fflate, em worker) e mostra uma imagem por página, em ordem natural
 * de nome (página 2 antes da 10).
 */

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function getImageType(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";

  return IMAGE_TYPES[extension];
}

function isComicPage(name: string) {
  const fileName = name.split("/").pop() ?? "";

  return (
    Boolean(getImageType(name)) &&
    !name.startsWith("__MACOSX/") &&
    !fileName.startsWith(".")
  );
}

function unzipAsync(data: Uint8Array) {
  return new Promise<Unzipped>((resolve, reject) => {
    unzip(data, { filter: (file) => isComicPage(file.name) }, (error, files) =>
      error ? reject(error) : resolve(files),
    );
  });
}

export default function ComicReader({
  bookUrl,
  locator,
  onReady,
  onPageChange,
  onProgressChange,
}: ReaderEngineProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [pageNumber, setPageNumber] = useState(() => getComicPage(locator));
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

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
      try {
        const response = await fetch(bookUrl);

        if (!response.ok) {
          throw new Error(`Erro ao carregar CBZ: ${response.status}`);
        }

        const files = await unzipAsync(
          new Uint8Array(await response.arrayBuffer()),
        );

        if (cancelled) return;

        const names = Object.keys(files).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
        );

        if (names.length === 0) {
          throw new Error("Nenhuma imagem encontrada no CBZ.");
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
          console.error("Erro ao carregar CBZ:", error);
          setStatus("error");
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [bookUrl]);

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
    });

    setPageNumber((page) => clamp(page));
  }, [totalPages]);

  useEffect(() => {
    if (!totalPages || pageNumber > totalPages) return;

    const percentage = Math.round((pageNumber / totalPages) * 100);

    callbacksRef.current.onPageChange({
      currentPage: pageNumber,
      totalPages,
      progress: percentage,
      isTwoPages: false,
      chapterTitle: "",
    });

    callbacksRef.current.onProgressChange({
      currentPosition: pageNumber - 1,
      totalPositions: totalPages,
      percentage,
      locator: `cbz-page:${pageNumber}`,
    });
  }, [pageNumber, totalPages]);

  if (status === "error") {
    return (
      <div
        role="alert"
        className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center"
      >
        <p className="font-display text-xl">Não foi possível abrir o CBZ.</p>

        <p className="max-w-md text-sm text-contrast/50">
          O arquivo pode estar corrompido ou não conter imagens.
        </p>
      </div>
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
    <div className="flex h-full w-full items-center justify-center p-2 sm:p-4">
      {current && (
        // Blob URL local: next/image não otimiza esse tipo de origem.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current}
          src={current}
          alt={`Página ${pageNumber} de ${totalPages}`}
          className="h-full w-full object-contain shadow-2xl shadow-black/60"
        />
      )}

      {/* Pré-carrega a próxima página. */}
      {next && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={next} alt="" aria-hidden="true" className="hidden" />
      )}
    </div>
  );
}
