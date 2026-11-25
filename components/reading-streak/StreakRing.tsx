import { Droplet } from "lucide-react";

type StreakRingProps = {
  /* 0 a 1. */
  progress: number;
  met: boolean;
  size?: number;
};

/*
 * Ícone do rodapé: anel que enche com os minutos de hoje em volta da
 * gota; com a meta batida, a gota fica cheia num círculo.
 */
export default function StreakRing({ progress, met, size = 24 }: StreakRingProps) {
  const radius = (size - 3) / 2;
  const circumference = 2 * Math.PI * radius;
  const icon = Math.round(size / 2);

  if (met) {
    return (
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center rounded-full bg-interaction text-darkest"
        style={{ width: size, height: size }}
      >
        <Droplet size={icon} fill="currentColor" strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center text-interaction"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={2} className="stroke-contrast/15" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={2}
          className="stroke-interaction transition-[stroke-dasharray] duration-500"
          strokeDasharray={`${circumference * progress} ${circumference}`}
        />
      </svg>
      <Droplet size={icon} fill="currentColor" strokeWidth={1.5} />
    </span>
  );
}
