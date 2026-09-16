"use client";

import { updateBook } from "@/app/library/[id]/actions";
import { statusLabel } from "@/app/library/types";
import InputBookCover from "@/components/forms/InputBookCover";
import ProgressBar from "@/components/ProgressBar";
import InputBookFile from "./InputBookFile";

const stylePattern =
  "shadow shadow-black/75 opacity-30 hover:opacity-70 focus:opacity-70 bg-contrast round rounded-lg border border-gray 300 px-3 py-2 text-primary outline-none focus:border-gray-900";

type EditBookFormProps = {
  book: {
    id: number;
    title: string;
    author: string;
    status: string;
    rating: number | null;
    currentPage: number;
    totalPages: number | null;
    notes: string | null;
    coverUrl: string | null;
  };
};

export default function EditBookForm({ book }: EditBookFormProps) {
  const progress =
    book.totalPages && book.totalPages > 0
      ? ((book.currentPage / book.totalPages) * 100).toFixed(2)
      : null;

  return (
    <form
      action={updateBook}
      onBlur={(e) => {
        const target = e.target as HTMLElement;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
          const form = e.currentTarget;
          const formData = new FormData(form);
          updateBook(formData);
        }
      }}
      className="grid w-full grid-cols-1 gap-8 md:grid-cols-[40%_minmax(0,1fr)] md:gap-30"
    >
      <input type="hidden" name="id" value={book.id} />

      {/* Coluna da Esquerda */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col">
          <input
            type="text"
            name="title"
            defaultValue={book.title}
            aria-label="Título"
            required
            className="border-0 bg-transparent px-0 text-2xl font-bold text-contrast shadow-none outline-none focus:opacity-70"
          />
          <input
            type="text"
            name="author"
            defaultValue={book.author}
            aria-label="Autor"
            required
            className="border-0 bg-transparent px-0 text-sm text-contrast/70 shadow-none outline-none focus:opacity-70"
          />
        </div>

        <div className="flex flex-col gap-3 relative mx-auto aspect-[3/4] w-full max-w-64 md:mx-0 md:max-w-none">
          <InputBookCover
            src={book.coverUrl ? book.coverUrl : ""}
            alt={`Capa de ${book.title}`}
          />
          <InputBookFile />
        </div>
      </section>

      {/* Coluna da Direita */}
      <div className="w-full flex flex-col justify-center">
        <div className="flex w-full flex-col gap-6 text-sm font-medium text-contrast">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_15%_15%_15%]">
            <div className="flex flex-col">
              <label>Status</label>
              <select
                name="status"
                defaultValue={book.status}
                onChange={(e) => {
                  const form = e.currentTarget.form;
                  if (form) {
                    const formData = new FormData(form);
                    updateBook(formData);
                  }
                }}
                className={`${stylePattern} cursor-pointer text-center`}
              >
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label>Nota</label>
              <input
                type="number"
                name="rating"
                defaultValue={book.rating ?? 0}
                min={0}
                max={5}
                className={`${stylePattern} text-center`}
              />
            </div>

            <div className="flex flex-col">
              <label>Pág. Lidas</label>
              <input
                type="number"
                name="currentPage"
                defaultValue={book.currentPage}
                min={0}
                max={book.totalPages ?? undefined}
                className={`${stylePattern} text-center`}
              />
            </div>

            <div className="flex flex-col">
              <label>Qtd. Páginas</label>
              <input
                type="number"
                name="totalPages"
                defaultValue={book.totalPages ?? 0}
                min={0}
                className={`${stylePattern} text-center`}
              />
            </div>
          </div>

          {progress !== null && (
            <ProgressBar
              currentPage={book.currentPage}
              totalPages={book.totalPages}
            />
          )}

          <div className="flex flex-col">
            <label>Notas</label>
            <textarea
              name="notes"
              defaultValue={book.notes ?? ""}
              rows={7}
              className={`${stylePattern} resize-y align-top`}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
