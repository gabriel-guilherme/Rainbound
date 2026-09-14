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
    offset: ["start 90%", "start 65%"],
  });

  const { scrollYProgress: thought2Progress } = useScroll({
    target: thought2Ref,
    offset: ["start 90%", "start 65%"],
  });

  const { scrollYProgress: thought3Progress } = useScroll({
    target: thought3Ref,
    offset: ["start 90%", "start 65%"],
  });

  const { scrollYProgress: thought4Progress } = useScroll({
    target: thought4Ref,
    offset: ["start 90%", "start 65%"],
  });

  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.6, 1],
    [0, 1, 1, 0],
  );

  const thought1Y = useTransform(thought1Progress, [0, 1], [60, 0]);
  const thought2Y = useTransform(thought2Progress, [0, 0.6], [60, 0]);
  const thought3Y = useTransform(thought3Progress, [0, 1], [60, 0]);
  const thought4Y = useTransform(thought4Progress, [0, 0.6], [60, 0]);

  const thought1Opacity = useTransform(
    thought1Progress,
    [0, 0.5, 1],
    [0, 1, 1],
  );

  const thought2Opacity = useTransform(
    thought2Progress,
    [0, 0.5, 1],
    [0, 1, 1],
  );

  const thought3Opacity = useTransform(
    thought3Progress,
    [0, 0.5, 1],
    [0, 1, 1],
  );

  const thought4Opacity = useTransform(
    thought4Progress,
    [0, 0.5, 1],
    [0, 1, 1],
  );

  const stylePattern =
    "flex w-[clamp(14rem,18vw,24rem)] flex-col gap-[clamp(0.6rem,0.7vw,0.9rem)] rounded-xl bg-primary px-[clamp(1rem,1.5vw,1.75rem)] py-[clamp(1rem,1.2vw,1.25rem)] text-contrast border border-contrast/60";

  return (
    <section
      ref={sectionRef}
      className="font-display relative flex h-screen w-full items-center justify-center overflow-hidden bg-secundary border-b border-contrast px-4 sm:px-8 lg:px-16 xl:px-24"
    >
      {/* Balão 1 */}
      <motion.div
        ref={thought1Ref}
        className={`absolute left-[8%] top-[5%] -rotate-5 sm:left-[5%] sm:top-[20%] md:left-[8%] md:top-[30%] lg:left-[2%] lg:top-[38%] xl:left-[8%] 2xl:left-[15%] ${stylePattern}`}
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
        ref={thought2Ref}
        className={`absolute bottom-[3%] right-[5%] rotate-5 sm:bottom-[20%] sm:left-[10%] md:bottom-[20%] md:left-[20%] lg:bottom-[15%] lg:left-[15%] 2xl:left-[30%] ${stylePattern}`}
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
        ref={thought3Ref}
        className={`absolute bottom-[20%] left-[15%] -rotate-10 sm:left-[60%] sm:rotate-3 md:bottom-[20%] md:left-[60%] lg:bottom-[15%] lg:right-[20%] 2xl:right-[30%] ${stylePattern}`}
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
        ref={thought4Ref}
        className={`absolute right-[5%] top-[25%] rotate-8 sm:right-[5%] sm:top-[15%] md:right-[10%] md:top-[25%] lg:right-[3%] xl:right-[10%] 2xl:right-[15%] ${stylePattern}`}
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
        className="relative z-10 flex w-full max-w-[clamp(40rem,70vw,75rem)] flex-col items-center justify-center gap-[clamp(1.25rem,1.5vw,2rem)] text-center"
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
