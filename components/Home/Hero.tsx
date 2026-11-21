"use client";

import Link from "next/link";
import RainWindow from "../RainWindow/RainWindow";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

type HeroProps = {
  continueReading: { id: number; title: string } | null;
};

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

  return (
    <section
      ref={heroRef}
      className="relative h-[200vh] w-full border-b border-contrast/20 bg-darkest font-display"
    >
      <div className="sticky top-0 flex h-screen w-full items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8 lg:px-10 xl:grid-cols-[1.15fr_0.85fr] xl:gap-16">
          {/* Conteúdo */}
          <motion.div
            className="col-start-1 row-start-1 flex items-center justify-center text-center lg:col-start-2 lg:row-start-1"
            style={{
              opacity: isDesktop ? desktopMessageOpacity : messageOpacity,
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
              <p className="text-center text-lg text-interaction">
                Rainbound
              </p>

              <h1 className="mt-4 text-balance text-4xl text-contrast sm:text-5xl lg:text-6xl xl:text-7xl">
                Seu cantinho <br /> de leitura
              </h1>

              <p className="mx-auto mt-6 max-w-md text-pretty text-sm text-contrast/60 sm:text-base">
                Um lugar tranquilo para seus livros, suas anotações e as
                histórias que você ainda não terminou.
              </p>

              {continueReading ? (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <Link
                    href={`/read/${continueReading.id}`}
                    className="rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 text-contrast transition-colors hover:bg-interaction hover:text-primary"
                  >
                    Continuar lendo
                  </Link>

                  <span className="max-w-xs truncate text-sm text-contrast/40">
                    {continueReading.title}
                  </span>
                </div>
              ) : (
                <Link
                  href="/library"
                  className="mt-8 inline-block rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 text-contrast transition-colors hover:bg-interaction hover:text-primary"
                >
                  Abrir biblioteca
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Janela */}
          <motion.div
            className="col-start-1 row-start-1 flex min-w-0 items-center justify-center lg:col-start-1 lg:row-start-1"
            style={{
              opacity: isDesktop ? desktopWindowOpacity : windowOpacity,
            }}
          >
            <RainWindow isPaused={isRainPaused} setIsPaused={setIsRainPaused} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
