"use client";

import RainWindow from "../RainWindow/RainWindow";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

export default function Hero() {
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
      className="relative h-[200vh] w-full bg-darkest font-display border-b border-contrast"
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
              <h3 className="text-center text-lg text-interaction">
                Rainbound
              </h3>

              <h1 className="mt-4 text-4xl text-contrast sm:text-5xl lg:text-6xl xl:text-7xl">
                Your little <br /> reading space
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-sm text-contrast opacity-50 sm:text-base lg:mx-0 lg:max-w-lg">
                A quiet place for your books, your thoughts, and the stories you
                <br />
                haven&apos;t finished yet
              </p>

              <button className="cursor-pointer mt-8 rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 text-contrast transition-colors hover:bg-interaction">
                Continue reading
              </button>
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
