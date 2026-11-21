"use client";

import { unstable_rethrow } from "next/navigation";
import { useState } from "react";

import { createBook } from "../actions";
import { SubmitButton } from "@/components/common/SubmitButton";

import { statusLabel, statusOptions, typeOptions } from "../types";
import InputBookCover from "@/components/forms/InputBookCover";
import BackButton from "@/components/common/BackButton";
import OpenLibrarySearch, {
  OpenLibraryBook,
} from "@/components/forms/OpenLibrarySearch";
import InputBookFile from "@/components/forms/InputBookFile";
import { prepareBookFormData, UploadError } from "@/lib/clientUpload";
import {
  fieldClass as stylePattern,
  labelClass,
} from "@/components/forms/fieldStyles";



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
    status: "WANT_TO_READ",
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

  const [submitError, setSubmitError] = useState("");

  /*
   * O arquivo do livro vai direto do navegador para o storage;
   * a action recebe só o caminho dele.
   */
  async function handleSubmit(formData: FormData) {
    setSubmitError("");

    try {
      await createBook(await prepareBookFormData(formData));
    } catch (error) {
      unstable_rethrow(error);

      setSubmitError(
        error instanceof UploadError
          ? error.message
          : "Não foi possível adicionar o livro. Tente de novo.",
      );
    }
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
        <div className="mb-8 flex items-center justify-between gap-6">
          <h1 className="font-display text-3xl text-contrast">
            Adicionar livro
          </h1>

          <OpenLibrarySearch onSelect={handleBookSelect} />
        </div>

        <form
          action={handleSubmit}
          className="grid w-full grid-cols-1 gap-8 md:grid-cols-[40%_minmax(0,1fr)] md:gap-16 lg:gap-24"
        >
          <section className="relative mx-auto flex aspect-[3/4] w-full max-w-64 flex-col gap-3 md:mx-0 md:max-w-none">
            <InputBookCover
              src={book.coverUrl || undefined}
              alt={`Capa de ${book.title}`}
            />

            <InputBookFile required />
          </section>

          <section className="flex w-full flex-col gap-6 text-sm font-medium text-contrast">
            <div className="flex flex-col">
              <label htmlFor="title" className={labelClass}>Título</label>

              <input
                type="text"
                id="title"
                name="title"
                required
                value={book.title}
                onChange={(e) => updateField("title", e.target.value)}
                className={stylePattern}
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="creator" className={labelClass}>Autor</label>

              <input
                type="text"
                id="creator"
                name="creator"
                required
                value={book.creator}
                onChange={(e) => updateField("creator", e.target.value)}
                className={stylePattern}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col">
                <label htmlFor="type" className={labelClass}>Tipo</label>

                <select
                  id="type"
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[60%_minmax(0,1fr)]">
              <div className="flex flex-col">
                <label htmlFor="status" className={labelClass}>Status</label>

                <select
                  id="status"
                name="status"
                  value={book.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className={`${stylePattern} cursor-pointer text-center`}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="rating" className={labelClass}>Nota (0–5)</label>

                <input
                  type="number"
                  id="rating"
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
              <label htmlFor="notes" className={labelClass}>Notas</label>

              <textarea
                id="notes"
                name="notes"
                rows={7}
                value={book.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Impressões, trechos marcantes, lembretes..."
                className={`${stylePattern} resize-y align-top`}
              />
            </div>

            <input type="hidden" name="coverUrl" value={book.coverUrl} />

            {submitError && (
              <p role="alert" className="text-sm font-normal text-danger">
                {submitError}
              </p>
            )}

            <SubmitButton pendingLabel="Enviando...">
              Adicionar à biblioteca
            </SubmitButton>
          </section>
        </form>
      </div>
    </div>
  );
}
