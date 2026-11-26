import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import ScrollReveal from "@/components/common/ScrollReveal";
import StreakCard from "@/components/reading-streak/StreakCard";
import { DEFAULT_COVER } from "@/lib/books/labels";
import { getReadPages } from "@/lib/reading/pages";
import type { StreakSummary } from "@/lib/streak/rules";

import HomeHero from "./HomeHero";

export type ContinueReadingBook = {
  id: number;
  title: string;
  coverUrl: string | null;
  filePath: string | null;
  progress: {
    percentage: number;
    currentPosition: number;
    totalPositions: number | null;
    locator: string | null;
  } | null;
};

type HeroProps = {
  continueReading: ContinueReadingBook | null;
  streak: StreakSummary;
  timeZone: string;
};

function describeNow(timeZone: string) {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone }).format(now),
  );
  const greeting =
    hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";
  const date = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(now);

  return `${greeting} · ${date}`;
}

function describeProgress(book: ContinueReadingBook) {
  const progress = book.progress;

  if (!progress || progress.percentage <= 0) {
    return "Ainda não começou";
  }

  const percentage = `${Math.round(progress.percentage)}%`;
  const pages =
    getReadPages(progress) ??
    (book.filePath && progress.totalPositions
      ? { current: progress.currentPosition + 1, total: progress.totalPositions }
      : null);

  if (pages) {
    return `Página ${pages.current} de ${pages.total} · ${percentage}`;
  }

  return `${percentage} lido`;
}

/* Com arquivo, abre o leitor; sem, a aba Leitura (registro manual). */
function continueHref(book: ContinueReadingBook) {
  return book.filePath ? `/read/${book.id}` : `/library/${book.id}?aba=leitura`;
}

/*
 * Topo da home logada: o hero das duas homes (janela grande), com a
 * saudação no lugar do nome e "Continuar" nas ações; a sequência logo abaixo.
 */
export default function Hero({ continueReading, streak, timeZone }: HeroProps) {
  return (
    <>
      <HomeHero
        kicker={describeNow(timeZone)}
        actions={
          continueReading ? (
            <Link
              href={continueHref(continueReading)}
              className="group grid w-full max-w-md grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 border-l-[6px] border-danger bg-primary py-2.5 pl-2.5 pr-4 text-left transition-colors hover:bg-secondary"
            >
              <span className="relative aspect-[7/10] w-full">
                <Image
                  src={continueReading.coverUrl ?? DEFAULT_COVER}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>

              <span className="min-w-0">
                <span className="block truncate font-medium text-contrast">
                  Continuar {continueReading.title}
                </span>

                <span className="block truncate text-xs text-contrast/55">
                  {describeProgress(continueReading)}
                </span>

                <span className="mt-2 block h-0.5 bg-contrast/15">
                  <span
                    className="block h-full bg-danger"
                    style={{
                      width: `${Math.min(continueReading.progress?.percentage ?? 0, 100)}%`,
                    }}
                  />
                </span>
              </span>

              <ArrowRight
                size={20}
                aria-hidden="true"
                className="text-danger transition-transform group-hover:translate-x-1"
              />
            </Link>
          ) : (
            <Link
              href="/library"
              className="btn-shelf h-13 bg-danger px-6 text-primary shadow-[6px_6px_0_rgb(0_0_0/0.45)] hover:bg-contrast"
            >
              Abrir a estante
            </Link>
          )
        }
      />

      <div className="w-full bg-darkest px-4 sm:px-8 lg:px-10">
        <ScrollReveal className="mx-auto max-w-7xl">
          <StreakCard variant="wide" initial={streak} />
        </ScrollReveal>
      </div>
    </>
  );
}
