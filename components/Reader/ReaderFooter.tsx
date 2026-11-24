"use client";

import CurrentTime from "@/components/ReadingSession/CurrentTime";
import SessionButton from "@/components/ReadingSession/SessionButton";

import type { PageInfo } from "./readerTypes";

type ReaderFooterProps = {
  /* Formato sem motor (ex.: CBR): só as laterais. */
  hasEngine: boolean;
  pageInfo: PageInfo;
  showClock: boolean;
  showSession: boolean;
  /* Modo imersivo do celular: o rodapé some. */
  isImmersive: boolean;
};

/*
 * Rodapé do leitor em três colunas: hora | página atual | Sessão. As
 * laterais têm a mesma largura para a página ficar centralizada; hora e
 * Sessão somem pelas Configurações.
 */
export default function ReaderFooter({
  hasEngine,
  pageInfo,
  showClock,
  showSession,
  isImmersive,
}: ReaderFooterProps) {
  const { currentPage, totalPages, progress } = pageInfo;

  return (
    <footer
      className={[
        "reader-footer grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,28rem)_minmax(0,1fr)] items-center gap-2 border-t border-contrast/10 px-3 sm:px-4",
        isImmersive ? "max-sm:hidden" : "",
      ].join(" ")}
    >
      <div className="flex justify-start">
        {showClock && (
          <CurrentTime className="text-xs text-contrast/55 sm:text-sm" />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1.5">
        {hasEngine && totalPages === 0 && (
          <span className="text-center text-xs text-contrast/40">
            Carregando...
          </span>
        )}

        {hasEngine && totalPages > 0 && (
          <>
            {/* EPUB: "página" é uma posição de ~1024 caracteres (estável com o zoom). */}
            <div className="flex items-baseline justify-center gap-2 tabular-nums">
              <span className="font-display text-base font-bold uppercase tracking-wide text-contrast/85">
                Página {currentPage}{" "}
                <span className="text-contrast/40">de</span> {totalPages}
              </span>
              <span className="text-xs text-contrast/40">{progress}%</span>
            </div>

            <div
              aria-hidden="true"
              className="mx-auto h-0.5 w-full max-w-md overflow-hidden bg-contrast/10"
            >
              <div
                className="h-full bg-danger transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        {showSession && <SessionButton />}
      </div>
    </footer>
  );
}
