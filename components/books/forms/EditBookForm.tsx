"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useRef, useState, useTransition, type ReactNode } from "react";

import { removeBookFile, updateBook } from "@/app/(main)/library/[id]/actions";
import {
  BOOK_TABS as TABS,
  statusColor,
  statusLabel,
  statusOptions,
  typeLabel,
  typeOptions,
  type BookTabId as TabId,
} from "@/app/(main)/library/types";
import type {
  ContentType,
  FileFormat,
  ReadingStatus,
} from "@/generated/prisma/enums";
import InputBookCover from "@/components/books/forms/InputBookCover";
import InputBookFile from "./InputBookFile";
import { formatStorageSize } from "@/lib/bookFiles";
import { prepareBookFormData, UploadError } from "@/lib/clientUpload";
import { fieldClass as stylePattern, labelClass } from "@/components/common/fieldStyles";

/*
 * Página do livro em abas: cabeçalho (capa, título, autor, resumo e
 * status) e as abas Leitura / Detalhes / Notas.
 *
 * Tudo fica num único <form> com salvamento automático; as abas só
 * escondem os painéis (`hidden`), então todos os campos continuam no
 * FormData. A aba Leitura recebe o conteúdo pronto em `readingPanel`
 * (sem <form> próprio, já que formulários não podem ser aninhados) e
 * seus campos não têm `name`, então não entram no salvamento daqui.
 */

type EditBookFormProps = {
  book: {
    id: number;
    title: string;
    creator: string | null;
    type: ContentType;
    format: FileFormat | null;
    status: ReadingStatus;
    rating: number | null;
    notes: string | null;
    coverUrl: string | null;
    filePath: string | null;
    fileSize: number | null;
  };
  readingPanel: ReactNode;
  initialTab?: TabId;
};

type SaveState = "idle" | "saving" | "saved" | "error";


const DEFAULT_SAVE_ERROR = "Não foi possível salvar. Tente de novo.";

const saveStateLabel: Record<SaveState, string> = {
  idle: "As alterações são salvas automaticamente",
  saving: "Salvando...",
  saved: "Alterações salvas",
  error: DEFAULT_SAVE_ERROR,
};

function ratingStars(rating: number | null) {
  if (!rating) {
    return null;
  }

  const value = Math.min(Math.max(Math.round(rating), 0), 5);

  return "★".repeat(value) + "☆".repeat(5 - value);
}

