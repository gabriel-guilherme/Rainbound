"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";

import {
  WIDGET_INFO,
  WIDGET_LOOK_LABEL,
  WIDGET_LOOKS,
  getWidgetLook,
  hasLooks,
  isWidgetLook,
  type DashboardTab,
  type WidgetId,
  type WidgetLook,
  type WidgetVariant,
} from "@/lib/dashboardLayout";

import { iconButtonClass, selectClass } from "./editorStyles";

type EditorWidgetRowProps = {
  tab: DashboardTab;
  /* Versão do carrossel da aba (o visual padrão pode mudar com ela). */
  variant: WidgetVariant;
  widget: WidgetId;
  index: number;
  /* Abas para onde o widget pode ir (layoutEdits → destinationsFor). */
  destinations: { value: string; label: string }[];
  onMove: (delta: -1 | 1) => void;
  onLookChange: (look: WidgetLook) => void;
  onRelocate: (target: string) => void;
  onRemove: () => void;
};

/*
 * Um widget dentro de uma aba do editor: visual (capa ou lombada, nos
 * widgets que têm os dois), ordem, mover para outra aba e tirar da aba.
 */
export default function EditorWidgetRow({
  tab,
  variant,
  widget,
  index,
  destinations,
  onMove,
  onLookChange,
  onRelocate,
  onRemove,
}: EditorWidgetRowProps) {
  const { label, description } = WIDGET_INFO[widget];

  return (
    <li className="flex items-center gap-1 bg-primary/60 py-1 pl-2.5">
      <span className="min-w-0 flex-1 truncate text-sm" title={description}>
        {label}
      </span>

      {hasLooks(widget) && (
        <select
          value={getWidgetLook(tab, widget, variant)}
          onChange={(event) => {
            const look = event.target.value;

            if (isWidgetLook(look)) onLookChange(look);
          }}
          aria-label={`Visual de ${label}`}
          title="Visual: capas ou lombadas"
          className={`${selectClass} w-22`}
        >
          {WIDGET_LOOKS.map((look) => (
            <option key={look} value={look}>
              {WIDGET_LOOK_LABEL[look]}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={`Mover ${label} para antes`}
        className={iconButtonClass}
      >
        <ChevronUp size={15} />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === tab.widgets.length - 1}
        aria-label={`Mover ${label} para depois`}
        className={iconButtonClass}
      >
        <ChevronDown size={15} />
      </button>

      {destinations.length > 0 && (
        <select
          value=""
          onChange={(event) => onRelocate(event.target.value)}
          aria-label={`Mover ${label} para outra aba`}
          className={`${selectClass} w-24`}
        >
          <option value="" disabled>
            Mover…
          </option>
          {destinations.map((destination) => (
            <option key={destination.value} value={destination.value}>
              {destination.label}
            </option>
          ))}
        </select>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Tirar ${label} da aba`}
        title="Tirar da aba"
        className={`${iconButtonClass} hover:text-danger`}
      >
        <X size={15} />
      </button>
    </li>
  );
}
