import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { DEFAULT_COVER } from "@/app/(main)/library/types";

import HomeHero from "./HomeHero";

type HeroProps = {
  continueReading: {
    id: number;
    title: string;
    coverUrl: string | null;
    progress: {
      percentage: number;
      currentPosition: number;
      totalPositions: number | null;
    } | null;
  } | null;
};

/*
 * Linha de apoio do cartão "Continuar", no mesmo formato do leitor
 * ("Página X de Y · Z%"; no EPUB, a página é a posição de ~1024 caracteres).
 */
function describeProgress(book: NonNullable<HeroProps["continueReading"]>) {
  const progress = book.progress;

  if (!progress || progress.percentage <= 0) {
    return "Ainda não começou";
  }

  const percentage = `${Math.round(progress.percentage)}%`;

  if (progress.totalPositions) {
    return `Página ${progress.currentPosition + 1} de ${progress.totalPositions} · ${percentage}`;
  }

  return `${percentage} lido`;
}

/* Hero da home logada: igual ao do visitante, com "Continuar" nas ações. */
export default function Hero({ continueReading }: HeroProps) {
  return (
    <HomeHero
      actions={
        continueReading ? (
          <Link
            href={`/read/${continueReading.id}`}
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
