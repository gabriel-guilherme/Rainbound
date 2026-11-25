import Image from "next/image";
import Link from "next/link";

import { DEFAULT_COVER } from "@/lib/books/labels";
import BookSpine from "@/components/books/BookSpine";
import type { WidgetVariant } from "@/lib/dashboardLayout";
import { prisma } from "@/lib/services/prisma";
import { requireApprovedUser } from "@/lib/auth/session";
import {
  getLastName,
  getSpineLookForBook,
  toSpineBook,
  type SpineBook,
} from "@/lib/books/spine";

import WidgetCard from "./WidgetCard";

type QueueBook = SpineBook & { description: string | null };

/*
 * Sugestão do dia: muda uma vez por dia (não a cada visita), para a
 * fila não "pular" toda vez que a página recarrega.
 */
function pickOfTheDay<T>(items: T[]) {
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

  return items[day % items.length];
}

/*
 * "Fila": livros em "Quero ler", do mais antigo na fila para o mais novo.
 * - wide: prateleira baixa de lombadas + a sugestão do dia ao lado;
 * - tall: a sugestão do dia com capa e descrição + os próximos da fila.
 */
export default async function Queue({ variant }: { variant: WidgetVariant }) {
  const { id: userId } = await requireApprovedUser();

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where: { userId, status: "WANT_TO_READ" },
      orderBy: { createdAt: "asc" },
      take: 16,
      include: { progress: true },
    }),
    prisma.book.count({ where: { userId, status: "WANT_TO_READ" } }),
  ]);

  const queue: QueueBook[] = books.map((book) => ({
    ...toSpineBook(book),
    description: book.description,
  }));

  const suggestion = queue.length > 0 ? pickOfTheDay(queue) : null;

  return (
    <WidgetCard
      title="Fila"
      action={{ href: "/library?status=WANT_TO_READ", label: `Ver todos (${total})` }}
    >
      {!suggestion ? (
        <p className="text-sm text-contrast/60">
          Nenhum livro em &quot;Quero ler&quot;.{" "}
          <Link href="/library/new" className="text-danger hover:underline">
            Adicionar
          </Link>
        </p>
      ) : variant === "wide" ? (
        <QueueShelf books={queue} suggestion={suggestion} />
      ) : (
        <QueueCard books={queue} suggestion={suggestion} />
      )}
    </WidgetCard>
  );
}

function SuggestionActions({ book }: { book: QueueBook }) {
  return (
    <div className="flex flex-wrap gap-2">
      {book.hasFile && (
        <Link href={`/read/${book.id}`} className="btn-shelf bg-danger text-primary hover:bg-contrast">
          Começar
        </Link>
      )}

      <Link
        href={`/library/${book.id}`}
        className="btn-shelf text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
      >
        Ver livro
      </Link>
    </div>
  );
}

function QueueShelf({ books, suggestion }: { books: QueueBook[]; suggestion: QueueBook }) {
  return (
    <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      {/*
        * Lombadas a 65%: a versão larga é baixa. O espaço em cima deixa
        * a lombada subir no hover sem ser cortada.
        */}
      <ul
        aria-label="Livros na fila"
        className="scrollbar-none flex items-end gap-[3px] overflow-x-auto border-b-[10px] border-darkest pt-5 [zoom:0.65]"
      >
        {books.map((book) => (
          <li key={book.id} className="flex shrink-0 items-end">
            <BookSpine
              book={book}
              look={getSpineLookForBook(book)}
              href={`/library/${book.id}`}
            />
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-danger">Que tal este?</p>
          <p className="title-shelf mt-1 truncate text-2xl" title={suggestion.title}>
            {suggestion.title}
          </p>
          <p className="truncate text-sm text-contrast/55">
            {suggestion.creator ?? "Autor desconhecido"}
          </p>
        </div>

        <SuggestionActions book={suggestion} />
      </div>
    </div>
  );
}

function QueueCard({ books, suggestion }: { books: QueueBook[]; suggestion: QueueBook }) {
  const next = books.filter((book) => book.id !== suggestion.id).slice(0, 4);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
        <div className="relative aspect-[7/10] w-full">
          <Image
            src={suggestion.coverUrl ?? DEFAULT_COVER}
            alt={`Capa do livro ${suggestion.title}`}
            fill
            sizes="88px"
            className="object-cover shadow-[0_14px_22px_-12px_rgb(0_0_0/0.8)]"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-[11px] uppercase tracking-widest text-danger">Que tal este?</p>
          <p className="title-shelf text-2xl leading-none">{suggestion.title}</p>
          <p className="truncate text-sm text-contrast/55">
            {suggestion.creator ?? "Autor desconhecido"}
          </p>

          {suggestion.description && (
            <p className="line-clamp-3 font-reading text-sm italic text-contrast/65">
              {suggestion.description}
            </p>
          )}
        </div>
      </div>

      <SuggestionActions book={suggestion} />

      {next.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-contrast/40">Depois</p>

          <ol className="mt-2 flex flex-col">
            {next.map((book) => (
              <li key={book.id} className="border-t border-contrast/10 first:border-t-0">
                <Link
                  href={`/library/${book.id}`}
                  className="flex items-baseline justify-between gap-3 py-2 hover:text-danger"
                >
                  <span className="min-w-0 truncate text-sm">{book.title}</span>
                  <span className="shrink-0 text-xs text-contrast/40">
                    {getLastName(book.creator)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
