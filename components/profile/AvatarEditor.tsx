"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { updateAvatar } from "@/app/profile/actions";
import {
  AVATAR_COLORS,
  findAvatarColor,
  parseAvatarLetter,
  type Avatar as AvatarData,
} from "@/lib/profile/avatar";

import Avatar from "./Avatar";

type AvatarEditorProps = {
  avatar: AvatarData;
  onClose: () => void;
};

/*
 * Janela para trocar o avatar: uma das 12 cores e uma letra ou número,
 * com a prévia grande e nos tamanhos em que ele aparece. Quem usa monta
 * só enquanto está aberta (sempre começa do avatar salvo).
 */
export default function AvatarEditor({ avatar, onClose }: AvatarEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [colorId, setColorId] = useState(avatar.colorId);
  const [letterInput, setLetterInput] = useState(avatar.letter);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const color = findAvatarColor(colorId) ?? AVATAR_COLORS[0];
  const letter = parseAvatarLetter(letterInput);
  const preview = {
    background: color.background,
    foreground: color.foreground,
    letter: letter ?? avatar.letter,
  };

  function save() {
    setError("");

    startTransition(async () => {
      const result = await updateAvatar({ color: colorId, letter: letterInput });

      if (result.error) {
        setError(result.error);
        return;
      }

      dialogRef.current?.close();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="avatar-editor-title"
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] bg-primary p-0 text-contrast shadow-[8px_8px_0_rgb(0_0_0/0.5)] backdrop:bg-darkest/80"
    >
      <div className="flex items-center justify-between gap-3 border-b border-contrast/10 px-5 py-3.5">
        <h2 id="avatar-editor-title" className="title-shelf text-3xl">
          Seu avatar
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Fechar"
          className="flex size-10 cursor-pointer items-center justify-center text-contrast/70 transition-colors hover:bg-contrast/10 hover:text-contrast"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-6 p-5">
        <div className="flex items-center gap-5">
          <Avatar avatar={preview} size={120} />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="avatar-letter" className="text-xs uppercase tracking-widest text-contrast/75">
              Letra
            </label>
            <input
              id="avatar-letter"
              value={letterInput}
              onChange={(event) => setLetterInput(event.target.value.slice(-2))}
              onFocus={(event) => event.target.select()}
              aria-invalid={!letter}
              autoComplete="off"
              className="h-14 w-18 border border-contrast/20 bg-darkest text-center font-display text-4xl font-extrabold uppercase text-contrast outline-none focus:border-interaction aria-invalid:border-danger"
            />
            <p className="text-xs text-contrast/70">Uma letra ou número.</p>
          </div>

          <div className="ml-auto hidden items-end gap-3 sm:flex" aria-hidden="true">
            <Avatar avatar={preview} size={40} />
            <Avatar avatar={preview} size={32} />
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-xs uppercase tracking-widest text-contrast/75">Cor de fundo</legend>

          <div className="grid grid-cols-6 gap-2">
            {AVATAR_COLORS.map((option) => {
              const isCurrent = option.id === color.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setColorId(option.id)}
                  aria-pressed={isCurrent}
                  aria-label={option.name}
                  title={option.name}
                  className={`h-12 cursor-pointer font-display text-xl font-extrabold transition-transform hover:-translate-y-0.5 ${
                    isCurrent ? "outline-2 outline-offset-3 outline-contrast" : ""
                  }`}
                  style={{ background: option.background, color: option.foreground }}
                >
                  {preview.letter}
                </button>
              );
            })}
          </div>

          <p className="text-sm text-contrast/75">{color.name}</p>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-contrast/10 px-5 py-3.5">
        {error && (
          <p role="alert" className="mr-auto text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="btn-shelf text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!letter || isPending}
          className="btn-shelf bg-danger text-primary hover:bg-contrast disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </dialog>
  );
}
