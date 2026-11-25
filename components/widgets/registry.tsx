import type { ComponentType } from "react";

import type { WidgetId, WidgetLook, WidgetVariant } from "@/lib/dashboardLayout";

import ActivityWidget from "./ActivityWidget";
import BookStatus from "./BookStatus";
import Nearly from "./Nearly";
import Queue from "./Queue";
import Reading from "./Reading";
import RecentlyAdded from "./RecentlyAdded";
import SessionWidget from "./SessionWidget";
import Stalled from "./Stalled";
import StreakWidget from "./StreakWidget";
import WeekWidget from "./WeekWidget";

type WidgetComponent = ComponentType<{ variant: WidgetVariant; look: WidgetLook }>;

/*
 * Componente de cada widget do Início. Cada widget busca os próprios
 * dados (Server Component; a exceção é "session", que roda no navegador)
 * e tem as duas versões (`variant`): "wide" (carrossel de cima) e "tall"
 * (de baixo, lado a lado). Os de WIDGETS_WITH_LOOKS também recebem o
 * visual escolhido no editor (`look`: capa ou lombada).
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
} satisfies Record<WidgetId, unknown> as Record<WidgetId, WidgetComponent>;
