import { Droplet } from "lucide-react";

import { dateKeyToUtc, toMinutes, type StreakDay } from "@/lib/streak/rules";

const weekdayFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "narrow",
  timeZone: "UTC",
});

const longFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

type StreakWeekProps = {
  week: StreakDay[];
  today: string;
  size?: "md" | "sm";
};

/*
 * Últimos 7 dias: gota cheia nos dias garantidos; hoje fica tracejado até
 * bater a meta.
 */
export default function StreakWeek({ week, today, size = "md" }: StreakWeekProps) {
  return (
    <ol className={`grid grid-cols-7 ${size === "md" ? "gap-1.5" : "gap-1"}`}>
      {week.map((day) => {
        const isToday = day.date === today;
        const date = dateKeyToUtc(day.date);
        const description = `${longFormat.format(date)}: ${
          day.met ? "meta batida" : `${toMinutes(day.seconds)} min lidos`
        }`;

        return (
          <li
            key={day.date}
            title={description}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="sr-only">{description}</span>
            <span
              aria-hidden="true"
              className={[
                "flex aspect-square w-full items-center justify-center",
                size === "md" ? "max-w-10" : "max-w-9",
                day.met
                  ? "bg-interaction text-darkest"
                  : isToday
                    ? "border-2 border-dashed border-interaction text-interaction"
                    : "bg-contrast/10",
              ].join(" ")}
            >
              {day.met && (
                <Droplet size={size === "md" ? 16 : 14} fill="currentColor" strokeWidth={1.5} />
              )}
            </span>
            <span
              aria-hidden="true"
              className={
                isToday
                  ? "text-[11px] font-semibold text-contrast"
                  : "text-[11px] uppercase text-contrast/60"
              }
            >
              {isToday ? "Hoje" : weekdayFormat.format(date)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
