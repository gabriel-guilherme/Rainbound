import type { ReadingStatus } from "@/generated/prisma/enums";

/*
 * Fita de marcador que sai do topo da lombada. A ponta indica o status:
 * - Quero ler: reta;
 * - Lendo: corte em V;
 * - Lido: arredondada;
 * - Abandonado: rasgada.
 * A cor é a do status (`--color-status-*`, a mesma dos selos do modo
 * capa); as lombadas não usam essas cores (lib/spine.ts) e o contorno
 * escuro separa a fita do livro. Estilos em app/globals.css (.spine-mark).
 */
const RIBBON_PATHS: Record<ReadingStatus, string> = {
  WANT_TO_READ: "M0.75 0.75H9.25V27.25H0.75Z",
  READING: "M0.75 0.75H9.25V27.25L5 21.5L0.75 27.25Z",
  READ: "M0.75 0.75H9.25V22.5C9.25 25.2 7.3 27.25 5 27.25C2.7 27.25 0.75 25.2 0.75 22.5Z",
  ABANDONED:
    "M0.75 0.75H9.25V24.5L7.6 23L6.1 27.25L4.2 23.6L2.6 26.6L0.75 24Z",
};

const RIBBON_COLORS: Record<ReadingStatus, string> = {
  WANT_TO_READ: "var(--color-status-want)",
  READING: "var(--color-status-reading)",
  READ: "var(--color-status-read)",
  ABANDONED: "var(--color-status-abandoned)",
};

type SpineRibbonProps = {
  status: ReadingStatus;
  className?: string;
};

export default function SpineRibbon({ status, className = "spine-mark" }: SpineRibbonProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 10 28"
      preserveAspectRatio="none"
    >
      <path
        d={RIBBON_PATHS[status]}
        fill={RIBBON_COLORS[status]}
        stroke="var(--color-darkest)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
