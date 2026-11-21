export type PageInfo = {
  currentPage: number;
  totalPages: number;
  progress: number;
  isTwoPages: boolean;
  chapterTitle: string;
};

export type ReaderProgress = {
  currentPosition: number;
  totalPositions: number;
  percentage: number;
  locator: string;
};

export type Chapter = {
  title: string;
  href: string;
};

/*
 * Controle que cada motor (PDF, EPUB, CBZ) entrega ao Reader.
 * O Reader cuida do cabeçalho, das setas, do teclado e do progresso;
 * o motor cuida de renderizar e de saber onde está.
 */
export type ReaderController = {
  previous: () => void;
  next: () => void;
  /* Motores paginados (PDF, CBZ). */
  goToPage?: (page: number) => void;
  /* Motores com sumário (EPUB). */
  goToChapter?: (href: string) => void;
};

export type ReaderEngineProps = {
  bookId: number;
  bookUrl: string;
  locator?: string | null;
  onReady: (controller: ReaderController) => void;
  onPageChange: (info: PageInfo) => void;
  onProgressChange: (progress: ReaderProgress) => void;
  onContentsChange?: (chapters: Chapter[]) => void;
};
