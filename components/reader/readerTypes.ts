export type PageInfo = {
  currentPage: number;
  totalPages: number;
  progress: number;
  /* Primeira / última página: o Reader desabilita as setas. */
  atStart: boolean;
  atEnd: boolean;
  chapterTitle: string;
  /* EPUB: href da entrada do sumário atual (marca o item no Sumário). */
  chapterHref?: string;
};

export type ReaderProgress = {
  currentPosition: number;
  totalPositions: number;
  percentage: number;
  locator: string;
};

/* Marcador com nome (o padrão, "Onde parei", é o ReadingProgress). */
export type Bookmark = {
  id: number;
  name: string;
  locator: string;
  currentPosition: number;
  totalPositions: number | null;
  percentage: number;
};

export type Chapter = {
  title: string;
  href: string;
  /* Profundidade no sumário (0 = primeiro nível). */
  level: number;
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
  /* Vai até um locator salvo (progresso ou marcador). */
  goToLocator: (locator: string) => void;
};

export type TurnDirection = "previous" | "next";

export type ReaderEngineProps = {
  bookId: number;
  bookUrl: string;
  locator?: string | null;
  onReady: (controller: ReaderController) => void;
  onPageChange: (info: PageInfo) => void;
  onProgressChange: (progress: ReaderProgress) => void;
  onContentsChange?: (chapters: Chapter[]) => void;
  /*
   * Motores que recebem teclado/toque por conta própria (EPUB, dentro
   * do iframe) pedem a virada ao Reader, que anima e chama o controller.
   */
  onTurnPage?: (direction: TurnDirection) => void;
} & ReaderDisplayProps;

/* Tema da área de leitura (Configurações do leitor). */
export type ReaderTheme = "night" | "sepia" | "light";

/* Configurações visuais que o Reader repassa a todo motor. */
export type ReaderDisplayProps = {
  /* PDF/CBZ: escala da página. EPUB: multiplicador do tamanho do texto. */
  zoom: number;
  theme: ReaderTheme;
};
