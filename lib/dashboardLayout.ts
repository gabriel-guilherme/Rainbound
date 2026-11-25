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

export const WIDGET_IDS = [
  "status",
  "reading",
  "recent",
  "queue",
  "session",
  "streak",
  "nearly",
  "stalled",
  "activity",
  "week",
] as const;

export type WidgetId = (typeof WIDGET_IDS)[number];

/* Versão do widget: larga (carrossel de cima) ou lado a lado (de baixo). */
export type WidgetVariant = "wide" | "tall";

/*
 * Visual de alguns widgets de livros, escolhido no editor: capas
 * (cartões do "Lendo agora") ou lombadas (prateleira da "Fila" e pilha
 * deitada).
 */
export const WIDGET_LOOKS = ["cover", "spine"] as const;

export type WidgetLook = (typeof WIDGET_LOOKS)[number];

export const DEFAULT_WIDGET_LOOK: WidgetLook = "cover";

/*
 * Visual padrão por versão, nos widgets que já tinham um visual misto
 * antes da escolha existir (quem não mexer no editor vê o mesmo de antes).
 */
const DEFAULT_LOOK_BY_VARIANT: Partial<Record<WidgetId, Record<WidgetVariant, WidgetLook>>> = {
  reading: { wide: "cover", tall: "spine" },
  queue: { wide: "spine", tall: "cover" },
};

export const WIDGET_LOOK_LABEL: Record<WidgetLook, string> = {
  cover: "Capa",
  spine: "Lombada",
};

/* Widgets que têm as duas versões. */
export const WIDGETS_WITH_LOOKS: readonly WidgetId[] = [
  "reading",
  "recent",
  "queue",
  "nearly",
  "stalled",
];

export function hasLooks(widget: WidgetId) {
  return WIDGETS_WITH_LOOKS.includes(widget);
}

export function isWidgetLook(value: unknown): value is WidgetLook {
  return WIDGET_LOOKS.includes(value as WidgetLook);
}

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
  session: {
    label: "Sessão",
    description: "Relógio, cronômetro e timer de leitura (os mesmos do leitor).",
  },
  streak: {
    label: "Sequência",
    description: "Dias seguidos lendo a meta diária, o progresso de hoje e a semana.",
  },
  nearly: {
    label: "Quase lá",
    description: "Livros em leitura que passaram de 70%, com o quanto falta.",
  },
  stalled: {
    label: "Parados",
    description: "Livros em \"Lendo\" sem avançar há mais de 30 dias.",
  },
  activity: {
    label: "Atividade do ano",
    description: "Um quadradinho por dia, mais forte quanto mais você leu.",
  },
  week: {
    label: "Minutos da semana",
    description: "Minutos lidos em cada dia da semana, com a meta diária.",
  },
};

export type DashboardTab = {
  id: string;
  label: string;
  widgets: WidgetId[];
  /* Visual dos widgets com duas versões (sem valor: o padrão, ver getWidgetLook). */
  looks?: Partial<Record<WidgetId, WidgetLook>>;
};

export type DashboardLayout = Record<DashboardArea, DashboardTab[]>;

export const MAX_TABS_PER_AREA = 6;
export const MAX_WIDGETS_PER_TAB = 2;
export const MAX_TAB_LABEL_LENGTH = 24;

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  top: [
    { id: "estante", label: "Estante", widgets: ["status"] },
    { id: "fila", label: "Fila", widgets: ["queue"] },
    { id: "sessao", label: "Sessão", widgets: ["session"] },
    { id: "sequencia", label: "Sequência", widgets: ["streak"] },
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

  const { id, label, widgets, looks } = value as Record<string, unknown>;

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

  const cleanLooks = parseLooks(looks, cleanWidgets);

  return cleanLooks
    ? { id, label: cleanLabel, widgets: cleanWidgets, looks: cleanLooks }
    : { id, label: cleanLabel, widgets: cleanWidgets };
}

/* Só os visuais válidos de widgets que estão na aba e têm duas versões. */
function parseLooks(value: unknown, widgets: WidgetId[]) {
  if (typeof value !== "object" || value === null) return null;

  const looks: Partial<Record<WidgetId, WidgetLook>> = {};

  for (const widget of widgets) {
    const look = (value as Record<string, unknown>)[widget];

    if (hasLooks(widget) && isWidgetLook(look)) looks[widget] = look;
  }

  return Object.keys(looks).length > 0 ? looks : null;
}

/* Visual de um widget numa aba, na versão do carrossel em que ela está. */
export function getWidgetLook(
  tab: DashboardTab,
  widget: WidgetId,
  variant: WidgetVariant,
): WidgetLook {
  return (
    tab.looks?.[widget] ??
    DEFAULT_LOOK_BY_VARIANT[widget]?.[variant] ??
    DEFAULT_WIDGET_LOOK
  );
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
