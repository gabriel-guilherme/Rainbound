import { Droplet } from "lucide-react";

import StreakWeek from "@/components/reading-streak/StreakWeek";

import { SAMPLE_TODAY, SAMPLE_WEEK, SAMPLE_YEAR } from "./landingSamples";

const LEVEL_CLASS = ["bg-contrast/[0.06]", "bg-interaction-contrast", "bg-interaction", "bg-status-read"];

export default function StreakPreview() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-7 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-9">
        <div className="flex items-center gap-4 max-sm:justify-center">
          <span className="flex size-18 items-center justify-center bg-interaction/15 text-interaction">
            <Droplet size={40} fill="currentColor" strokeWidth={1.5} />
          </span>

          <span className="flex flex-col gap-1">
            <span className="title-shelf text-8xl text-contrast">
              12 <span className="text-4xl text-contrast/80">dias</span>
            </span>
            <span className="text-sm text-contrast/70">seguidos · recorde: 31 dias</span>
          </span>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="title-shelf text-xl text-contrast">Hoje</span>
            <span className="text-sm tabular-nums text-contrast/75">
              <b className="text-contrast">14</b> de 20 min
            </span>
          </div>

          <div className="h-1 bg-contrast/10">
            <div className="h-full w-[70%] bg-interaction" />
          </div>

          <StreakWeek week={SAMPLE_WEEK} today={SAMPLE_TODAY} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-xs text-contrast/55 max-lg:text-center">Últimos seis meses</span>

        <div className="scrollbar-none overflow-x-auto">
          <div className="grid w-max grid-flow-col grid-rows-7 gap-[3px] max-lg:mx-auto">
            {SAMPLE_YEAR.map((level, index) => (
              <span key={index} className={`size-3 ${LEVEL_CLASS[level]}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
