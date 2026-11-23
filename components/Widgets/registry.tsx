import type { ComponentType } from "react";

import type { WidgetId, WidgetVariant } from "@/lib/dashboardLayout";

import BookStatus from "./BookStatus";
import Queue from "./Queue";
import Reading from "./Reading";
import RecentlyAdded from "./RecentlyAdded";

type WidgetComponent = ComponentType<{ variant: WidgetVariant }>;

/*
 * Componente de cada widget do Início. Todo widget é um Server Component
 * que busca os próprios dados e tem as duas versões (`variant`):
 * "wide" (carrossel de cima) e "tall" (de baixo, lado a lado).
 *
 * Widget novo: criar o componente, registrar aqui e em WIDGET_IDS /
 * WIDGET_INFO (lib/dashboardLayout.ts).
 */
export const WIDGETS = {
  status: BookStatus,
  reading: Reading,
  recent: RecentlyAdded,
  queue: Queue,
} satisfies Record<WidgetId, unknown> as Record<WidgetId, WidgetComponent>;
