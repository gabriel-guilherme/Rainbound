"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react-motion";

import { DEFAULT_COVER } from "@/app/(main)/library/types";
import BookSpine from "@/components/common/BookSpine";
import ScrollReveal from "@/components/common/ScrollReveal";
import { getSpineLookForBook, type SpineBook } from "@/lib/spine";

type CollectionProps = {
  books: SpineBook[];
};

export default function Collection({ books }: CollectionProps) {
  const windowRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: windowRef,
    offset: ["start end", "end start"],
  });

  // Animação suave
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0],
  );

export default function Collection({ books }: CollectionProps) {
  return (
    <section className="font-sans flex h-screen w-full flex-col justify-center overflow-hidden bg-darkest px-4 py-10 sm:px-8 lg:px-16 xl:px-24 2xl:px-48">
      <h3 className="shrink-0 text-lg text-contrast opacity-50">
        YOUR COLLECTION
      </h3>

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

        {/* Livros - Melhor espaçamento e responsividade */}
        <div className="flex min-h-0 w-full gap-6 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:pb-0">
          {books.map((book) => (
            <div
              key={book.id}
              className="w-[85%] shrink-0 snap-center transition-all duration-300 hover:scale-105 lg:w-auto lg:hover:scale-105"
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
