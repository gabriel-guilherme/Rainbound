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
