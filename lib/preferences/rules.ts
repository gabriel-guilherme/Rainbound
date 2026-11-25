import {
  isLibraryView,
  sortOptions,
  type LibraryView,
  type SortOption,
} from "../books/library";

/*
 * Preferências que seguem a conta (User.preferences, JSON): leitor e
 * estante. Funções puras, usadas no servidor (lib/preferences/server.ts)
 * e no navegador. Tudo que vem do banco ou do navegador passa por aqui:
 * valor inválido vira o padrão.
 *
 * Ficam no aparelho, de propósito: o zoom do PDF e do CBZ (depende da
 * tela) e a arrumação dos widgets (lib/dashboardLayout.ts).
 */

export const READER_THEME_VALUES = ["night", "sepia", "light"] as const;

export type ReaderThemeValue = (typeof READER_THEME_VALUES)[number];

/* Tamanho do texto do EPUB: 1 = 18 px. */
export const EPUB_TEXT_SIZE = { min: 0.75, max: 2, step: 0.125 } as const;

export type ReaderPreferences = {
  theme: ReaderThemeValue;
  epubTextSize: number;
  /* Hora no rodapé. */
  showClock: boolean;
  /* Botão de cronômetro e timer no rodapé. */
  showSession: boolean;
  /* Sequência de leitura no rodapé. */
  showStreak: boolean;
};

export type LibraryPreferences = {
  view: LibraryView;
  sort: SortOption;
};

export type UserPreferences = {
  /* null: nunca salvou (o leitor usa o que estiver no navegador). */
  reader: ReaderPreferences | null;
  library: LibraryPreferences;
};

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  theme: "night",
  epubTextSize: 1,
  showClock: true,
  showSession: true,
  showStreak: true,
};

export const DEFAULT_LIBRARY_PREFERENCES: LibraryPreferences = {
  view: "spines",
  sort: "added_desc",
};

export function isReaderTheme(value: unknown): value is ReaderThemeValue {
  return READER_THEME_VALUES.includes(value as ReaderThemeValue);
}

export function isSortOption(value: unknown): value is SortOption {
  return sortOptions.some((option) => option.value === value);
}

export function clampEpubTextSize(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_READER_PREFERENCES.epubTextSize;
  }

  return Math.min(Math.max(value, EPUB_TEXT_SIZE.min), EPUB_TEXT_SIZE.max);
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/* Preferências do leitor; campo inválido vira o padrão. Sem objeto: null. */
export function parseReaderPreferences(value: unknown): ReaderPreferences | null {
  const object = asObject(value);

  if (!object) return null;

  const flag = (key: keyof ReaderPreferences) =>
    typeof object[key] === "boolean"
      ? (object[key] as boolean)
      : (DEFAULT_READER_PREFERENCES[key] as boolean);

  return {
    theme: isReaderTheme(object.theme) ? object.theme : DEFAULT_READER_PREFERENCES.theme,
    epubTextSize: clampEpubTextSize(object.epubTextSize),
    showClock: flag("showClock"),
    showSession: flag("showSession"),
    showStreak: flag("showStreak"),
  };
}

/* Só os campos válidos da estante (para mudar um de cada vez). */
export function parseLibraryPatch(value: unknown): Partial<LibraryPreferences> {
  const object = asObject(value) ?? {};
  const patch: Partial<LibraryPreferences> = {};

  if (isLibraryView(object.view)) patch.view = object.view;
  if (isSortOption(object.sort)) patch.sort = object.sort;

  return patch;
}

/* O que está no banco, como as telas usam. */
export function parseUserPreferences(value: unknown): UserPreferences {
  const object = asObject(value) ?? {};

  return {
    reader: parseReaderPreferences(object.reader),
    library: { ...DEFAULT_LIBRARY_PREFERENCES, ...parseLibraryPatch(object.library) },
  };
}
