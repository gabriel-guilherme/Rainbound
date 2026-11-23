import Image from "next/image";
import Link from "next/link";

import { DEFAULT_COVER, typeLabel } from "@/app/(main)/library/types";
import type { WidgetVariant } from "@/lib/dashboardLayout";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/session";

import WidgetCard from "./WidgetCard";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
});

/*
 * "Chegaram": últimos livros adicionados.
 * - tall: lista com capa pequena, autor, tipo e data;
 * - wide: fileira de capas com título e data embaixo.
 */
export default async function RecentlyAdded({ variant }: { variant: WidgetVariant }) {
  const { id: userId } = await requireApprovedUser();

  const recentlyAdded = await prisma.book.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: variant === "wide" ? 10 : 5,
    select: {
      id: true,
      title: true,
      creator: true,
      type: true,
      coverUrl: true,
      createdAt: true,
    },
  });

  return (
    <WidgetCard
      title="Chegaram"
      action={{ href: "/library/new", label: "+ Adicionar" }}
    >
      {recentlyAdded.length === 0 ? (
        <p className="text-sm text-contrast/60">Nenhum livro adicionado ainda.</p>
      ) : variant === "wide" ? (
        <ul className="scrollbar-none -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
          {recentlyAdded.map((book) => (
            <li key={book.id} className="w-24 shrink-0">
              <Link href={`/library/${book.id}`} className="group block">
                <span className="relative block aspect-[7/10] w-full">
                  <Image
                    src={book.coverUrl ?? DEFAULT_COVER}
                    alt=""
                    fill
                    sizes="96px"
                    className="object-cover shadow-[0_10px_16px_-10px_rgb(0_0_0/0.8)] transition-transform group-hover:-translate-y-1"
                  />
                </span>

                <span className="mt-2 block truncate text-sm font-medium group-hover:text-danger">
                  {book.title}
                </span>

                <time
                  dateTime={book.createdAt.toISOString()}
                  className="block text-xs tabular-nums text-contrast/45"
                >
                  {dateFormatter.format(book.createdAt)}
                </time>
              </Link>
            </li>
          ))}
        </ul>
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
    </WidgetCard>
  );
}
