"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type BookNotes = {
  title: string;
  note: string;
};

type ThoughtsProps = {
  books: BookNotes[];
};

export default function Thoughts({ books }: ThoughtsProps) {
  const sectionRef = useRef<HTMLElement>(null);

  const thought1Ref = useRef<HTMLDivElement>(null);
  const thought2Ref = useRef<HTMLDivElement>(null);
  const thought3Ref = useRef<HTMLDivElement>(null);
  const thought4Ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const { scrollYProgress: thought1Progress } = useScroll({
    target: thought1Ref,
    offset: ["start 85%", "start 60%"],
  });

  const { scrollYProgress: thought2Progress } = useScroll({
    target: thought2Ref,
    offset: ["start 85%", "start 60%"],
  });

  const { scrollYProgress: thought3Progress } = useScroll({
    target: thought3Ref,
    offset: ["start 85%", "start 60%"],
  });

  const { scrollYProgress: thought4Progress } = useScroll({
    target: thought4Ref,
    offset: ["start 85%", "start 60%"],
  });

  // Animação suave
  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0],
  );

  const thought1Y = useTransform(thought1Progress, [0, 1], [80, 0]);
  const thought2Y = useTransform(thought2Progress, [0, 1], [80, 0]);
  const thought3Y = useTransform(thought3Progress, [0, 1], [80, 0]);
  const thought4Y = useTransform(thought4Progress, [0, 1], [80, 0]);

  const thought1Opacity = useTransform(
    thought1Progress,
    [0, 0.4, 1],
    [0, 1, 1],
  );

  const thought2Opacity = useTransform(
    thought2Progress,
    [0, 0.4, 1],
    [0, 1, 1],
  );

  const thought3Opacity = useTransform(
    thought3Progress,
    [0, 0.4, 1],
    [0, 1, 1],
  );

  const thought4Opacity = useTransform(
    thought4Progress,
    [0, 0.4, 1],
    [0, 1, 1],
  );

  const stylePattern =
    "flex w-[clamp(18rem,22vw,32rem)] flex-col gap-[clamp(0.7rem,0.8vw,1rem)] rounded-xl bg-primary px-[clamp(1.25rem,2vw,2.25rem)] py-[clamp(1.25rem,1.5vw,2rem)] text-contrast border border-contrast/60";

  return (
    <section
      ref={sectionRef}
      className="font-display relative flex h-screen w-full items-center justify-center overflow-hidden bg-secundary px-4 sm:px-8 lg:px-16 xl:px-24"
    >
      {/* Balão 1 - Melhor distribuição com responsividade */}
      <motion.div
        ref={thought1Ref}
        className={`absolute left-[10%] top-[8%] -rotate-3 sm:left-[6%] sm:top-[18%] md:left-[12%] md:top-[25%] lg:left-[5%] lg:top-[20%] xl:left-[8%] xl:top-[15%] 2xl:left-[12%] 2xl:top-[12%] ${stylePattern}`}
        style={{
          opacity: thought1Opacity,
          y: thought1Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1.1rem,1.8vw,1.75rem)] leading-relaxed">
          &quot;
          {books[0]?.note
            ? books[0]?.note
            : "Maybe this was foreshadowing all along..."}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.85rem,1.1vw,1.25rem)] opacity-50">
          {books[0]?.title ? books[0]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Balão 2 - Melhor distribuição com responsividade */}
      <motion.div
        ref={thought2Ref}
        className={`absolute bottom-[5%] right-[8%] rotate-3 sm:bottom-[22%] sm:left-[18%] md:bottom-[22%] md:left-[25%] lg:bottom-[18%] lg:left-[20%] xl:bottom-[20%] xl:left-[28%] 2xl:bottom-[22%] 2xl:left-[32%] ${stylePattern}`}
        style={{
          opacity: thought2Opacity,
          y: thought2Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1.1rem,1.8vw,1.75rem)] leading-relaxed">
          &quot;
          {books[1]?.note ? books[1]?.note : "Remember this chapter"}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.85rem,1.1vw,1.25rem)] opacity-50">
          {books[1]?.title ? books[1]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Balão 3 - Melhor distribuição com responsividade */}
      <motion.div
        ref={thought3Ref}
        className={`absolute bottom-[18%] left-[20%] -rotate-6 sm:left-[55%] sm:rotate-2 md:bottom-[18%] md:left-[55%] lg:bottom-[16%] lg:right-[22%] xl:bottom-[18%] xl:right-[18%] 2xl:bottom-[20%] 2xl:right-[15%] ${stylePattern}`}
        style={{
          opacity: thought3Opacity,
          y: thought3Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1.1rem,1.8vw,1.75rem)] leading-relaxed">
          &quot;
          {books[2]?.note
            ? books[2]?.note
            : "Some stories stay with you long after the last page."}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.85rem,1.1vw,1.25rem)] opacity-50">
          {books[2]?.title ? books[2]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Balão 4 - Melhor distribuição com responsividade */}
      <motion.div
        ref={thought4Ref}
        className={`absolute right-[8%] top-[20%] rotate-5 sm:right-[6%] sm:top-[12%] md:right-[12%] md:top-[22%] lg:right-[5%] lg:top-[18%] xl:right-[8%] xl:top-[15%] 2xl:right-[10%] 2xl:top-[18%] ${stylePattern}`}
        style={{
          opacity: thought4Opacity,
          y: thought4Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1.1rem,1.8vw,1.75rem)] leading-relaxed">
          &quot;
          {books[3]?.note ? books[3]?.note : "I really liked this character."}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.85rem,1.1vw,1.25rem)] opacity-50">
          {books[3]?.title ? books[3]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Conteúdo central - Melhor espaçamento e responsividade */}
      <motion.div
        style={{ opacity: sectionOpacity }}
        className="relative z-10 flex w-full max-w-[clamp(40rem,70vw,75rem)] flex-col items-center justify-center gap-[clamp(1.5rem,2vw,2.5rem)] text-center px-2"
      >
        <h3 className="text-[clamp(0.85rem,1.1vw,1.2rem)] text-contrast opacity-70 tracking-wide">
          FROM YOUR BOOKS
        </h3>

        <h1 className="text-[clamp(2.2rem,4.5vw,4.5rem)] font-display text-contrast leading-tight">
          Little thoughts
        </h1>

        <p className="max-w-[clamp(20rem,42vw,45rem)] text-[clamp(0.875rem,0.95vw,1.05rem)] text-contrast opacity-50 leading-relaxed">
          Fragments of thoughts, ideas and moments you&apos;ve left behind while
          reading
        </p>
      </motion.div>
    </section>
  );
}