export default function EditBookForm({
  book,
  readingPanel,
  initialTab = "reading",
}: EditBookFormProps) {
  const [tab, setTabState] = useState<TabId>(initialTab);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState(DEFAULT_SAVE_ERROR);
  const [savingLabel, setSavingLabel] = useState("");
  const [, startTransition] = useTransition();
  const [isRemovingFile, startRemovingFile] = useTransition();
  const [removeFileError, setRemoveFileError] = useState("");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    reading: null,
    details: null,
    notes: null,
  });

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
    setSavingLabel("");

    startTransition(async () => {
      try {
        await updateBook(await prepareBookFormData(formData, setSavingLabel));
        setSaveState("saved");
      } catch (error) {
        setSaveError(
          error instanceof UploadError ? error.message : DEFAULT_SAVE_ERROR,
        );
        setSaveState("error");
      }
    });
  }

  /*
   * Troca a aba e grava em `?aba=` (sem nova navegação), para o recarregar
   * e o voltar do navegador abrirem na mesma aba.
   */
  function setTab(next: TabId) {
    setTabState(next);

    const url = new URL(window.location.href);
    url.searchParams.set(
      "aba",
      TABS.find((item) => item.id === next)?.param ?? "leitura",
    );
    window.history.replaceState(null, "", url);
  }

  /* Setas e Home/End movem entre as abas (padrão de tablist). */
  function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const index = TABS.findIndex((item) => item.id === tab);
    const last = TABS.length - 1;
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % TABS.length
        : event.key === "ArrowLeft"
          ? (index - 1 + TABS.length) % TABS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : null;

    if (next === null) {
      return;
    }

    event.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  }

  /* Apaga só o arquivo; o livro continua na estante. */
  function handleRemoveFile() {
    const message =
      "Remover o arquivo deste livro? O livro continua na estante com o " +
      "status, as notas e o progresso, mas não poderá mais ser lido no site " +
      "(os marcadores também saem).";

    if (!confirm(message)) {
      return;
    }

    setRemoveFileError("");

    startRemovingFile(async () => {
      try {
        await removeBookFile(book.id);
      } catch {
        setRemoveFileError("Não foi possível remover o arquivo. Tente de novo.");
      }
    });
  }

  const stars = ratingStars(book.rating);

  const saveStatus = (
    <p
      role="status"
      aria-live="polite"
      className={`text-xs font-normal ${
        saveState === "error" ? "text-danger" : "text-contrast/45"
      }`}
    >
      {saveState === "error"
        ? saveError
        : saveState === "saving" && savingLabel
          ? savingLabel
          : saveStateLabel[saveState]}
    </p>
  );

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
         * salvam no onChange (ver abaixo). Campos sem `name` (registro
         * de leitura) não fazem parte deste formulário.
         */
        if (
          target.name &&
          ((target.tagName === "INPUT" && target.type !== "file") ||
            target.tagName === "TEXTAREA")
        ) {
          save(e.currentTarget);
        }
      }}
      className="flex w-full flex-col gap-8"
    >
      <input type="hidden" name="id" value={book.id} />

      {/* Cabeçalho */}
      <header className="grid grid-cols-[100px_minmax(0,1fr)] items-end gap-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-8">
        <div className="relative flex aspect-[3/4] w-full flex-col shadow-[5px_5px_0_rgb(0_0_0/0.45)]">
          <InputBookCover
            src={book.coverUrl ?? ""}
            alt={`Capa de ${book.title}`}
            onFileSelected={(input) => save(input.form)}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
          <input
            type="text"
            name="title"
            defaultValue={book.title}
            aria-label="Título"
            required
            className="title-shelf -mx-2 min-w-0 border border-transparent bg-transparent px-2 text-4xl text-contrast outline-none transition-colors hover:border-contrast/15 focus:border-interaction sm:text-6xl lg:text-7xl"
          />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-contrast/70 sm:text-[15px]">
            <input
              type="text"
              name="creator"
              defaultValue={book.creator ?? ""}
              aria-label="Autor"
              placeholder="Autor"
              required
              size={Math.max((book.creator ?? "").length, 6)}
              className="-mx-2 max-w-full border border-transparent bg-transparent px-2 py-0.5 text-contrast/70 outline-none transition-colors placeholder:text-contrast/35 hover:border-contrast/15 focus:border-interaction"
            />

            <span aria-hidden="true">·</span>
            <span>{typeLabel[book.type]}</span>

            {stars && (
              <>
                <span aria-hidden="true">·</span>
                <span aria-label={`Nota ${book.rating} de 5`}>{stars}</span>
              </>
            )}

            <span className="inline-flex items-center gap-1.5 bg-secondary px-2 py-1 text-xs font-medium text-contrast">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${statusColor[book.status]}`}
              />
              {statusLabel[book.status]}
            </span>

            {book.filePath && (
              <Link
                href={`/read/${book.id}`}
                className="btn-shelf ml-auto bg-danger text-primary hover:bg-contrast max-sm:w-full"
              >
                <BookOpen size={18} aria-hidden="true" />
                Ler agora
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Abas */}
      <div
        role="tablist"
        aria-label="Seções do livro"
        className="flex border-b border-contrast/15 sm:gap-1"
      >
        {TABS.map((item) => {
          const selected = tab === item.id;

          return (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[item.id] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(item.id)}
              onKeyDown={handleTabKeyDown}
              className={`title-shelf -mb-px flex-1 border-b-[3px] px-0 py-3 text-xl transition-colors sm:flex-none sm:px-6 sm:text-2xl ${
                selected
                  ? "border-danger text-contrast"
                  : "border-transparent text-contrast/55 hover:text-contrast"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Leitura */}
      <div
        role="tabpanel"
        id="panel-reading"
        aria-labelledby="tab-reading"
        hidden={tab !== "reading"}
      >
        {readingPanel}
      </div>

      {/* Detalhes */}
      <div
        role="tabpanel"
        id="panel-details"
        aria-labelledby="tab-details"
        hidden={tab !== "details"}
        className="mx-auto w-full max-w-3xl"
      >
        <div className="flex flex-col gap-6 text-sm font-medium text-contrast">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

            <div className="flex flex-col">
              <label htmlFor="status" className={labelClass}>
                Status
              </label>

              {/*
                * A chave recria o select quando o status muda por fora
                * (registro de leitura), para ele não regravar o antigo.
                */}
              <select
                key={book.status}
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
            <span className={labelClass}>Arquivo</span>

            <InputBookFile
              label={
                book.format
                  ? `Substituir arquivo (${book.format})`
                  : "Adicionar arquivo para ler no site"
              }
              onFileSelected={(input) => save(input.form)}
            />

            {book.filePath && (
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isRemovingFile}
                  className="text-sm text-danger underline-offset-4 hover:underline disabled:cursor-wait disabled:opacity-60"
                >
                  {isRemovingFile ? "Removendo..." : "Remover arquivo"}
                </button>

                <span className="text-xs font-normal text-contrast/50">
                  {book.fileSize
                    ? `Libera ${formatStorageSize(book.fileSize)} do seu espaço. `
                    : "Libera espaço. "}
                  O livro fica na estante com status e progresso.
                </span>
              </div>
            )}

            {removeFileError && (
              <p role="alert" className="mt-2 text-xs font-normal text-danger">
                {removeFileError}
              </p>
            )}
          </div>

          {saveStatus}
        </div>
      </div>

      {/* Notas */}
      <div
        role="tabpanel"
        id="panel-notes"
        aria-labelledby="tab-notes"
        hidden={tab !== "notes"}
        className="mx-auto w-full max-w-3xl"
      >
        <div className="flex flex-col gap-3 text-sm font-medium text-contrast">
          <label htmlFor="notes" className="sr-only">
            Notas
          </label>

          <textarea
            id="notes"
            name="notes"
            defaultValue={book.notes ?? ""}
            rows={12}
            placeholder="Impressões, trechos marcantes, lembretes..."
            className={`${stylePattern} resize-y align-top font-reading text-lg italic`}
          />

          {saveStatus}
        </div>
      </div>
    </form>
  );
}
