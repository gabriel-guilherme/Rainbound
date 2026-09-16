"use client";

import { useState } from "react";

import { createBook } from "../actions";
import { SubmitButton } from "@/components/common/SubmitButton";

import { statusLabel } from "../types";
import InputBookCover from "@/components/forms/InputBookCover";
import BackButton from "@/components/common/BackButton";
import OpenLibrarySearch, {
  OpenLibraryBook,
} from "@/components/OpenLibrarySearch";
import InputBookFile from "@/components/forms/InputBookFile";

const statusOptions = ["WANT_TO_READ", "READING", "READ", "ABANDONED"];

const typeOptions = [
  { value: "BOOK", label: "Livro" },
  { value: "COMIC", label: "Quadrinho" },
  { value: "MANGA", label: "Mangá" },
];

const formatOptions = [
  { value: "EPUB", label: "EPUB" },
  { value: "PDF", label: "PDF" },
  { value: "CBZ", label: "CBZ" },
  { value: "CBR", label: "CBR" },
];

const stylePattern =
  "shadow shadow-black/75 opacity-30 hover:opacity-70 focus:opacity-70 bg-contrast rounded-lg border border-gray-300 px-3 py-2 text-primary outline-none focus:border-gray-900";

type BookForm = {
  title: string;
  creator: string;
  type: string;
  format: string;
  status: string;
  rating: string;
  notes: string;
  coverUrl: string;
};

export default function NewBookPage() {
  const [book, setBook] = useState<BookForm>({
    title: "",
    creator: "",
    type: "BOOK",
    format: "",
    status: "",
    rating: "0",
    notes: "",
    coverUrl: "",
  });

  function handleBookSelect(selectedBook: OpenLibraryBook) {
    setBook((current) => ({
      ...current,
      title: selectedBook.title,
      creator: selectedBook.author_name?.[0] ?? "",
      type: "BOOK",
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
            Adicionar item
          </h1>

          <OpenLibrarySearch onSelect={handleBookSelect} />
        </div>

        <form
          action={createBook}
          className="grid w-full grid-cols-1 gap-8 md:grid-cols-[40%_minmax(0,1fr)] md:gap-30"
        >
          <section className="relative mx-auto flex aspect-[3/4] w-full max-w-64 flex-col gap-3 md:mx-0 md:max-w-none">
            <InputBookCover
              src={book.coverUrl || undefined}
              alt={`Capa de ${book.title}`}
            />

            <InputBookFile />
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

            <div className="flex flex-col">
              <label>Criador</label>

              <input
                type="text"
                name="creator"
                required
                value={book.creator}
                onChange={(e) => updateField("creator", e.target.value)}
                className={stylePattern}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label>Tipo</label>

                <select
                  name="type"
                  required
                  value={book.type}
                  onChange={(e) => updateField("type", e.target.value)}
                  className={`${stylePattern} cursor-pointer text-center`}
                >
                  {typeOptions.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label>Formato</label>

                <select
                  name="format"
                  required
                  value={book.format}
                  onChange={(e) => updateField("format", e.target.value)}
                  className={`${stylePattern} cursor-pointer text-center`}
                >
                  <option value="">Formato</option>

                  {formatOptions.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[60%_minmax(0,1fr)]">
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
                  min="0"
                  max="5"
                  value={book.rating}
                  onChange={(e) => updateField("rating", e.target.value)}
                  className={`${stylePattern} text-center`}
                />
              </div>
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
