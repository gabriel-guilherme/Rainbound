"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react-motion";
import BookPosterSimplified from "../common/BookPosterSimplified";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type CollectionBook = {
  id: number;
  title: string;
  creator: string | null;
  coverUrl: string | null;
};

type CollectionProps = {
  books: CollectionBook[];
};

export default function Collection({ books }: CollectionProps) {
  const windowRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: windowRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section className="font-sans flex h-screen w-full flex-col justify-center overflow-hidden bg-darkest px-4 py-10 sm:px-8 lg:px-16 xl:px-24 2xl:px-48">
      <p className="shrink-0 text-lg text-contrast opacity-50">
        Sua coleção
      </p>

      <motion.div
        ref={windowRef}
        style={{ opacity }}
        className="flex min-h-0 w-full flex-col gap-5 pt-5"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-display text-3xl text-contrast sm:text-4xl">
            Adicionados recentemente
          </h2>

          <Link
            href="/library"
            data-motion-icon-group
            className="flex w-fit items-center gap-2 text-lg text-contrast transition-colors hover:text-interaction sm:text-2xl"
          >
            Ver todos
            <ArrowRight aria-hidden="true" trigger="parent-hover" />
          </Link>
        </div>

        {books.length === 0 && (
          <div className="flex flex-col items-start gap-4 py-10">
            <p className="font-display text-xl text-contrast/60">
              Sua estante ainda está vazia.
            </p>

            <Link
              href="/library/new"
              className="rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 text-contrast transition-colors hover:bg-interaction hover:text-primary"
            >
              Adicionar o primeiro livro
            </Link>
          </div>
        )}

        {/* Livros */}
        <div className="flex min-h-0 w-full gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0">
          {books.map((book) => (
            <div
              key={book.id}
              className="w-[80%] shrink-0 snap-center p-10 transition-transform duration-300 hover:scale-105 lg:w-auto"
            >
              <Link href={`/library/${book.id}`} className="block rounded-md">
                <BookPosterSimplified book={book} />
              </Link>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
