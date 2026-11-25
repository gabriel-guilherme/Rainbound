import { estimatePages, type SpineBook } from "@/lib/books/spine";

/*
 * Ajudantes dos widgets de livros (Lendo agora, Quase lá, Parados).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function clampProgress(book: SpineBook) {
  return Math.round(Math.min(Math.max(book.percentage, 0), 100));
}

/* Com arquivo, abre o leitor; sem arquivo, a página do livro. */
export function continueHref(book: SpineBook) {
  return book.hasFile ? `/read/${book.id}` : `/library/${book.id}`;
}

/*
 * Quanto falta: páginas de verdade (PDF, CBZ, registro manual), páginas
 * estimadas pelo total do livro (EPUB, com "~") ou, sem nenhum total, a %.
 */
export function remainingLabel(book: SpineBook) {
  const progress = clampProgress(book);

  if (book.readPages) {
    return formatPagesLeft(book.readPages.total - book.readPages.current, "");
  }

  const pages = estimatePages(book.format, book.totalPositions, book.pageCount);

  if (pages) {
    return formatPagesLeft(Math.ceil((pages * (100 - progress)) / 100), "~");
  }

  return `faltam ${100 - progress}%`;
}

function formatPagesLeft(pages: number, prefix: string) {
  const left = Math.max(pages, 1);

  return `${left === 1 ? "falta" : "faltam"} ${prefix}${left} pág.`;
}

export function daysSince(date: Date, now: number) {
  return Math.max(Math.floor((now - date.getTime()) / DAY_MS), 0);
}

/* "há 1 dia", "há 47 dias". */
export function formatDaysAgo(days: number) {
  return `há ${days} ${days === 1 ? "dia" : "dias"}`;
}
