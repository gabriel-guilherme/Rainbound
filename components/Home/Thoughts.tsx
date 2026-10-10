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
  const thoughtsContainerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: thoughtsContainerRef,
    offset: ["start end", "end start"],
  });

  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0],
  );

  const thought1Progress = useTransform(
    scrollYProgress,
    [0, 0.06875, 0.1375],
    [0, 1, 1],
  );
  const thought2Progress = useTransform(
    scrollYProgress,
    [0.1375, 0.20625, 0.275],
    [0, 1, 1],
  );
  const thought3Progress = useTransform(
    scrollYProgress,
    [0.275, 0.34375, 0.4125],
    [0, 1, 1],
  );
  const thought4Progress = useTransform(
    scrollYProgress,
    [0.4125, 0.48125, 0.55],
    [0, 1, 1],
  );

  const thought1Y = useTransform(thought1Progress, [0, 1], [100, 0]);
  const thought2Y = useTransform(thought2Progress, [0, 1], [100, 0]);
  const thought3Y = useTransform(thought3Progress, [0, 1], [100, 0]);
  const thought4Y = useTransform(thought4Progress, [0, 1], [100, 0]);

  const thought1Opacity = useTransform(thought1Progress, [0, 0.5, 1], [0, 0.7, 1]);
  const thought2Opacity = useTransform(thought2Progress, [0, 0.5, 1], [0, 0.7, 1]);
  const thought3Opacity = useTransform(thought3Progress, [0, 0.5, 1], [0, 0.7, 1]);
  const thought4Opacity = useTransform(thought4Progress, [0, 0.5, 1], [0, 0.7, 1]);

  const stylePattern =
    "flex w-[clamp(18rem,22vw,32rem)] flex-col gap-[clamp(0.7rem,0.8vw,1rem)] rounded-xl bg-primary px-[clamp(1.25rem,2vw,2.25rem)] py-[clamp(1.25rem,1.5vw,2rem)] text-contrast border border-contrast/60";

  return (
    <section
      ref={thoughtsContainerRef}
      className="font-display relative flex h-screen w-full items-center justify-center overflow-hidden bg-secundary border-b border-contrast px-4 sm:px-8 lg:px-16 xl:px-24"
    >
      {/* Balão 1 */}
      <motion.div
        className={`absolute left-[8%] top-[3%] -rotate-2 sm:left-[6%] sm:top-[10%] md:left-[8%] md:top-[13%] lg:left-[10%] lg:top-[11%] xl:left-[12%] xl:top-[10%] 2xl:left-[10%] 2xl:top-[7%] ${stylePattern}`}
        style={{
          opacity: thought1Opacity,
          y: thought1Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1rem,1.5vw,1.5rem)]">
          &quot;
          {books[0]?.note
            ? books[0]?.note
            : "Maybe this was foreshadowing all along..."}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.7rem,0.9vw,1rem)] opacity-50">
          {books[0]?.title ? books[0]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Balão 2 */}
      <motion.div
        className={`absolute right-[8%] top-[15%] rotate-1 sm:right-[6%] sm:top-[18%] md:right-[8%] md:top-[21%] lg:right-[10%] lg:top-[19%] xl:right-[12%] xl:top-[17%] 2xl:right-[10%] 2xl:top-[15%] ${stylePattern}`}
        style={{
          opacity: thought2Opacity,
          y: thought2Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1rem,1.5vw,1.5rem)]">
          &quot;
          {books[1]?.note ? books[1]?.note : "Remember this chapter"}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.7rem,0.9vw,1rem)] opacity-50">
          {books[1]?.title ? books[1]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Balão 3 */}
      <motion.div
        className={`absolute bottom-[15%] left-[8%] -rotate-1 sm:bottom-[18%] sm:left-[6%] md:bottom-[21%] md:left-[8%] lg:bottom-[19%] lg:left-[10%] xl:bottom-[17%] xl:left-[12%] 2xl:bottom-[15%] 2xl:left-[10%] ${stylePattern}`}
        style={{
          opacity: thought3Opacity,
          y: thought3Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1rem,1.5vw,1.5rem)]">
          &quot;
          {books[2]?.note
            ? books[2]?.note
            : "Some stories stay with you long after the last page."}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.7rem,0.9vw,1rem)] opacity-50">
          {books[2]?.title ? books[2]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Balão 4 */}
      <motion.div
        className={`absolute right-[8%] bottom-[5%] rotate-1 sm:right-[6%] sm:bottom-[18%] md:right-[8%] md:bottom-[21%] lg:right-[10%] lg:bottom-[19%] xl:right-[12%] xl:bottom-[17%] 2xl:right-[10%] 2xl:bottom-[9%] ${stylePattern}`}
        style={{
          opacity: thought4Opacity,
          y: thought4Y,
        }}
      >
        <p className="line-clamp-3 text-[clamp(1rem,1.5vw,1.5rem)]">
          &quot;
          {books[3]?.note ? books[3]?.note : "I really liked this character."}
          &quot;
        </p>

        <p className="truncate text-[clamp(0.7rem,0.9vw,1rem)] opacity-50">
          {books[3]?.title ? books[3]?.title : "THE NAME OF THE WIND"}
        </p>
      </motion.div>

      {/* Conteúdo central */}
      <motion.div
        style={{ opacity: sectionOpacity }}
        className="relative z-10 flex w-full max-w-[clamp(28rem,50vw,50rem)] flex-col items-center justify-center gap-[clamp(3.5rem,6vw,6rem)] px-10 text-center"
      >
        <h3 className="text-[clamp(0.9rem,1.2vw,1.25rem)] text-contrast opacity-70">
          FROM YOUR BOOKS
        </h3>

        <h1 className="text-[clamp(2.5rem,5vw,5rem)] text-contrast">
          Little thoughts
        </h1>

        <p className="max-w-[clamp(22rem,45vw,48rem)] text-[clamp(0.9rem,1vw,1.125rem)] text-contrast opacity-50">
          Fragments of thoughts, ideas and moments you&apos;ve left behind while
          reading
        </p>
      </motion.div>
    </section>
  );
}
