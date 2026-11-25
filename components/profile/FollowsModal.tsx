"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type FollowsModalProps = {
  title: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
};

/*
 * Modal das listas de seguidores e seguindo, por cima do perfil. Aberto
 * pela rota interceptada (app/(main)/u/[username]/@modal); fechar (X, Esc
 * ou clique fora) volta no histórico, para o endereço do perfil.
 */
export default function FollowsModal({ title, tabs, children }: FollowsModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Seguidores e seguindo"
      onCancel={(event) => {
        event.preventDefault();
        router.back();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) router.back();
      }}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] bg-primary p-0 text-contrast shadow-[8px_8px_0_rgb(0_0_0/0.5)] backdrop:bg-darkest/80 max-sm:h-dvh max-sm:max-h-none max-sm:w-screen max-sm:max-w-none"
    >
      <div className="flex h-full max-h-[80dvh] flex-col max-sm:max-h-none">
        <div className="flex items-center justify-between gap-3 border-b border-contrast/10 px-4 py-3 sm:px-5">
          <h2 className="title-shelf min-w-0 text-2xl">{title}</h2>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Fechar"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center text-contrast/70 transition-colors hover:bg-contrast/10 hover:text-contrast"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-contrast/10 px-4 py-3 sm:px-5">{tabs}</div>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </dialog>
  );
}
