"use client";

import { useState } from "react";

import { createBook } from "../actions";
import { SubmitButton } from "@/components/common/SubmitButton";

import { statusLabel } from "../types";
import InputCover from "@/components/forms/InputCover";
import BackButton from "@/components/common/BackButton";
import OpenLibrarySearch, {
  OpenLibraryBook,
} from "@/components/OpenLibrarySearch";

const statusOptions = ["WANT_TO_READ", "READING", "READ", "ABANDONED"];

const stylePattern =
  "shadow shadow-black/75 opacity-30 hover:opacity-70 focus:opacity-70 bg-contrast rounded-lg border border-gray-300 px-3 py-2 text-primary outline-none focus:border-gray-900";

type BookForm = {
  title: string;
  author: string;
  totalPages: string;
  status: string;
  rating: string;
  currentPage: string;
  category: string;
  notes: string;
  coverUrl: string;
};

export default function NewBookPage() {
  const [book, setBook] = useState<BookForm>({
    title: "",
    author: "",
    totalPages: "",
    status: "",
    rating: "0",
    currentPage: "0",
    category: "",
    notes: "",
    coverUrl: "",
  });

  function handleBookSelect(selectedBook: OpenLibraryBook) {
    setBook((current) => ({
      ...current,
      title: selectedBook.title,
      author: selectedBook.author_name?.[0] ?? "",
      totalPages: selectedBook.number_of_pages_median?.toString() ?? "",
      coverUrl: selectedBook.cover_i
        ? `https://covers.openlibrary.org/b/id/${selectedBook.cover_i}-L.jpg`
        : "",
    }));
  }

  function updateField(field: keyof BookForm, value: string) {
    setBook((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 pt-32">
      <BackButton />

      <div className="flex flex-col p-4 sm:p-6 md:p-10">
        <div className="flex items-center justify-between gap-6">
          <h1 className="mb-6 text-2xl font-bold text-contrast">
            Adicionar livro
          </h1>

          <OpenLibrarySearch onSelect={handleBookSelect} />
        </div>

        <form
          action={createBook}
          className="grid w-full grid-cols-1 gap-8 md:grid-cols-[40%_minmax(0,1fr)] md:gap-30"
        >
          <section className="relative mx-auto aspect-[3/4] w-full max-w-64 md:mx-0 md:max-w-none">
            <InputCover
              src={book.coverUrl ?? undefined}
              alt={`Capa de ${book.title}`}
            />
          </section>

          <section className="flex w-full flex-col gap-6 text-sm font-medium text-contrast">
            <div className="flex flex-col">
              <label>Título</label>

              <input
                type="text"
                name="title"
                required
                value={book.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={stylePattern}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[80%_minmax(0,1fr)]">
              <div className="flex flex-col">
                <label>Autor</label>

                <input
                  type="text"
                  name="author"
                  required
                  value={book.author}
                  onChange={(e) => updateField("author", e.target.value)}
                  className={stylePattern}
                />
              </div>

              <div className="flex flex-col">
                <label>Qtd. Páginas</label>

                <input
                  type="number"
                  name="totalPages"
                  required
                  value={book.totalPages}
                  onChange={(e) => updateField("totalPages", e.target.value)}
                  className={`${stylePattern} text-center`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[60%_minmax(0,1fr)_18%]">
              <div className="flex flex-col">
                <label>Status</label>

                <select
                  name="status"
                  value={book.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className={`${stylePattern} cursor-pointer text-center`}
                >
                  <option value="">Status</option>

                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label>Nota</label>

                <input
                  type="number"
                  name="rating"
                  value={book.rating}
                  onChange={(e) => updateField("rating", e.target.value)}
                  className={`${stylePattern} text-center`}
                />
              </div>

              <div className="flex flex-col">
                <label>Pág. Lidas</label>

                <input
                  type="number"
                  name="currentPage"
                  value={book.currentPage}
                  onChange={(e) => updateField("currentPage", e.target.value)}
                  className={`${stylePattern} text-center`}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label>Categoria</label>

              <input
                type="text"
                name="category"
                value={book.category}
                onChange={(e) => updateField("category", e.target.value)}
                className={stylePattern}
              />
            </div>

            <div className="flex flex-col">
              <label>Notas</label>

              <textarea
                name="notes"
                rows={7}
                value={book.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className={`${stylePattern} resize-y align-top`}
              />
            </div>

            <input type="hidden" name="coverUrl" value={book.coverUrl} />

            <SubmitButton>Salvar</SubmitButton>
          </section>
        </form>
      </div>
    </div>
  );
}
