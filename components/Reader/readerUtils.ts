import type ePub from "@likecoin/epub-ts";

/*
 * Porcentagem lida com a página atual (1-based) contada como lida:
 * a última página dá 100% em todos os formatos.
 */
export function calculateProgress(currentPage: number, totalPages: number) {
  if (totalPages <= 0) {
    return 0;
  }

  return Math.round((Math.min(Math.max(currentPage, 0), totalPages) / totalPages) * 100);
}

/// PDF / CBZ
/*
 * Locators de motores paginados: "<prefixo>:<página>" (1-based).
 */
function getPageFromLocator(
  locator: string | null | undefined,
  prefix: string,
) {
  if (!locator) {
    return 1;
  }

  const match = new RegExp(`^${prefix}:(\\d+)$`).exec(locator.trim());

  if (!match) {
    return 1;
  }

  const page = Number(match[1]);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

export function getPdfPage(locator: string | null | undefined) {
  return getPageFromLocator(locator, "pdf-page");
}

export function getComicPage(locator: string | null | undefined) {
  return getPageFromLocator(locator, "cbz-page");
}
///

/// EPUB
type EpubBook = ReturnType<typeof ePub>;

/* Item do sumário como o epub-ts entrega (o tipo não é publicado). */
type NavItem = { href?: string; label?: string; subitems?: NavItem[] };

/* Seção da spine (o tipo também não é publicado). */
type SpineSection = { index: number; href: string };

/* Entrada do sumário já ligada à seção da spine onde começa. */
export type TocEntry = {
  title: string;
  href: string;
  /* Profundidade no sumário (0 = primeiro nível). */
  level: number;
  /* Índice da seção na spine; -1 se não foi encontrada. */
  spineIndex: number;
  /* Âncora dentro da seção (vários capítulos num arquivo só). */
  fragment: string;
};

function cleanPath(href: string) {
  let path = href.split("#")[0];

  try {
    path = decodeURIComponent(path);
  } catch {
    /* href com % solto: usa como está. */
  }

  return path.replace(/^(\.\.?\/)+/, "");
}

/*
 * O href do sumário é relativo ao arquivo do sumário, e o da spine ao
 * OPF; em muitos livros os dois coincidem. Quando não, compara pelo
 * fim do caminho.
 */
function findSpineIndex(book: EpubBook, href: string) {
  try {
    const section = book.spine.get(href) as SpineSection | null;

    if (section) return section.index;
  } catch {
    /* Segue para a comparação pelo caminho. */
  }

  const path = cleanPath(href);

  if (!path) return -1;

  const items = (book.spine as unknown as { spineItems?: SpineSection[] })
    .spineItems ?? [];

  const match = items.find((item) => {
    const itemPath = cleanPath(item.href);

    return (
      itemPath === path ||
      itemPath.endsWith(`/${path}`) ||
      path.endsWith(`/${itemPath}`)
    );
  });

  return match ? match.index : -1;
}

/*
 * Sumário inteiro (com subitens: partes → capítulos), na ordem do livro.
 */
export function buildTocEntries(book: EpubBook): TocEntry[] {
  const entries: TocEntry[] = [];

  const visit = (items: NavItem[] | undefined, level: number) => {
    for (const item of items ?? []) {
      const title = item.label?.replace(/\s+/g, " ").trim();

      if (title && item.href) {
        const fragment = item.href.split("#")[1] ?? "";

        entries.push({
          title,
          href: item.href,
          level,
          spineIndex: findSpineIndex(book, item.href),
          fragment,
        });
      }

      visit(item.subitems, level + 1);
    }
  };

  visit(book.navigation.toc as NavItem[], 0);

  return entries;
}

/*
 * Capítulo atual: a última entrada do sumário que começa até a seção
 * atual. Seções sem entrada própria (capítulo dividido em vários
 * arquivos) ficam com o capítulo anterior; na mesma seção, entradas
 * com âncora só contam se a âncora já apareceu (`hasReached`).
 * Antes do primeiro capítulo (capa, créditos) não há capítulo.
 */
export function findCurrentChapter(
  entries: TocEntry[],
  sectionIndex: number,
  hasReached: (fragment: string) => boolean,
) {
  let current: TocEntry | null = null;

  for (const entry of entries) {
    if (entry.spineIndex < 0 || entry.spineIndex > sectionIndex) continue;

    if (
      entry.spineIndex === sectionIndex &&
      entry.fragment &&
      !hasReached(entry.fragment)
    ) {
      continue;
    }

    /* Mesma seção: a entrada mais interna/posterior do sumário vence. */
    if (!current || entry.spineIndex >= current.spineIndex) {
      current = entry;
    }
  }

  return current;
}

export function isValidEpubLocator(locator: string | null | undefined) {
  if (!locator) return false;

  return locator.startsWith("epubcfi(");
}

export function getEpubPosition(
  book: ReturnType<typeof ePub>,
  locator: string,
) {
  try {
    const position = book.locations.locationFromCfi(locator);

    if (position === -1 || position === undefined) {
      return null;
    }

    const numericPosition = Number(position);

    if (!Number.isFinite(numericPosition)) {
      return null;
    }

    return numericPosition;
  } catch {
    return null;
  }
}
///
