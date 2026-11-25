"use client";

import CurrentTime from "@/components/ReadingSession/CurrentTime";
import SessionFinishedNotice from "@/components/ReadingSession/SessionFinishedNotice";
import SessionPanel from "@/components/ReadingSession/SessionPanel";
import { useNow } from "@/lib/useNow";
import type { WidgetVariant } from "@/lib/dashboardLayout";

import WidgetCard from "./WidgetCard";

const longDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/*
 * "Sessão": relógio + cronômetro/timer de leitura. É a mesma sessão do
 * rodapé do leitor (components/ReadingSession): o que começou lá continua
 * contando aqui. Diferente dos outros widgets, roda no navegador (a hora
 * e a sessão são do aparelho, não do servidor).
 * - wide: relógio à esquerda, controles à direita;
 * - tall: tudo empilhado.
 */
export default function SessionWidget({ variant }: { variant: WidgetVariant }) {
  const now = useNow();
  const isWide = variant === "wide";

  return (
    <WidgetCard title="Sessão">
      <SessionFinishedNotice />

      <div
        className={
          isWide
            ? "grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:items-center md:gap-8"
            : "flex flex-col gap-4"
        }
      >
        <div
          className={
            isWide
              ? "flex flex-col gap-1.5"
              : "flex items-baseline justify-between gap-3 border-b border-contrast/10 pb-4"
          }
        >
          <CurrentTime
            className={[
              "title-shelf text-contrast",
              isWide ? "min-h-[0.85em] text-7xl sm:text-8xl" : "min-h-[0.85em] text-6xl",
            ].join(" ")}
          />
          <span className="block text-sm text-contrast/65 first-letter:uppercase">
            {now === null ? "" : (isWide ? longDate : shortDate).format(now)}
          </span>
        </div>

        <div className={isWide ? "md:border-l md:border-contrast/10 md:pl-8" : ""}>
          <SessionPanel />
        </div>
      </div>
    </WidgetCard>
  );
}
