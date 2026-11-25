import type { WidgetId, WidgetLook } from "@/lib/dashboardLayout";

type WidgetThumbProps = {
  widget: WidgetId;
  /* Visual dos widgets de livros; sem ele, a miniatura própria do widget. */
  look?: WidgetLook;
  size?: "md" | "sm";
};

/* Lombadas de exemplo: [largura, altura, cor]. */
const SPINES: [number, number, string][] = [
  [9, 34, "bg-spine-wine"],
  [12, 30, "bg-spine-sand"],
  [8, 36, "bg-interaction-contrast"],
  [11, 32, "bg-spine-umber"],
  [10, 28, "bg-spine-wine"],
];

const WEEK = [12, 6, 20, 30, 16, 2, 2];

/* Atividade: intensidade de cada quadradinho. */
const ACTIVITY = [
  "bg-interaction/30",
  "bg-interaction/80",
  "bg-interaction/55",
  "bg-status-read",
  "bg-contrast/10",
  "bg-interaction/55",
  "bg-interaction/80",
  "bg-interaction/30",
];

/*
 * Miniatura do formato de um widget no mapa e no catálogo do editor
 * (decorativa: o nome do widget vem ao lado).
 */
export default function WidgetThumb({ widget, look, size = "md" }: WidgetThumbProps) {
  const scale = size === "md" ? 1 : 0.75;
  const px = (value: number) => `${Math.round(value * scale)}px`;

  if (look === "spine") {
    return (
      <span aria-hidden="true" className="flex items-end gap-[3px] border-b-4 border-darkest">
        {SPINES.map(([width, height, color], index) => (
          <span key={index} className={color} style={{ width: px(width), height: px(height) }} />
        ))}
      </span>
    );
  }

  if (look === "cover") {
    return (
      <span aria-hidden="true" className="flex items-center gap-1.5">
        {["bg-spine-umber", "bg-interaction-contrast"].map((color) => (
          <span key={color} className="flex items-center gap-1.5">
            <span className={color} style={{ width: px(18), height: px(26) }} />
            <span className="block h-1 bg-contrast/40" style={{ width: px(44) }} />
          </span>
        ))}
      </span>
    );
  }

  if (widget === "week") {
    return (
      <span aria-hidden="true" className="flex items-end gap-[3px]">
        {WEEK.map((minutes, index) => (
          <span
            key={index}
            className={minutes > 10 ? "bg-interaction" : "bg-interaction/40"}
            style={{ width: px(11), height: px(minutes + 2) }}
          />
        ))}
      </span>
    );
  }

  if (widget === "activity") {
    return (
      <span aria-hidden="true" className="flex items-end gap-[3px]">
        {ACTIVITY.map((color, index) => (
          <span key={index} className={color} style={{ width: px(10), height: px(10) }} />
        ))}
      </span>
    );
  }

  if (widget === "streak") {
    return (
      <span aria-hidden="true" className="flex items-end gap-[3px]">
        {[1, 1, 1, 1, 0].map((met, index) => (
          <span
            key={index}
            className={met ? "bg-interaction" : "bg-contrast/12"}
            style={{ width: px(15), height: px(15) }}
          />
        ))}
      </span>
    );
  }

  if (widget === "status") {
    return (
      <span aria-hidden="true" className="flex items-end gap-0.5">
        <span className="bg-interaction" style={{ width: px(64), height: px(10) }} />
        <span className="bg-interaction-contrast" style={{ width: px(36), height: px(10) }} />
        <span className="bg-danger" style={{ width: px(20), height: px(10) }} />
      </span>
    );
  }

  if (widget === "feed") {
    return (
      <span aria-hidden="true" className="flex flex-col gap-1">
        {[56, 72, 44].map((width, index) => (
          <span key={index} className="flex items-center gap-1.5">
            <span className="bg-spine-umber" style={{ width: px(8), height: px(11) }} />
            <span className="block h-1 bg-contrast/40" style={{ width: px(width) }} />
          </span>
        ))}
      </span>
    );
  }

  /* Sessão: o relógio. */
  return (
    <span aria-hidden="true" className="flex items-end">
      <span className="font-display text-2xl font-bold leading-none text-contrast/40">21:47</span>
    </span>
  );
}
