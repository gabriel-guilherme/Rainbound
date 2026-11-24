"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import type { FileFormat } from "@/generated/prisma/enums";

import type { ReaderTheme } from "./readerTypes";

export const READER_THEMES: { value: ReaderTheme; label: string }[] = [
  { value: "night", label: "Noite" },
  { value: "sepia", label: "Sépia" },
  { value: "light", label: "Claro" },
];

export type ZoomLimits = { min: number; max: number; step: number; label: string };

/*
 * PDF/CBZ: 100% é a página ajustada à tela.
 * EPUB: 100% é o tamanho padrão do texto (18 px).
 */
const ZOOM_LIMITS: Partial<Record<FileFormat, ZoomLimits>> = {
  PDF: { min: 0.5, max: 3, step: 0.25, label: "Zoom" },
  CBZ: { min: 1, max: 3, step: 0.25, label: "Zoom" },
  EPUB: { min: 0.75, max: 2, step: 0.125, label: "Tamanho do texto" },
};

const DEFAULT_LIMITS: ZoomLimits = { min: 1, max: 1, step: 0, label: "Zoom" };

export function getZoomLimits(format: FileFormat) {
  return ZOOM_LIMITS[format] ?? DEFAULT_LIMITS;
}

type StoredSettings = {
  theme: ReaderTheme;
  zoom: Partial<Record<FileFormat, number>>;
  /* Hora no rodapé. */
  showClock: boolean;
  /* Botão de cronômetro e timer no rodapé (components/ReadingSession). */
  showSession: boolean;
};

const DEFAULT_SETTINGS: StoredSettings = {
  theme: "night",
  zoom: {},
  showClock: true,
  showSession: true,
};

/*
 * Preferência de cada navegador (não vai para o banco). Se o
 * localStorage estiver bloqueado, vale só enquanto a página estiver aberta.
 */
const STORAGE_KEY = "rainbound:reader-settings";

let memoryValue: string | null = null;
const listeners = new Set<() => void>();

function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryValue;
  }
}

function writeRaw(value: string) {
  memoryValue = value;

  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Storage bloqueado: fica só em memória. */
  }

  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  /* Outra aba mudou as configurações. */
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function parseSettings(raw: string | null): StoredSettings {
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StoredSettings>;

    const theme = READER_THEMES.some(({ value }) => value === parsed.theme)
      ? (parsed.theme as ReaderTheme)
      : DEFAULT_SETTINGS.theme;

    const zoom =
      typeof parsed.zoom === "object" && parsed.zoom !== null ? parsed.zoom : {};

    return {
      theme,
      zoom,
      showClock: parsed.showClock !== false,
      showSession: parsed.showSession !== false,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function clampZoom(value: number, limits: ZoomLimits) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(Math.max(value, limits.min), limits.max);
}

export function useReaderSettings(format: FileFormat) {
  /* No servidor (e na hidratação) usa o padrão; depois, o salvo. */
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const settings = useMemo(() => parseSettings(raw), [raw]);

  const limits = getZoomLimits(format);
  const zoom = clampZoom(settings.zoom[format] ?? 1, limits);

  const update = useCallback((next: Partial<StoredSettings>) => {
    const current = parseSettings(readRaw());

    writeRaw(
      JSON.stringify({
        theme: next.theme ?? current.theme,
        zoom: { ...current.zoom, ...next.zoom },
        showClock: next.showClock ?? current.showClock,
        showSession: next.showSession ?? current.showSession,
      }),
    );
  }, []);

  const setTheme = useCallback(
    (theme: ReaderTheme) => update({ theme }),
    [update],
  );

  const setZoom = useCallback(
    (value: number) =>
      update({ zoom: { [format]: clampZoom(value, getZoomLimits(format)) } }),
    [format, update],
  );

  const setShowClock = useCallback(
    (showClock: boolean) => update({ showClock }),
    [update],
  );

  const setShowSession = useCallback(
    (showSession: boolean) => update({ showSession }),
    [update],
  );

  return {
    theme: settings.theme,
    zoom,
    limits,
    showClock: settings.showClock,
    showSession: settings.showSession,
    setTheme,
    setZoom,
    setShowClock,
    setShowSession,
  };
}
