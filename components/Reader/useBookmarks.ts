"use client";

import { useMemo, useState } from "react";

import {
  createBookmark,
  deleteBookmark,
  renameBookmark as renameBookmarkAction,
} from "@/app/read/actions";

import type { Bookmark, ReaderProgress } from "./readerTypes";

/*
 * Marcadores com nome do livro (modelo Bookmark): a lista na tela e as
 * ações de criar (na posição atual), renomear e apagar. "Onde parei" (o
 * progresso salvo) fica em useReaderProgress.
 */
function byPosition(a: Bookmark, b: Bookmark) {
  return a.currentPosition - b.currentPosition || a.id - b.id;
}

export function useBookmarks(
  bookId: number,
  initialBookmarks: Bookmark[],
  current: ReaderProgress | null,
) {
  const [list, setBookmarks] = useState(initialBookmarks);
  const bookmarks = useMemo(() => [...list].sort(byPosition), [list]);

  async function addBookmark(name: string) {
    if (!current) return;

    const bookmark = await createBookmark(bookId, name, current);

    setBookmarks((items) => [...items, bookmark]);
  }

  async function renameBookmark(bookmarkId: number, name: string) {
    const bookmark = await renameBookmarkAction(bookId, bookmarkId, name);

    setBookmarks((items) =>
      items.map((item) => (item.id === bookmark.id ? bookmark : item)),
    );
  }

  async function removeBookmark(bookmarkId: number) {
    await deleteBookmark(bookId, bookmarkId);

    setBookmarks((items) => items.filter((item) => item.id !== bookmarkId));
  }

  return { bookmarks, addBookmark, renameBookmark, removeBookmark };
}
