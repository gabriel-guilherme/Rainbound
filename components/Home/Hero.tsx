"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DEFAULT_COVER } from "@/app/(main)/library/types";
import type { FileFormat } from "@/generated/prisma/enums";
import RainWindow from "../RainWindow/RainWindow";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

type HeroProps = {
  continueReading: {
    id: number;
    title: string;
    format: FileFormat;
    coverUrl: string | null;
    progress: {
      percentage: number;
      currentPosition: number;
      totalPositions: number | null;
    } | null;
  } | null;
};

/*
 * Linha de apoio do cartão "Continuar". Em PDF e CBZ a posição é a página;
 * no EPUB são trechos do texto, então mostra só a porcentagem.
 */
function describeProgress(book: NonNullable<HeroProps["continueReading"]>) {
  const progress = book.progress;

  if (!progress || progress.percentage <= 0) {
    return "Ainda não começou";
  }

  const percentage = `${Math.round(progress.percentage)}%`;

  if (book.format !== "EPUB" && progress.totalPositions) {
    return `Página ${progress.currentPosition + 1} de ${progress.totalPositions} · ${percentage}`;
  }

  return `${percentage} lido`;
}

export default function Hero({ continueReading }: HeroProps) {
  const [isRainPaused, setIsRainPaused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  const { scrollYProgress: heroExitProgress } = useScroll({
    target: heroRef,
    offset: ["end end", "end start"],
  });

  /*
   * Quem pede menos movimento no sistema começa com a chuva pausada.
   */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsRainPaused(true);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const update = () => setIsDesktop(mediaQuery.matches);

    update();

    mediaQuery.addEventListener("change", update);

    return () => {
      mediaQuery.removeEventListener("change", update);
    };
  }, []);

  const messageOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.8, 1],
    [1, 0, 1, 1],
  );

  const desktopMessageOpacity = useTransform(
    heroExitProgress,
    [0, 0.4, 0.6, 1],
    [1, 1, 0, 0],
  );

  const windowOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.4, 0.55],
    [0, 1, 1],
  );

  const desktopWindowOpacity = useTransform(
    heroExitProgress,
    [0, 0.4, 0.6, 1],
    [1, 1, 0, 0],
  );

  /*
   * No celular texto e janela dividem a mesma célula da grade. Só a camada
   * visível recebe cliques; senão a janela transparente, que fica por cima,
   * engole o toque no "Continuar".
   */
  const toPointerEvents = (opacity: number) => (opacity > 0.5 ? "auto" : "none");
  const messagePointerEvents = useTransform(messageOpacity, toPointerEvents);
  const desktopMessagePointerEvents = useTransform(
    desktopMessageOpacity,
    toPointerEvents,
  );
  const windowPointerEvents = useTransform(windowOpacity, toPointerEvents);
  const desktopWindowPointerEvents = useTransform(
    desktopWindowOpacity,
    toPointerEvents,
  );

  return (
    <section
      ref={heroRef}
      className="relative h-[200vh] w-full bg-darkest"
    >
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:px-10 xl:grid-cols-[1.15fr_0.85fr] xl:gap-16">
          {/* Conteúdo */}
          <motion.div
            className="relative z-10 col-start-1 row-start-1 flex items-center justify-center text-center lg:col-start-2 lg:row-start-1 lg:justify-start lg:text-left"
            style={{
              opacity: isDesktop ? desktopMessageOpacity : messageOpacity,
              pointerEvents: isDesktop
                ? desktopMessagePointerEvents
                : messagePointerEvents,
            }}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              className="w-full max-w-xl"
            >
              <p className="text-sm uppercase tracking-[0.3em] text-danger">
                Rainbound
              </p>

              <h1 className="title-shelf mt-4 text-[clamp(3.25rem,13vw,5.5rem)] text-contrast lg:text-[clamp(4rem,5.4vw,6rem)]">
                Seu cantinho <br /> <span className="text-danger">de leitura</span>
              </h1>

              <p className="mx-auto mt-6 max-w-md text-pretty font-reading text-lg italic text-contrast/65 sm:text-xl lg:mx-0">
                Um lugar tranquilo para seus livros, suas anotações e as
                histórias que você ainda não terminou.
              </p>

              {continueReading ? (
                <Link
                  href={`/read/${continueReading.id}`}
                  className="group mx-auto mt-8 grid w-full max-w-md grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-4 border-l-[6px] border-danger bg-primary py-2.5 pl-2.5 pr-4 text-left transition-colors hover:bg-secondary lg:mx-0"
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
                  className="btn-shelf mt-8 bg-danger text-primary hover:bg-contrast"
                >
                  Abrir a estante
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Janela */}
          <motion.div
            className="col-start-1 row-start-1 flex min-w-0 items-center justify-center lg:col-start-1 lg:row-start-1"
            style={{
              opacity: isDesktop ? desktopWindowOpacity : windowOpacity,
              pointerEvents: isDesktop
                ? desktopWindowPointerEvents
                : windowPointerEvents,
            }}
          >
            <RainWindow isPaused={isRainPaused} setIsPaused={setIsRainPaused} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
