"use client";

import { useState } from "react";

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
export function useBookmarks(
  bookId: number,
  initialBookmarks: Bookmark[],
  current: ReaderProgress | null,
) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);

  async function addBookmark(name: string) {
    if (!current) return;

    const bookmark = await createBookmark(bookId, name, current);

    setBookmarks((list) => [...list, bookmark]);
  }

  async function renameBookmark(bookmarkId: number, name: string) {
    const bookmark = await renameBookmarkAction(bookId, bookmarkId, name);

    setBookmarks((list) =>
      list.map((item) => (item.id === bookmark.id ? bookmark : item)),
    );
  }

  async function removeBookmark(bookmarkId: number) {
    await deleteBookmark(bookId, bookmarkId);

    setBookmarks((list) => list.filter((item) => item.id !== bookmarkId));
  }

  return { bookmarks, addBookmark, renameBookmark, removeBookmark };
}
