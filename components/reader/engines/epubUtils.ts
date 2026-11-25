import type ePub from "@likecoin/epub-ts";
import type { Contents, EpubCFI } from "@likecoin/epub-ts";

import {
  calculateProgress,
  findCurrentChapter,
  getEpubPosition,
  type TocEntry,
} from "../readerUtils";
import type { PageInfo, ReaderProgress, ReaderTheme } from "../readerTypes";

/*
 * Peças do leitor de EPUB (EpubReader.tsx) que não dependem do React:
 * tema do livro, cache das locations, teclado dentro do iframe e a
 * leitura da posição atual.
 */

export type EpubBook = ReturnType<typeof ePub>;
export type Rendition = ReturnType<EpubBook["renderTo"]>;

/*
 * O tipo `Location` do @likecoin/epub-ts aponta para um `types.d.ts`
 * que não é publicado no pacote; por isso definimos só o que usamos.
 */
type EpubLocationPoint = {
  cfi: string;
  index: number;
  displayed: { page: number; total: number };
};

export type EpubLocation = {
  start: EpubLocationPoint;
  end: EpubLocationPoint;
  atStart?: boolean;
  atEnd?: boolean;
};

/// Teclado

/*
 * O teclado dentro do iframe do livro não chega ao window do Reader;
 * repassamos a tecla para ele tratar setas, zoom e Esc como nos outros
 * formatos. Campos de texto do próprio livro ficam com a tecla.
 */
export function forwardKeyToReader(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;

  if (
    target &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      target.isContentEditable)
  ) {
    return;
  }

  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
    }),
  );
}

/// Tema

/* Tamanho do texto em 100% de zoom. */
export const BASE_FONT_SIZE = 18;

/*
 * Estilos do livro. As cores vêm das variáveis do tema do leitor
 * (data-reader-theme no Reader), lidas do elemento que contém o iframe.
 *
 * O site usa `color-scheme: dark`; se o documento do livro ficar com o
 * esquema claro padrão, o navegador pinta o iframe de branco opaco. Por
 * isso o livro recebe o esquema do tema e o fundo do leitor explícito.
 */
export function buildBookTheme(element: HTMLElement, theme: ReaderTheme) {
  const styles = getComputedStyle(element);
  const background =
    styles.getPropertyValue("--color-darkest").trim() || "#080c0d";
  const text = styles.getPropertyValue("--color-contrast").trim() || "#e0e4ce";
  const link = styles.getPropertyValue("--color-danger").trim() || "#d4a09a";

  return {
    html: {
      "color-scheme": theme === "night" ? "dark" : "light",
      background: `${background} !important`,
    },
    /*
     * Muitos EPUBs fixam texto preto e fundos brancos no próprio CSS;
     * sem isso o texto some no tema noite.
     */
    "body *": {
      color: "inherit !important",
      "background-color": "transparent !important",
    },
    body: {
      "font-family": "Georgia, serif",
      "font-size": `${BASE_FONT_SIZE}px`,
      "line-height": "1.7",
      color: `${text} !important`,
      background: "none !important",
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
    /*
     * Mesma cor de destaque do site (--color-danger). Seletores mais
     * específicos que `body *` para não herdarem a cor do texto.
     */
    "html body a, html body a *": {
      color: `${link} !important`,
    },
  };
}

/// Locations (posições usadas no progresso)

/* Tamanho (em caracteres) de cada "posição" usada no progresso. */
const LOCATION_CHARS = 1024;

/*
 * Gerar as locations percorre o livro inteiro e pode levar alguns
 * segundos; o resultado fica em cache no navegador por arquivo.
 */
function locationsCacheKey(bookId: number, bookUrl: string) {
  let path = bookUrl;

  try {
    path = new URL(bookUrl).pathname;
  } catch {
    /* URL relativa: usa como está. */
  }

  return `rainbound:epub-locations:${bookId}:${path}:${LOCATION_CHARS}`;
}

function readCachedLocations(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeCachedLocations(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Sem espaço ou storage bloqueado: só não guarda o cache. */
  }
}

/* Carrega as locations do cache ou gera (e guarda) na primeira vez. */
export async function loadLocations(book: EpubBook, bookId: number, bookUrl: string) {
  const cacheKey = locationsCacheKey(bookId, bookUrl);
  const cached = readCachedLocations(cacheKey);

  if (cached) {
    book.locations.load(cached);
  } else {
    await book.locations.generate(LOCATION_CHARS);
    writeCachedLocations(cacheKey, book.locations.save());
  }
}

/// Posição atual

/*
 * Página, progresso e capítulo de uma posição do epub-ts (evento
 * "relocated"). Null quando a posição não está nas locations.
 */
export function readLocation(
  book: EpubBook,
  rendition: Rendition,
  tocEntries: TocEntry[],
  epubCfi: EpubCFI,
  location: EpubLocation,
): { pageInfo: PageInfo; progress: ReaderProgress } | null {
  const cfi = location.start.cfi;

  if (!cfi) return null;

  const startPosition = getEpubPosition(book, cfi);

  if (startPosition === null) return null;

  const totalPositions = book.locations.length();
  /*
   * A última tela começa algumas posições antes do fim; nela o
   * livro conta como terminado (última página, 100%).
   */
  const currentPosition = location.atEnd
    ? Math.max(totalPositions - 1, startPosition)
    : startPosition;
  const percentage = calculateProgress(currentPosition + 1, totalPositions);

  /*
   * Capítulo pela última posição visível: se o título de um
   * capítulo aparece na tela, o cabeçalho já mostra ele.
   */
  const sectionIndex = location.end.index;
  const endCfi = location.end.cfi;

  const chapter = findCurrentChapter(tocEntries, sectionIndex, (fragment) => {
    const contents = (rendition.getContents() as Contents[]).find(
      (item) => item.sectionIndex === sectionIndex,
    );
    const anchor = contents?.document.getElementById(fragment);

    /* Sem como conferir: considera que o capítulo começou. */
    if (!contents || !anchor || !endCfi) return true;

    try {
      return epubCfi.compare(contents.cfiFromNode(anchor), endCfi) <= 0;
    } catch {
      return true;
    }
  });

  return {
    pageInfo: {
      currentPage: currentPosition + 1,
      totalPages: totalPositions,
      progress: percentage,
      atStart: Boolean(location.atStart),
      atEnd: Boolean(location.atEnd),
      chapterTitle: chapter?.title ?? "",
      chapterHref: chapter?.href,
    },
    progress: {
      currentPosition,
      totalPositions,
      percentage,
      locator: cfi,
    },
  };
}
