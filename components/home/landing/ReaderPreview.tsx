"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  CloudRainWind,
  Expand,
  ListOrdered,
  Settings,
  Timer,
} from "lucide-react";

import { READER_THEMES } from "@/components/reader/hooks/useReaderSettings";
import type { ReaderTheme } from "@/components/reader/readerTypes";
import StreakRing from "@/components/reading-streak/StreakRing";

const iconClass = "flex size-10 items-center justify-center text-contrast/80";

/*
 * Leitor de exemplo com o mesmo cabeçalho, setas e rodapé do de verdade
 * (components/reader). O painel de Configurações troca o tema da prévia.
 */
export default function ReaderPreview() {
  const [theme, setTheme] = useState<ReaderTheme>("sepia");
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  return (
    <div className="relative pb-10 sm:pb-12">
      <div
        data-reader-theme={theme}
        className="flex flex-col bg-darkest font-sans text-contrast shadow-[0_30px_60px_-24px_rgb(0_0_0)] transition-colors"
      >
        <div className="relative flex h-14 shrink-0 items-center justify-between border-b border-contrast/10 px-2 shadow-[var(--reader-header-shadow,0_3px_0_-1px_rgb(0_0_0/0.35),0_12px_26px_-8px_rgb(0_0_0/0.8))] sm:h-16 sm:px-4">
          <div aria-hidden="true" className="flex items-center gap-1">
            <span className={iconClass}>
              <ArrowLeft size={20} />
            </span>
            <span className={`${iconClass} text-contrast/60 max-sm:hidden`}>
              <CloudRainWind size={20} />
            </span>
          </div>

          <p className="title-shelf min-w-0 flex-1 truncate px-2 text-center text-lg text-contrast/85 sm:absolute sm:left-1/2 sm:top-1/2 sm:max-w-[45%] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:px-0 sm:text-2xl">
            Dom Casmurro
          </p>

          <div className="flex items-center">
            <span aria-hidden="true" className={`${iconClass} max-sm:hidden`}>
              <ListOrdered size={18} />
            </span>
            <span aria-hidden="true" className={`${iconClass} max-sm:hidden`}>
              <Bookmark size={18} />
            </span>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen((open) => !open)}
                aria-label="Configurações do leitor de exemplo"
                aria-expanded={isSettingsOpen}
                className={`${iconClass} cursor-pointer transition-colors hover:bg-contrast/10 hover:text-contrast ${
                  isSettingsOpen ? "bg-contrast/10 text-contrast" : ""
                }`}
              >
                <Settings size={18} />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 top-full z-10 mt-2 w-56 border border-contrast/10 bg-primary p-3 shadow-[6px_6px_0_rgb(0_0_0/0.45)]">
                  <fieldset className="space-y-1.5">
                    <legend className="pb-1.5 text-sm text-contrast/75">Tema</legend>

                    <div className="grid grid-cols-3 gap-1">
                      {READER_THEMES.map((option) => {
                        const isCurrent = option.value === theme;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setTheme(option.value)}
                            aria-pressed={isCurrent}
                            className={[
                              "flex cursor-pointer flex-col items-center gap-1 px-1 py-2 text-xs transition-colors",
                              isCurrent
                                ? "bg-contrast text-primary"
                                : "text-contrast/75 hover:bg-contrast/10 hover:text-contrast",
                            ].join(" ")}
                          >
                            <span
                              aria-hidden="true"
                              data-reader-theme={option.value}
                              className="reader-theme-swatch size-5 border border-current/30"
                            />
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              )}
            </div>

            <span aria-hidden="true" className={iconClass}>
              <Expand size={18} strokeWidth={1.8} />
            </span>
          </div>
        </div>

        <div aria-hidden="true" className="flex items-stretch">
          <span className="flex w-7 shrink-0 items-center justify-center text-contrast/40 sm:w-auto sm:p-2">
            <ChevronLeft strokeWidth={1.5} className="size-6 sm:size-10" />
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-3.5 py-7 font-reading text-[17px] leading-relaxed sm:py-9 sm:text-[19px]">
            <p className="title-shelf text-xl tracking-wide sm:text-2xl">
              Capítulo XXXII · Olhos de ressaca
            </p>
            <p className="indent-6">
              Tudo era matéria às curiosidades de Capitu. Não me acode imagem capaz de dizer, sem
              quebra da dignidade do estilo, o que eles foram e me fizeram.
            </p>
            <p className="hidden indent-6 sm:block">
              Olhos de ressaca? Vá, de ressaca. É o que me dá ideia daquela feição nova. Traziam
              não sei que fluido misterioso e enérgico, uma força que arrastava para dentro.
            </p>
          </div>

          <span className="flex w-7 shrink-0 items-center justify-center text-contrast/40 sm:w-auto sm:p-2">
            <ChevronRight strokeWidth={1.5} className="size-6 sm:size-10" />
          </span>
        </div>

        <div
          aria-hidden="true"
          className="grid h-12 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-t border-contrast/10 px-3 sm:px-4"
        >
          <span className="text-xs text-contrast/55 sm:text-sm">21:42</span>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-center gap-2 tabular-nums">
              <span className="font-display text-sm font-bold uppercase tracking-wide text-contrast/85 sm:text-base">
                Página 112 <span className="text-contrast/40">de</span> 256
              </span>
              <span className="text-xs text-contrast/40">44%</span>
            </div>
            <div className="mx-auto h-0.5 w-full max-w-md bg-contrast/10">
              <div className="h-full w-[44%] bg-danger" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-1">
            <span className="flex h-8 items-center gap-1.5 px-2 text-sm tabular-nums text-contrast/70">
              <StreakRing progress={0.7} met={false} size={22} />
              <span className="max-sm:hidden">14/20 min</span>
            </span>
            <span className="flex h-8 items-center gap-1.5 bg-contrast/10 px-2 text-sm font-semibold tabular-nums text-danger max-sm:hidden">
              <Timer size={16} />
              25:10
            </span>
          </div>
        </div>
      </div>

      <figure
        aria-hidden="true"
        className="absolute -bottom-2 left-4 w-56 -rotate-2 border-t-[6px] border-danger bg-contrast px-4 py-3.5 text-primary shadow-[0_16px_24px_-14px_rgb(0_0_0/0.8)] sm:-left-6 sm:w-64"
      >
        <blockquote className="font-reading text-lg italic leading-snug">
          “Olhos de ressaca... voltar aqui depois.”
        </blockquote>
        <figcaption className="mt-2 font-display text-sm font-extrabold uppercase tracking-wide text-primary/65">
          Nota · p. 112
        </figcaption>
      </figure>
    </div>
  );
}
