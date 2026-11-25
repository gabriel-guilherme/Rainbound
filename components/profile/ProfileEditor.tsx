"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { updateProfile } from "@/app/profile/actions";
import SettingSwitch from "@/components/common/SettingSwitch";
import type { Avatar as AvatarData } from "@/lib/profile/avatar";
import { MAX_BIO_LENGTH, parseBio } from "@/lib/profile/rules";

import Avatar from "./Avatar";
import AvatarEditor from "./AvatarEditor";

type ProfileEditorProps = {
  avatar: AvatarData;
  bio: string | null;
  isPublic: boolean;
};

/*
 * "Editar perfil" no próprio perfil: avatar (abre o AvatarEditor), frase
 * de apresentação e público ou privado.
 */
export default function ProfileEditor({ avatar, bio, isPublic }: ProfileEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn-shelf cursor-pointer bg-darkest/25 text-current hover:bg-darkest/45"
      >
        Editar perfil
      </button>

      {isOpen && (
        <ProfileDialog
          avatar={avatar}
          bio={bio}
          isPublic={isPublic}
          onEditAvatar={() => setIsEditingAvatar(true)}
          onClose={() => setIsOpen(false)}
        />
      )}

      {isEditingAvatar && (
        <AvatarEditor avatar={avatar} onClose={() => setIsEditingAvatar(false)} />
      )}
    </>
  );
}

type ProfileDialogProps = ProfileEditorProps & {
  onEditAvatar: () => void;
  onClose: () => void;
};

/* Montado só enquanto aberto: sempre começa do que está salvo. */
function ProfileDialog({ avatar, bio, isPublic, onEditAvatar, onClose }: ProfileDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [bioInput, setBioInput] = useState(bio ?? "");
  const [isPublicInput, setIsPublicInput] = useState(isPublic);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const isBioValid = parseBio(bioInput) !== undefined;

  function save() {
    setError("");

    startTransition(async () => {
      const result = await updateProfile({ bio: bioInput, isPublic: isPublicInput });

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
      aria-labelledby="profile-editor-title"
      onClose={onClose}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] bg-primary p-0 text-contrast shadow-[8px_8px_0_rgb(0_0_0/0.5)] backdrop:bg-darkest/80"
    >
      <div className="flex items-center justify-between gap-3 border-b border-contrast/10 px-5 py-3.5">
        <h2 id="profile-editor-title" className="title-shelf text-3xl">
          Editar perfil
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
        <div className="flex items-center gap-4">
          <Avatar avatar={avatar} size={64} />
          <button
            type="button"
            onClick={onEditAvatar}
            className="btn-shelf cursor-pointer text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
          >
            Trocar avatar
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profile-bio" className="text-xs uppercase tracking-widest text-contrast/75">
            Apresentação
          </label>
          <textarea
            id="profile-bio"
            value={bioInput}
            onChange={(event) => setBioInput(event.target.value)}
            rows={3}
            aria-invalid={!isBioValid}
            aria-describedby="profile-bio-count"
            placeholder="Uma frase sobre o que você gosta de ler"
            className="resize-none border border-contrast/20 bg-darkest px-3 py-2 font-reading text-lg italic text-contrast outline-none placeholder:not-italic placeholder:text-contrast/40 focus:border-interaction aria-invalid:border-danger"
          />
          <p
            id="profile-bio-count"
            className={`text-right text-xs tabular-nums ${isBioValid ? "text-contrast/60" : "text-danger"}`}
          >
            {bioInput.trim().length}/{MAX_BIO_LENGTH}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <SettingSwitch
            label="Perfil público"
            checked={isPublicInput}
            onChange={setIsPublicInput}
          />
          <p className="text-xs text-contrast/70">
            {isPublicInput
              ? "Quem entrar no seu perfil vê seus widgets."
              : "Os outros veem só o avatar, o nome e a apresentação."}
          </p>
        </div>
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
          className="btn-shelf cursor-pointer text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!isBioValid || isPending}
          className="btn-shelf cursor-pointer bg-danger text-primary hover:bg-contrast disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </dialog>
  );
}
