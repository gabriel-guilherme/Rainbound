"use client";

import { X } from "lucide-react";

import {
  AREA_VARIANT,
  WIDGET_INFO,
  WIDGET_LOOK_LABEL,
  WIDGET_LOOKS,
  getWidgetLook,
  hasLooks,
  type DashboardArea,
  type DashboardLayout,
  type WidgetLook,
} from "@/lib/dashboardLayout";

import { iconButtonClass, optionButtonClass, sectionLabelClass } from "./editorStyles";
import { AREAS, AREA_SHORT_LABEL, canReceive, findTab, type WidgetSlot } from "./layoutEdits";
import WidgetThumb from "./WidgetThumb";

type WidgetPanelProps = {
  layout: DashboardLayout;
  slot: WidgetSlot;
  onLookChange: (look: WidgetLook) => void;
  onMove: (delta: -1 | 1) => void;
  onMoveTo: (area: DashboardArea, tabId: string) => void;
  onRemove: () => void;
  onClose: () => void;
};

/*
 * Opções do widget escolhido no mapa: visual (capa ou lombada), posição
 * na aba, mover para outra aba e tirar. No computador fica ao lado do
 * mapa; no celular, numa folha que sobe de baixo.
 */
export default function WidgetPanel({
  layout,
  slot,
  onLookChange,
  onMove,
  onMoveTo,
  onRemove,
  onClose,
}: WidgetPanelProps) {
  const tab = findTab(layout, slot.area, slot.tabId);
  const widget = tab?.widgets[slot.index];

  if (!tab || !widget) return null;

  const variant = AREA_VARIANT[slot.area];
  const currentLook = getWidgetLook(tab, widget, variant);
  const isTop = slot.area === "top";
  const { label, description } = WIDGET_INFO[widget];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-danger">Selecionado</p>
          <p className="title-shelf mt-1 text-3xl">{label}</p>
          <p className="mt-1 text-sm text-contrast/70">
            {AREA_SHORT_LABEL[slot.area]} › aba {tab.label.trim() || "sem nome"} · versão{" "}
            {isTop ? "larga" : "lado a lado"}
          </p>
          <p className="mt-2 text-sm text-contrast/80">{description}</p>
        </div>

        <button type="button" onClick={onClose} aria-label="Fechar opções" className={iconButtonClass}>
          <X size={18} />
        </button>
      </div>

      {hasLooks(widget) && (
        <fieldset className="flex flex-col gap-2">
          <legend className={`${sectionLabelClass} mb-2`}>Visual</legend>
          <div className="grid grid-cols-2 gap-2">
            {WIDGET_LOOKS.map((look) => {
              const isCurrent = look === currentLook;

              return (
                <button
                  key={look}
                  type="button"
                  onClick={() => onLookChange(look)}
                  aria-pressed={isCurrent}
                  className={[
                    "flex cursor-pointer flex-col gap-2 overflow-hidden bg-secondary p-2.5 text-left transition-colors hover:bg-secondary/70",
                    isCurrent ? "outline-2 outline-danger" : "",
                  ].join(" ")}
                >
                  <span className="flex h-11 items-end">
                    <WidgetThumb widget={widget} look={look} size="sm" />
                  </span>
                  <span className="text-sm font-semibold">{WIDGET_LOOK_LABEL[look]}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {tab.widgets.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className={sectionLabelClass}>Posição na aba</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onMove(-1)}
              disabled={slot.index === 0}
              className={optionButtonClass}
            >
              {isTop ? "↑ Para cima" : "← Para a esquerda"}
            </button>
            <button
              type="button"
              onClick={() => onMove(1)}
              disabled={slot.index === tab.widgets.length - 1}
              className={optionButtonClass}
            >
              {isTop ? "↓ Para baixo" : "→ Para a direita"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className={sectionLabelClass}>Mover para outra aba</p>
        <div className="flex flex-wrap gap-1.5">
          {AREAS.flatMap((area) =>
            layout[area]
              .filter((target) => !(area === slot.area && target.id === slot.tabId))
              .map((target) => {
                const isFull = !canReceive(target, widget);
                const reason = target.widgets.includes(widget) ? "já tem" : "cheia";

                return (
                  <button
                    key={`${area}:${target.id}`}
                    type="button"
                    onClick={() => onMoveTo(area, target.id)}
                    disabled={isFull}
                    className={optionButtonClass}
                  >
                    {AREA_SHORT_LABEL[area]} › {target.label.trim() || "sem nome"}
                    {isFull && ` (${reason})`}
                  </button>
                );
              }),
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer self-start border border-danger/50 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-danger hover:text-primary max-md:min-h-11"
      >
        Tirar da home
      </button>
    </div>
  );
}
