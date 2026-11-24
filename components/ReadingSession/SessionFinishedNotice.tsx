"use client";

import { Timer } from "lucide-react";

import { useReadingSession } from "./useReadingSession";

type SessionFinishedNoticeProps = {
  /* Posição (ex.: fixo no topo do leitor, ou dentro do widget). */
  className?: string;
};

const EXTRA_MINUTES = 5;

/*
 * Aviso de fim do timer: só na tela, sem som. Fica até a pessoa fechar
 * ou pedir mais alguns minutos.
 */
export default function SessionFinishedNotice({ className = "" }: SessionFinishedNoticeProps) {
  const { state, extend, dismissFinished } = useReadingSession();

  if (state.finishedAt === null) {
    return null;
  }

  return (
    <div
      role="status"
      className={[
        "grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3.5 gap-y-1 border border-contrast/15 bg-primary px-4 py-3.5 shadow-[6px_6px_0_rgb(0_0_0/0.45)]",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="row-span-2 flex size-9 items-center justify-center bg-danger/15 text-danger"
      >
        <Timer size={20} />
      </span>

      <p className="title-shelf text-xl text-contrast">Tempo de leitura encerrado</p>
      <p className="text-sm text-contrast/70">Que tal uma pausa?</p>

      <div className="col-start-2 mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => extend(EXTRA_MINUTES)}
          className="btn-shelf bg-contrast px-3.5 py-1.5 text-[15px] text-primary hover:bg-danger"
        >
          Mais {EXTRA_MINUTES} min
        </button>
        <button
          type="button"
          onClick={dismissFinished}
          className="btn-shelf px-3.5 py-1.5 text-[15px] text-contrast/80 ring-1 ring-inset ring-contrast/20 hover:bg-contrast/10"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
