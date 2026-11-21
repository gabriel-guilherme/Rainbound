import Image from "next/image";
import Link from "next/link";

import { DEFAULT_COVER, typeLabel } from "@/app/(main)/library/types";
import type { ContentType } from "@/generated/prisma/enums";

type RecentlyAddedProps = {
  recentlyAdded: {
    id: number;
    title: string;
    creator: string | null;
    type: ContentType;
    coverUrl: string | null;
    createdAt: Date;
  }[];
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
});

export default function RecentlyAdded({ recentlyAdded }: RecentlyAddedProps) {
  return (
    <section className="flex flex-col gap-3 bg-primary p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="title-shelf text-3xl text-contrast">Chegaram</h2>

        <Link
          href="/library/new"
          className="text-xs uppercase tracking-widest text-contrast/55 hover:text-danger"
        >
          + Adicionar
        </Link>
      </div>

      {recentlyAdded.length === 0 ? (
        <p className="text-sm text-contrast/60">Nenhum livro adicionado ainda.</p>
      ) : (
        <ul className="flex flex-col">
          {recentlyAdded.map((book) => (
            <li key={book.id} className="border-t border-contrast/10 first:border-t-0">
              <Link
                href={`/library/${book.id}`}
                className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-2.5"
              >
                <span className="relative aspect-[7/10] w-full">
                  <Image
                    src={book.coverUrl ?? DEFAULT_COVER}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                </span>

                <span className="min-w-0">
                  <span className="block truncate font-medium group-hover:text-danger">
                    {book.title}
                  </span>
                  <span className="block truncate text-xs text-contrast/55">
                    {book.creator ?? "Autor desconhecido"} · {typeLabel[book.type]}
                  </span>
                </span>

                <time
                  dateTime={book.createdAt.toISOString()}
                  className="text-xs tabular-nums text-contrast/40"
                >
                  {dateFormatter.format(book.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
