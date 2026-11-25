"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react-motion";

import { DEFAULT_COVER } from "@/app/(main)/library/types";
import BookSpine from "@/components/books/BookSpine";
import ScrollReveal from "@/components/common/ScrollReveal";
import { getSpineLookForBook, type SpineBook } from "@/lib/books/spine";

type CollectionProps = {
  books: SpineBook[];
};

/* Posições na prateleira que mostram a capa de frente, como numa livraria. */
const FACED_OUT = new Set([0, 4]);

export default function Collection({ books }: CollectionProps) {
  return (
    <section className="flex w-full flex-col overflow-hidden bg-darkest px-4 py-20 sm:px-8 lg:px-16 lg:py-28 xl:px-24 2xl:px-48">
      <div className="flex min-h-0 w-full flex-col gap-4">
        <ScrollReveal className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-danger">
              Sua coleção
            </p>

            <h2 className="title-shelf mt-2 text-5xl text-contrast sm:text-6xl">
              Adicionados recentemente
            </h2>
          </div>

          <Link
            href="/library"
            data-motion-icon-group
            className="flex w-fit items-center gap-2 text-sm uppercase tracking-widest text-contrast transition-colors hover:text-danger sm:text-base"
          >
            Ver a estante inteira
            <ArrowRight aria-hidden="true" trigger="parent-hover" />
          </Link>
        </ScrollReveal>

        {books.length === 0 ? (
          <ScrollReveal order={1} className="flex flex-col items-start gap-4 py-10">
            <p className="font-reading text-xl italic text-contrast/60">
              Sua estante ainda está vazia.
            </p>

            <Link
              href="/library/new"
              className="btn-shelf bg-danger text-primary hover:bg-contrast"
            >
              Colocar o primeiro livro
            </Link>
          </ScrollReveal>
        ) : (
          <ScrollReveal order={2} distance={60} className="overflow-x-auto pt-10 scrollbar-none">
            <ul className="shelf-plank flex min-w-max items-end gap-[3px] px-4">
              {books.map((book, index) =>
                FACED_OUT.has(index) ? (
                  <li key={book.id} className="mx-2.5 w-32 shrink-0 sm:w-36">
                    <Link
                      href={`/library/${book.id}`}
                      aria-label={book.title}
                      title={book.title}
                      className="relative block aspect-[7/10] w-full shadow-[inset_4px_0_0_rgb(0_0_0/0.25),0_14px_22px_-12px_rgb(0_0_0/0.8)] transition-transform duration-300 hover:-translate-y-2"
                    >
                      <Image
                        src={book.coverUrl ?? DEFAULT_COVER}
                        alt={`Capa do livro ${book.title}`}
                        fill
                        sizes="144px"
                        className="object-cover"
                      />
                    </Link>
                  </li>
                ) : (
                  <li key={book.id}>
                    <BookSpine
                      book={book}
                      look={getSpineLookForBook(book)}
                      href={`/library/${book.id}`}
                    />
                  </li>
                ),
              )}
            </ul>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
