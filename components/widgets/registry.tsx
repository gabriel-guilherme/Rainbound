import type { ComponentType } from "react";

import type { WidgetId } from "@/lib/dashboardLayout";

import ActivityWidget from "./ActivityWidget";
import BookStatus from "./BookStatus";
import Nearly from "./Nearly";
import Queue from "./Queue";
import Reading from "./Reading";
import RecentActivity from "./RecentActivity";
import RecentlyAdded from "./RecentlyAdded";
import SessionWidget from "./SessionWidget";
import Stalled from "./Stalled";
import StreakWidget from "./StreakWidget";
import WeekWidget from "./WeekWidget";

import type { WidgetProps } from "./types";

type WidgetComponent = ComponentType<WidgetProps>;

/*
 * Componente de cada widget (home e perfil). Cada widget busca os dados
 * do dono (`owner`; Server Component, menos "session", que roda no
 * navegador) e tem as duas versões (`variant`): "wide" (carrossel de cima)
 * e "tall" (de baixo, lado a lado). Os de WIDGETS_WITH_LOOKS também
 * recebem o visual escolhido no editor (`look`: capa ou lombada). Sem
 * `isOwner` (perfil de outra pessoa), ficam só para ver: sem ações nem
 * links para os livros. Props em types.ts; montagem em buildWidgetSections.
 *
 * Widget novo: criar o componente, registrar aqui e em WIDGET_IDS /
 * WIDGET_INFO (lib/dashboardLayout.ts).
 */
export const WIDGETS = {
  status: BookStatus,
  reading: Reading,
  recent: RecentlyAdded,
  queue: Queue,
  session: SessionWidget,
  streak: StreakWidget,
  nearly: Nearly,
  stalled: Stalled,
  activity: ActivityWidget,
  week: WeekWidget,
  feed: RecentActivity,
} satisfies Record<WidgetId, unknown> as Record<WidgetId, WidgetComponent>;
