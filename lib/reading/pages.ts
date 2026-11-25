/*
 * Página atual e total de um progresso, quando são páginas de verdade:
 * - PDF/CBZ: `pdf-page:X` / `cbz-page:X` (o leitor grava a página X);
 * - registro manual por página: `manual-page:X` (X páginas lidas);
 * - registro manual por %: página estimada pelo total informado.
 * No EPUB as posições são trechos de texto, não páginas: devolve null.
 */
export type ReadPages = {
  current: number;
  total: number;
};

type ProgressLike = {
  currentPosition: number;
  totalPositions: number | null;
  locator: string | null;
};

const PAGE_LOCATOR = /^(?:pdf-page|cbz-page|manual-page):(\d+)$/;

export function getReadPages(progress: ProgressLike | null): ReadPages | null {
  if (!progress?.totalPositions || !progress.locator) {
    return null;
  }

  const total = progress.totalPositions;
  const match = PAGE_LOCATOR.exec(progress.locator);

  if (match) {
    return { current: Math.min(Number(match[1]), total), total };
  }

  if (progress.locator.startsWith("manual-percent:")) {
    return { current: Math.min(progress.currentPosition, total), total };
  }

  return null;
}

export function formatReadPages(pages: ReadPages) {
  return `pág. ${pages.current} de ${pages.total}`;
}
