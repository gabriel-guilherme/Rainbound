import {
  parseDashboardLayout,
  type DashboardLayout,
  type WidgetId,
} from "../dashboardLayout";

/*
 * Widgets do perfil (User.profileLayout): o mesmo formato da arrumação da
 * home (lib/dashboardLayout.ts), mas no banco, porque quem visita também
 * vê. Funções puras (servidor e editor).
 */

export const PROFILE_HIDDEN_WIDGETS: readonly WidgetId[] = ["session"];

export const DEFAULT_PROFILE_LAYOUT: DashboardLayout = {
  top: [
    { id: "lendo", label: "Lendo agora", widgets: ["reading"] },
    { id: "atividade", label: "Atividade", widgets: ["activity"] },
  ],
  bottom: [{ id: "sequencia", label: "Sequência", widgets: ["streak", "status"] }],
};

function withoutHidden(layout: DashboardLayout): DashboardLayout {
  const clean = (tabs: DashboardLayout["top"]) =>
    tabs.map((tab) => ({
      ...tab,
      widgets: tab.widgets.filter((widget) => !PROFILE_HIDDEN_WIDGETS.includes(widget)),
    }));

  return { top: clean(layout.top), bottom: clean(layout.bottom) };
}

export function parseProfileLayout(value: unknown): DashboardLayout | null {
  const layout = parseDashboardLayout(value);

  return layout ? withoutHidden(layout) : null;
}

export function readProfileLayout(value: unknown): DashboardLayout {
  return parseProfileLayout(value) ?? DEFAULT_PROFILE_LAYOUT;
}
