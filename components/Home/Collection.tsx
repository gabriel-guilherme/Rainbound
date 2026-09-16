"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react-motion";
import BookPosterSimplified from "../BookPosterSimplified";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

type CollectionBook = {
  id: number;
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  status: string;
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

  const opacity = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0, 1, 1, 0]);

  return (
    <section className="font-sans flex h-screen w-full flex-col justify-center overflow-hidden bg-darkest px-4 py-10 sm:px-8 lg:px-16 xl:px-24">
      <h3 className="shrink-0 text-lg text-contrast opacity-50">
        YOUR COLLECTION
      </h3>

      <motion.div
        ref={windowRef}
        style={{ opacity }}
        className="flex min-h-0 w-full flex-col gap-5 pt-5"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-3xl text-contrast sm:text-4xl">
            Your library
          </h1>

          <Link
            href="/library"
            className="flex w-fit items-center gap-2 text-lg text-contrast sm:text-2xl"
          >
            View all
            <ArrowRight />
          </Link>
        </div>

        {/* Livros */}
        <div className="flex min-h-0 w-full gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0">
          {books.map((book) => (
            <div
              key={book.id}
              className="w-[80%] shrink-0 snap-center lg:w-auto p-10"
            >
              <BookPosterSimplified
                book={{
                  id: book.id,
                  title: book.title,
                  author: book.author,
                  currentPage: book.currentPage,
                  totalPages: book.totalPages,
                  status: book.status,
                  coverUrl: book.coverUrl || "",
                }}
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
