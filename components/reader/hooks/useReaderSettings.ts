"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { saveReaderPreferences } from "@/app/preferences/actions";
import type { FileFormat } from "@/generated/prisma/enums";
import {
  DEFAULT_READER_PREFERENCES,
  EPUB_TEXT_SIZE,
  clampEpubTextSize,
  type ReaderPreferences,
} from "@/lib/preferences/rules";

import type { ReaderTheme } from "../readerTypes";

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
  EPUB: { ...EPUB_TEXT_SIZE, label: "Tamanho do texto" },
};

const DEFAULT_LIMITS: ZoomLimits = { min: 1, max: 1, step: 0, label: "Zoom" };

export function getZoomLimits(format: FileFormat) {
  return ZOOM_LIMITS[format] ?? DEFAULT_LIMITS;
}

/* Espera antes de gravar na conta */
const SAVE_DELAY_MS = 600;

/*
 * O que fica no navegador. Hoje só vale o zoom do PDF e do CBZ (depende
 * da tela); o resto vai para a conta. Os outros campos ficam para quem
 * ainda não salvou nada na conta (ver `fromLocal`).
 */
type LocalSettings = {
  theme: ReaderTheme;
  zoom: Partial<Record<FileFormat, number>>;
  showClock: boolean;
  showSession: boolean;
  showStreak: boolean;
};

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

function parseLocal(raw: string | null): LocalSettings {
  const defaults: LocalSettings = { ...DEFAULT_READER_PREFERENCES, zoom: {} };

  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalSettings>;

    return {
      theme: READER_THEMES.some(({ value }) => value === parsed.theme)
        ? (parsed.theme as ReaderTheme)
        : defaults.theme,
      zoom: typeof parsed.zoom === "object" && parsed.zoom !== null ? parsed.zoom : {},
      showClock: parsed.showClock !== false,
      showSession: parsed.showSession !== false,
      showStreak: parsed.showStreak !== false,
    };
  } catch {
    return defaults;
  }
}

/* Configurações antigas do navegador, para quem ainda não tem na conta. */
function fromLocal(local: LocalSettings): ReaderPreferences {
  return {
    theme: local.theme,
    epubTextSize: clampEpubTextSize(local.zoom.EPUB ?? 1),
    showClock: local.showClock,
    showSession: local.showSession,
    showStreak: local.showStreak,
  };
}

function isDefault(preferences: ReaderPreferences) {
  return (Object.keys(DEFAULT_READER_PREFERENCES) as (keyof ReaderPreferences)[]).every(
    (key) => preferences[key] === DEFAULT_READER_PREFERENCES[key],
  );
}

function clampZoom(value: number, limits: ZoomLimits) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(Math.max(value, limits.min), limits.max);
}

/*
 * Configurações do leitor. Tema, tamanho do texto do EPUB e itens do
 * rodapé seguem a conta (`account`, vindo do servidor; gravados com
 * saveReaderPreferences). O zoom do PDF e do CBZ fica no navegador.
 *
 * Quem ainda não salvou nada na conta (`account` null) continua com o que
 * estava no navegador, e isso sobe para a conta na primeira abertura.
 */
export function useReaderSettings(format: FileFormat, account: ReaderPreferences | null) {
  /* No servidor (e na hidratação) usa o padrão; depois, o salvo. */
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const local = useMemo(() => parseLocal(raw), [raw]);

  /* Mudanças feitas nesta página (a conta só é relida ao abrir o leitor). */
  const [changed, setChanged] = useState<ReaderPreferences | null>(null);
  const synced = changed ?? account ?? fromLocal(local);

  const pendingRef = useRef<ReaderPreferences | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;

    const pending = pendingRef.current;
    pendingRef.current = null;

    if (pending) saveReaderPreferences(pending).catch(console.error);
  }, []);

  /* Ao sair do leitor, grava o que ainda estava esperando. */
  useEffect(() => flush, [flush]);

  /* Primeira vez com conta vazia: sobe as configurações deste navegador. */
  useEffect(() => {
    if (account) return;

    const legacy = fromLocal(parseLocal(readRaw()));

    if (!isDefault(legacy)) saveReaderPreferences(legacy).catch(console.error);
  }, [account]);

  const update = useCallback(
    (next: Partial<ReaderPreferences>) => {
      const value = { ...synced, ...next };

      setChanged(value);
      pendingRef.current = value;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
    },
    [synced, flush],
  );

  const limits = getZoomLimits(format);
  const zoom =
    format === "EPUB"
      ? synced.epubTextSize
      : clampZoom(local.zoom[format] ?? 1, limits);

  const setZoom = useCallback(
    (value: number) => {
      const clamped = clampZoom(value, getZoomLimits(format));

      if (format === "EPUB") {
        update({ epubTextSize: clamped });
        return;
      }

      const current = parseLocal(readRaw());

      writeRaw(JSON.stringify({ ...current, zoom: { ...current.zoom, [format]: clamped } }));
    },
    [format, update],
  );

  return {
    theme: synced.theme,
    zoom,
    limits,
    showClock: synced.showClock,
    showSession: synced.showSession,
    showStreak: synced.showStreak,
    setTheme: (theme: ReaderTheme) => update({ theme }),
    setZoom,
    setShowClock: (showClock: boolean) => update({ showClock }),
    setShowSession: (showSession: boolean) => update({ showSession }),
    setShowStreak: (showStreak: boolean) => update({ showStreak }),
  };
}
