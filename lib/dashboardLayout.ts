/*
 * Arrumação dos widgets do Início (app/(main)/dashboard).
 *
 * Dois carrosséis, cada um com abas:
 * - "top": widgets na versão larga e baixa, um embaixo do outro;
 * - "bottom": widgets na versão para ficar lado a lado (até 2 por aba).
 * A versão do widget segue o carrossel em que ele está.
 *
 * Fica num cookie por aparelho (dá para ter uma arrumação no celular e
 * outra no computador). O servidor lê o cookie e já renderiza certo.
 * Este arquivo é usado no servidor e no editor (cliente): sem imports
 * de servidor aqui.
 */

export const DASHBOARD_LAYOUT_COOKIE = "rainbound-dashboard";

/* Um ano. */
export const DASHBOARD_LAYOUT_MAX_AGE = 60 * 60 * 24 * 365;

export const WIDGET_IDS = ["status", "reading", "recent", "queue"] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

/* Versão do widget: larga (carrossel de cima) ou lado a lado (de baixo). */
export type WidgetVariant = "wide" | "tall";

export type DashboardArea = "top" | "bottom";

export const AREA_VARIANT: Record<DashboardArea, WidgetVariant> = {
  top: "wide",
  bottom: "tall",
};

export const AREA_LABEL: Record<DashboardArea, string> = {
  top: "Em cima — versão larga",
  bottom: "Embaixo — lado a lado",
};

/* Nome e descrição de cada widget (editor). */
export const WIDGET_INFO: Record<WidgetId, { label: string; description: string }> = {
  status: {
    label: "Livros por status",
    description: "Quantos livros há em cada status.",
  },
  reading: {
    label: "Lendo agora",
    description: "Livros em andamento, com o progresso.",
  },
  recent: {
    label: "Chegaram",
    description: "Últimos livros adicionados.",
  },
  queue: {
    label: "Fila",
    description: "Livros em \"Quero ler\" e uma sugestão do dia.",
  },
};

export type DashboardTab = {
  id: string;
  label: string;
  widgets: WidgetId[];
};

export type DashboardLayout = Record<DashboardArea, DashboardTab[]>;

export const MAX_TABS_PER_AREA = 6;
export const MAX_WIDGETS_PER_TAB = 2;
export const MAX_TAB_LABEL_LENGTH = 24;

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  top: [
    { id: "estante", label: "Estante", widgets: ["status"] },
    { id: "fila", label: "Fila", widgets: ["queue"] },
  ],
  bottom: [
    { id: "leitura", label: "Leitura", widgets: ["reading", "recent"] },
  ],
};

/* Usado em atributos id do HTML (abas do carrossel). */
const TAB_ID_PATTERN = /^[a-z0-9-]{1,32}$/;

export function isWidgetId(value: unknown): value is WidgetId {
  return WIDGET_IDS.includes(value as WidgetId);
}

function parseTab(value: unknown): DashboardTab | null {
  if (typeof value !== "object" || value === null) return null;

  const { id, label, widgets } = value as Record<string, unknown>;

  if (typeof id !== "string" || !TAB_ID_PATTERN.test(id)) return null;

  const cleanLabel =
    typeof label === "string" ? label.replace(/\s+/g, " ").trim() : "";

  if (!cleanLabel || cleanLabel.length > MAX_TAB_LABEL_LENGTH) return null;

  if (!Array.isArray(widgets)) return null;

  /* Widgets desconhecidos (ex.: removidos numa versão nova) somem. */
  const cleanWidgets = [...new Set(widgets.filter(isWidgetId))].slice(
    0,
    MAX_WIDGETS_PER_TAB,
  );

  return { id, label: cleanLabel, widgets: cleanWidgets };
}

function parseArea(value: unknown) {
  if (!Array.isArray(value)) return null;

  const tabs: DashboardTab[] = [];
  const ids = new Set<string>();

  for (const item of value.slice(0, MAX_TABS_PER_AREA)) {
    const tab = parseTab(item);

    if (!tab || ids.has(tab.id)) return null;

    ids.add(tab.id);
    tabs.push(tab);
  }

  return tabs;
}

/*
 * Confere uma arrumação vinda do cookie ou do editor. Devolve null se
 * algo estiver fora do formato (quem chama decide usar o padrão).
 */
export function parseDashboardLayout(value: unknown): DashboardLayout | null {
  if (typeof value !== "object" || value === null) return null;

  const { top, bottom } = value as Record<string, unknown>;
  const parsedTop = parseArea(top);
  const parsedBottom = parseArea(bottom);

  if (!parsedTop || !parsedBottom) return null;

  /* Ids de aba únicos nos dois carrosséis. */
  const ids = [...parsedTop, ...parsedBottom].map((tab) => tab.id);

  if (new Set(ids).size !== ids.length) return null;

  return { top: parsedTop, bottom: parsedBottom };
}

/* Lê o valor do cookie; qualquer problema volta ao padrão. */
export function readDashboardLayout(cookieValue: string | undefined) {
  if (!cookieValue) return DEFAULT_DASHBOARD_LAYOUT;

  try {
    return (
      parseDashboardLayout(JSON.parse(cookieValue)) ?? DEFAULT_DASHBOARD_LAYOUT
    );
  } catch {
    return DEFAULT_DASHBOARD_LAYOUT;
  }
}
