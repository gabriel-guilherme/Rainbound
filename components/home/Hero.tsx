import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DEFAULT_COVER } from "@/lib/books/labels";
import { getReadPages } from "@/lib/reading/pages";

import HomeHero from "./HomeHero";

type HeroProps = {
  continueReading: {
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
  } | null;
};


function describeProgress(book: NonNullable<HeroProps["continueReading"]>) {
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
function continueHref(book: NonNullable<HeroProps["continueReading"]>) {
  return book.filePath
    ? `/read/${book.id}`
    : `/library/${book.id}?aba=leitura`;
}

/* Hero da home logada: igual ao do visitante, com "Continuar" nas ações. */
export default function Hero({ continueReading }: HeroProps) {
  return (
    <HomeHero
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
  );
}
