import ePub from "@likecoin/epub-ts";

export function calculateProgress(
  currentPosition: number,
  totalPositions: number,
) {
  if (totalPositions <= 0) {
    return 0;
  }

  return Math.round((currentPosition / totalPositions) * 100);
}

/// PDF
export function getPdfPage(locator: string | null | undefined) {
  if (!locator) {
    return 1;
  }

  const match = /^pdf-page:(\d+)$/.exec(locator.trim());

  if (!match) {
    return 1;
  }

  const page = Number(match[1]);

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}
///

/// EPUB
export function normalizeHref(href: string) {
  return decodeURIComponent(href)
    .split("#")[0]
    .replace(/^(\.\.\/)+/, "");
}

export function findChapterTitle(book: ReturnType<typeof ePub>, href?: string) {
  if (!href) {
    return "Leitura";
  }

  const normalizedHref = normalizeHref(href);

  const item = book.navigation.toc.find(
    (item) => normalizeHref(item.href) === normalizedHref,
  );

  return item?.label ?? "Leitura";
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
