"use client";

import { Check, CornerDownRight, MapPinned, Pencil, Trash2, X } from "lucide-react";
import { useState, useTransition, type FormEvent, type KeyboardEvent } from "react";

import type { Bookmark, ReaderProgress } from "../readerTypes";

type Position = Pick<
  ReaderProgress,
  "currentPosition" | "percentage" | "locator"
>;

type BookmarksPanelProps = {
  /* Posição atual na tela (null enquanto carrega). */
  current: ReaderProgress | null;
  /* Nome sugerido para um marcador novo (capítulo ou página). */
  suggestedName: string;
  /* Marcador padrão: o progresso salvo. */
  saved: ReaderProgress | null;
  bookmarks: Bookmark[];
  onGo: (locator: string) => void;
  onSaveHere: () => Promise<void>;
  onCreate: (name: string) => Promise<void>;
  onRename: (bookmarkId: number, name: string) => Promise<void>;
  onDelete: (bookmarkId: number) => Promise<void>;
};

/* EPUB: "página" é a posição de ~1024 caracteres, como no rodapé. */
function describePosition(position: Position) {
  return `Página ${position.currentPosition + 1} · ${Math.round(position.percentage)}%`;
}

const iconButtonClass =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center text-contrast/60 transition-colors hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-30";

/*
 * Painel "Marcadores" do leitor. O primeiro é o padrão ("Onde parei"):
 * o progresso salvo, que só avança sozinho; "Salvar aqui" o traz para a
 * página atual, inclusive para trás. Os outros têm nome livre.
 */
export default function BookmarksPanel({
  current,
  suggestedName,
  saved,
  bookmarks,
  onGo,
  onSaveHere,
  onCreate,
  onRename,
  onDelete,
}: BookmarksPanelProps) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isSavedHere = Boolean(
    saved && current && saved.locator === current.locator,
  );

  function run(action: () => Promise<void>, message: string) {
    setError("");

    startTransition(async () => {
      try {
        await action();
      } catch (actionError) {
        console.error(actionError);
        setError(message);
      }
    });
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const finalName = name.trim() || suggestedName;

    run(async () => {
      await onCreate(finalName);
      setName("");
    }, "Não foi possível criar o marcador.");
  }

  function startEditing(bookmark: Bookmark) {
    setError("");
    setEditingId(bookmark.id);
    setEditName(bookmark.name);
  }

  function handleRename(event: FormEvent<HTMLFormElement>, bookmark: Bookmark) {
    event.preventDefault();

    const finalName = editName.trim();

    /* Vazio ou igual: só fecha a edição. */
    if (!finalName || finalName === bookmark.name) {
      setEditingId(null);
      return;
    }

    run(async () => {
      await onRename(bookmark.id, finalName);
      setEditingId(null);
    }, "Não foi possível renomear o marcador.");
  }

  function handleEditKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-3 p-1">
      <p className="px-2 text-[11px] uppercase tracking-widest text-contrast/50">
        Marcadores
      </p>

      {/* Marcador padrão */}
      <div className="space-y-2 bg-darkest/40 px-2 py-2.5">
        <div className="flex items-center gap-2">
          <MapPinned size={16} aria-hidden="true" className="shrink-0 text-danger" />

          <div className="min-w-0 flex-1">
            <p className="text-sm text-contrast">Onde parei</p>
            <p className="text-xs tabular-nums text-contrast/50">
              {saved ? describePosition(saved) : "Nada salvo ainda"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => saved && onGo(saved.locator)}
            disabled={!saved?.locator || isSavedHere}
            aria-label="Ir para onde parei"
            title="Ir para onde parei"
            className={iconButtonClass}
          >
            <CornerDownRight size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => run(onSaveHere, "Não foi possível salvar a posição.")}
          disabled={!current || isSavedHere || isPending}
          className="w-full cursor-pointer border border-contrast/15 px-2 py-1.5 text-xs uppercase tracking-widest text-contrast/75 transition-colors hover:border-contrast/30 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSavedHere ? "Salvo nesta página" : "Salvar aqui"}
        </button>

        <p className="text-[11px] leading-snug text-contrast/40">
          Avança sozinho conforme você lê. Use &quot;Salvar aqui&quot; para
          voltar o salvamento a uma página anterior.
        </p>
      </div>

      {/* Marcadores personalizados */}
      {bookmarks.length > 0 && (
        <ul className="max-h-60 space-y-0.5 overflow-y-auto pr-1">
          {bookmarks.map((bookmark) => {
            const isHere = current?.locator === bookmark.locator;

            if (editingId === bookmark.id) {
              return (
                <li key={bookmark.id} className="px-1 py-1">
                  <form
                    onSubmit={(event) => handleRename(event, bookmark)}
                    className="flex items-center gap-1"
                  >
                    <label htmlFor={`bookmark-name-${bookmark.id}`} className="sr-only">
                      Novo nome de &quot;{bookmark.name}&quot;
                    </label>
                    <input
                      id={`bookmark-name-${bookmark.id}`}
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onFocus={(event) => event.target.select()}
                      maxLength={80}
                      autoFocus
                      className="min-w-0 flex-1 border border-interaction bg-darkest px-2 py-1.5 text-sm text-contrast outline-none max-sm:text-base"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      aria-label="Salvar nome"
                      title="Salvar (Enter)"
                      className={`${iconButtonClass} text-interaction`}
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancelar"
                      title="Cancelar (Esc)"
                      className={iconButtonClass}
                    >
                      <X size={16} />
                    </button>
                  </form>
                </li>
              );
            }

            return (
              <li
                key={bookmark.id}
                className="flex items-center gap-1 px-2 py-1 hover:bg-contrast/5"
              >
                <button
                  type="button"
                  onClick={() => onGo(bookmark.locator)}
                  className="min-w-0 flex-1 cursor-pointer py-1 text-left"
                  title={`Ir para ${bookmark.name}`}
                >
                  <span className="block truncate text-sm text-contrast/85">
                    {bookmark.name}
                  </span>
                  <span className="block text-xs tabular-nums text-contrast/45">
                    {describePosition(bookmark)}
                    {isHere && " · aqui"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => startEditing(bookmark)}
                  disabled={isPending}
                  aria-label={`Editar o nome de "${bookmark.name}"`}
                  title="Editar nome"
                  className={iconButtonClass}
                >
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    run(
                      () => onDelete(bookmark.id),
                      "Não foi possível apagar o marcador.",
                    )
                  }
                  disabled={isPending}
                  aria-label={`Apagar "${bookmark.name}"`}
                  title="Apagar"
                  className={`${iconButtonClass} hover:text-danger`}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Novo marcador na posição atual */}
      <form onSubmit={handleCreate} className="flex gap-1.5 px-1">
        <label htmlFor="reader-bookmark-name" className="sr-only">
          Nome do novo marcador
        </label>

        <input
          id="reader-bookmark-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={suggestedName}
          maxLength={80}
          className="min-w-0 flex-1 border border-contrast/15 bg-darkest px-2 py-1.5 text-sm text-contrast outline-none placeholder:text-contrast/35 focus:border-interaction max-sm:text-base"
        />

        <button
          type="submit"
          disabled={!current || isPending}
          className="shrink-0 cursor-pointer bg-contrast px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary transition-colors hover:bg-danger disabled:cursor-not-allowed disabled:opacity-40"
        >
          Marcar
        </button>
      </form>

      {error && (
        <p role="alert" className="px-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
