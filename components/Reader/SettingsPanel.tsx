"use client";

import { Clock, Minus, Plus, Timer } from "lucide-react";

import type { ReaderTheme } from "./readerTypes";
import SettingSwitch from "./SettingSwitch";
import { READER_THEMES, type ZoomLimits } from "./useReaderSettings";

type SettingsPanelProps = {
  /* Sem motor ou formato sem zoom: o bloco de zoom some. */
  canZoom: boolean;
  zoom: number;
  limits: ZoomLimits;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
  showClock: boolean;
  onShowClockChange: (show: boolean) => void;
  showSession: boolean;
  onShowSessionChange: (show: boolean) => void;
};

const zoomButtonClass =
  "flex size-8 cursor-pointer items-center justify-center text-contrast/70 transition-colors hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-30";

/*
 * Painel "Configurações" do cabeçalho do leitor: zoom (PDF/CBZ) ou tamanho
 * do texto (EPUB), tema e o que mostrar no rodapé. Tudo vem de
 * useReaderSettings (salvo por navegador).
 */
export default function SettingsPanel({
  canZoom,
  zoom,
  limits,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  theme,
  onThemeChange,
  showClock,
  onShowClockChange,
  showSession,
  onShowSessionChange,
}: SettingsPanelProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="space-y-3 p-1">
      <p className="px-2 text-[11px] uppercase tracking-widest text-contrast/50">
        Configurações
      </p>

      {canZoom && (
        <div className="space-y-1.5 px-2">
          <p className="text-sm text-contrast/75">{limits.label}</p>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onZoomOut}
              disabled={zoom <= limits.min}
              aria-label={`Diminuir ${limits.label.toLowerCase()}`}
              title="Diminuir (−)"
              className={zoomButtonClass}
            >
              <Minus size={16} />
            </button>

            <button
              type="button"
              onClick={onResetZoom}
              disabled={zoom === 1}
              title="Voltar ao padrão (0)"
              aria-label={`${limits.label}: ${zoomPercent}%. Voltar ao padrão`}
              className="min-w-16 cursor-pointer px-2 py-1 text-center text-sm tabular-nums text-contrast transition-colors hover:bg-contrast/10 disabled:cursor-default disabled:hover:bg-transparent"
            >
              <span aria-live="polite">{zoomPercent}%</span>
            </button>

            <button
              type="button"
              onClick={onZoomIn}
              disabled={zoom >= limits.max}
              aria-label={`Aumentar ${limits.label.toLowerCase()}`}
              title="Aumentar (+)"
              className={zoomButtonClass}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      <fieldset className="space-y-1.5 px-2">
        <legend className="pb-1.5 text-sm text-contrast/75">Tema</legend>

        <div className="grid grid-cols-3 gap-1">
          {READER_THEMES.map((option) => {
            const isCurrent = option.value === theme;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onThemeChange(option.value)}
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

      <fieldset className="space-y-0.5 border-t border-contrast/10 px-2 pt-3">
        <legend className="sr-only">Mostrar no leitor</legend>
        <p aria-hidden="true" className="pb-1 text-sm text-contrast/75">
          Mostrar no leitor
        </p>

        <SettingSwitch
          label="Relógio"
          icon={<Clock size={16} />}
          checked={showClock}
          onChange={onShowClockChange}
        />
        <SettingSwitch
          label="Cronômetro e timer"
          icon={<Timer size={16} />}
          checked={showSession}
          onChange={onShowSessionChange}
        />
      </fieldset>
    </div>
  );
}
