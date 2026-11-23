"use client";

import { unstable_rethrow } from "next/navigation";
import { useEffect, useState } from "react";

import { createBook, getMyStorageUsage } from "../actions";
import StorageMeter from "@/components/common/StorageMeter";
import { SubmitButton } from "@/components/common/SubmitButton";

import {
  MAX_PAGE_COUNT,
  parsePageCount,
  statusLabel,
  statusOptions,
  typeOptions,
} from "../types";
import BookSpine from "@/components/common/BookSpine";
import type { ContentType, ReadingStatus } from "@/generated/prisma/enums";
import { getSpineLook } from "@/lib/spine";
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
  pageCount: string;
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
    pageCount: "",
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
      /* Mediana das edições no Open Library: só uma sugestão, editável. */
      pageCount: selectedBook.number_of_pages_median
        ? String(selectedBook.number_of_pages_median)
        : current.pageCount,
      coverUrl: selectedBook.cover_i
        ? `https://covers.openlibrary.org/b/id/${selectedBook.cover_i}-L.jpg`
        : "",
    }));
  }

  /* Espaço usado e limite, mostrados junto do campo de arquivo. */
  const [storage, setStorage] = useState<Awaited<
    ReturnType<typeof getMyStorageUsage>
  > | null>(null);

  useEffect(() => {
    getMyStorageUsage()
      .then(setStorage)
      .catch(() => setStorage(null));
  }, []);

  const [submitError, setSubmitError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  /*
   * O arquivo do livro vai direto do navegador para o storage;
   * a action recebe só o caminho dele.
   */
  async function handleSubmit(formData: FormData) {
    setSubmitError("");
    setUploadStatus("");

    try {
      await createBook(await prepareBookFormData(formData, setUploadStatus));
    } catch (error) {
      unstable_rethrow(error);

      setSubmitError(
        error instanceof UploadError
          ? error.message
          : "Não foi possível adicionar o livro. Tente de novo.",
      );
      setUploadStatus("");
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
        {/*
          * Celular: a busca aberta quebra para uma linha própria, com a
          * largura toda (ao lado do título ela ficaria espremida).
          */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <h1 className="title-shelf min-w-0 text-5xl text-contrast max-sm:flex-1 max-sm:basis-0 sm:text-6xl">
            Colocar na estante
          </h1>

          <OpenLibrarySearch onSelect={handleBookSelect} />
        </div>

        <form
          action={handleSubmit}
          className="grid w-full grid-cols-1 gap-8 md:grid-cols-[40%_minmax(0,1fr)] md:gap-16 lg:gap-24"
        >
          <div className="flex flex-col gap-8">
            <section className="relative mx-auto flex aspect-[3/4] w-full max-w-64 flex-col gap-3 md:mx-0 md:max-w-none">
              <InputBookCover
                src={book.coverUrl || undefined}
                alt={`Capa de ${book.title}`}
              />

              <InputBookFile label="Selecionar arquivo (opcional)" />

              {storage && (
                <StorageMeter used={storage.used} limit={storage.limit} />
              )}

              <p className="text-xs text-contrast/55">
                Vai ler em outro lugar? Cadastre sem arquivo e registre as
                páginas lidas na página do livro.
              </p>
            </section>

            {/* Prévia de como o livro vai aparecer na estante. */}
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest text-contrast/55">
                Na estante
              </p>

              <div
                aria-hidden="true"
                className="shelf-plank flex items-end justify-center gap-1 px-5 pt-8"
              >
                <span className="h-[190px] w-[34px] border border-dashed border-contrast/15" />
                <BookSpine
                  book={{
                    title: book.title || "Sem título",
                    creator: book.creator || null,
                    status: book.status as ReadingStatus,
                    percentage: 0,
                  }}
                  look={getSpineLook(
                    book.title || "rascunho",
                    book.type as ContentType,
                    parsePageCount(book.pageCount),
                  )}
                />
                <span className="h-[215px] w-[46px] border border-dashed border-contrast/15" />
              </div>
            </div>
          </div>

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

              <div className="flex flex-col">
                <label htmlFor="pageCount" className={labelClass}>
                  Número de páginas
                </label>

                <input
                  type="number"
                  id="pageCount"
                  name="pageCount"
                  min="1"
                  max={MAX_PAGE_COUNT}
                  inputMode="numeric"
                  placeholder="Opcional"
                  value={book.pageCount}
                  onChange={(e) => updateField("pageCount", e.target.value)}
                  className={`${stylePattern} text-center`}
                />
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

            <SubmitButton pendingLabel={uploadStatus || "Enviando..."}>
              Colocar na estante
            </SubmitButton>
          </section>
        </form>
      </div>
    </div>
  );
}
