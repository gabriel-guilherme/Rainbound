"use client";

import { useState, useTransition } from "react";

import { updateBook } from "@/app/(main)/library/[id]/actions";
import {
  statusLabel,
  statusOptions,
  typeOptions,
} from "@/app/(main)/library/types";
import type {
  ContentType,
  FileFormat,
  ReadingStatus,
} from "@/generated/prisma/enums";
import InputBookCover from "@/components/forms/InputBookCover";
import InputBookFile from "./InputBookFile";
import { prepareBookFormData, UploadError } from "@/lib/clientUpload";
import { fieldClass as stylePattern, labelClass } from "./fieldStyles";

type EditBookFormProps = {
  book: {
    id: number;
    title: string;
    creator: string | null;
    type: ContentType;
    format: FileFormat;
    status: ReadingStatus;
    rating: number | null;
    notes: string | null;
    coverUrl: string | null;
  };
};

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT_SAVE_ERROR = "Não foi possível salvar. Tente de novo.";

const saveStateLabel: Record<SaveState, string> = {
  idle: "As alterações são salvas automaticamente",
  saving: "Salvando...",
  saved: "Alterações salvas",
  error: DEFAULT_SAVE_ERROR,
};

export default function EditBookForm({ book }: EditBookFormProps) {
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState(DEFAULT_SAVE_ERROR);
  const [, startTransition] = useTransition();

  function save(form: HTMLFormElement | null) {
    if (!form) {
      return;
    }

    const formData = new FormData(form);

    /*
     * Capa e arquivo já foram enviados neste FormData; limpa os inputs
     * para não reenviar os mesmos arquivos a cada campo salvo depois.
     */
    form
      .querySelectorAll<HTMLInputElement>('input[type="file"]')
      .forEach((input) => {
        input.value = "";
      });

    setSaveState("saving");

    startTransition(async () => {
      try {
        await updateBook(await prepareBookFormData(formData));
        setSaveState("saved");
      } catch (error) {
        setSaveError(
          error instanceof UploadError ? error.message : DEFAULT_SAVE_ERROR,
        );
        setSaveState("error");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        /* Enter em um campo salva pelo mesmo caminho do salvamento automático. */
        e.preventDefault();
        save(e.currentTarget);
      }}
      onBlur={(e) => {
        const target = e.target as unknown as HTMLInputElement;

        /*
         * Campos de texto salvam ao perder o foco. Selects e arquivos
         * salvam no onChange (ver abaixo).
         */
        if (
          (target.tagName === "INPUT" && target.type !== "file") ||
          target.tagName === "TEXTAREA"
        ) {
          save(e.currentTarget);
        }
      }}
      className="grid w-full grid-cols-1 gap-8 md:grid-cols-[40%_minmax(0,1fr)] md:gap-16 lg:gap-24"
    >
      <input type="hidden" name="id" value={book.id} />

      {/* Coluna da esquerda */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <input
            type="text"
            name="title"
            defaultValue={book.title}
            aria-label="Título"
            required
            className="title-shelf -mx-2 border border-transparent bg-transparent px-2 text-5xl text-contrast outline-none transition-colors hover:border-contrast/15 focus:border-interaction"
          />

          <input
            type="text"
            name="creator"
            defaultValue={book.creator ?? ""}
            aria-label="Autor"
            placeholder="Autor"
            required
            className="-mx-2 border border-transparent bg-transparent px-2 text-base text-contrast/70 outline-none transition-colors placeholder:text-contrast/35 hover:border-contrast/15 focus:border-interaction"
          />
        </div>

        <div className="relative mx-auto flex aspect-[3/4] w-full max-w-64 flex-col gap-3 md:mx-0 md:max-w-none">
          <InputBookCover
            src={book.coverUrl ?? ""}
            alt={`Capa de ${book.title}`}
            onFileSelected={(input) => save(input.form)}
          />

          <InputBookFile
            label={`Substituir arquivo (${book.format})`}
            onFileSelected={(input) => save(input.form)}
          />
        </div>
      </section>

      {/* Coluna da direita */}
      <div className="flex w-full flex-col justify-center">
        <div className="flex w-full flex-col gap-6 text-sm font-medium text-contrast">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label htmlFor="type" className={labelClass}>
                Tipo
              </label>

              <select
                id="type"
                name="type"
                defaultValue={book.type}
                onChange={(e) => save(e.currentTarget.form)}
                className={`${stylePattern} cursor-pointer`}
              >
                {typeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_25%]">
            <div className="flex flex-col">
              <label htmlFor="status" className={labelClass}>
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={book.status}
                onChange={(e) => save(e.currentTarget.form)}
                className={`${stylePattern} cursor-pointer`}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="rating" className={labelClass}>
                Nota (0–5)
              </label>

              <input
                id="rating"
                type="number"
                name="rating"
                defaultValue={book.rating ?? 0}
                min={0}
                max={5}
                className={`${stylePattern} text-center`}
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label htmlFor="notes" className={labelClass}>
              Notas
            </label>

            <textarea
              id="notes"
              name="notes"
              defaultValue={book.notes ?? ""}
              rows={7}
              placeholder="Impressões, trechos marcantes, lembretes..."
              className={`${stylePattern} resize-y align-top font-reading text-lg italic`}
            />
          </div>

          <p
            role="status"
            aria-live="polite"
            className={`text-xs font-normal ${
              saveState === "error" ? "text-danger" : "text-contrast/45"
            }`}
          >
            {saveState === "error" ? saveError : saveStateLabel[saveState]}
          </p>
        </div>
      </div>
    </form>
  );
}
