import { redirect } from "next/navigation";

import Collection from "@/components/home/Collection";
import Hero from "@/components/home/Hero";
import Landing from "@/components/home/Landing";
import Thoughts from "@/components/home/Thoughts";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/services/prisma";
import { getCurrentUser, isApproved } from "@/lib/auth/session";
import { toSpineBook } from "@/lib/books/spine";

/* Campos do cartão "Continuar" no Hero. */
const continueReadingSelect = {
  id: true,
  title: true,
  coverUrl: true,
  filePath: true,
  progress: {
    select: {
      percentage: true,
      currentPosition: true,
      totalPositions: true,
      locator: true,
    },
  },
} satisfies Prisma.BookSelect;

/*
 * Livro para continuar: o último LIDO (progresso salvo mais recente), e
 * não o último editado (ler só atualiza o ReadingProgress, não o Book).
 * Se nenhum livro "Lendo" foi aberto ainda, cai no editado por último.
 * Entram também os livros sem arquivo (lidos fora do site, com registro
 * manual): o cartão leva à página do livro em vez do leitor.
 */
async function findContinueReading(userId: string) {
  const where = {
    userId,
    status: "READING",
  } satisfies Prisma.BookWhereInput;

  const lastRead = await prisma.book.findFirst({
    where: { ...where, progress: { isNot: null } },
    orderBy: { progress: { updatedAt: "desc" } },
    select: continueReadingSelect,
  });

  return (
    lastRead ??
    prisma.book.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
      select: continueReadingSelect,
    })
  );
}

export default async function Home() {
  /*
   * Ler a sessão já faz a home renderizar a cada acesso (nunca no build).
   * Visitante vê a apresentação; pedido pendente vai para a tela de espera.
   */
  const user = await getCurrentUser();

  if (!user) return <Landing />;

  if (!isApproved(user)) redirect("/aguardando");

  const userId = user.id;

  /* As três consultas são independentes: vão juntas ao banco. */
  const [thoughts, books, continueReading] = await Promise.all([
    prisma.$queryRaw<{ title: string; note: string }[]>`
      SELECT title, notes AS note
      FROM "Book"
      WHERE "userId" = ${userId}
        AND notes IS NOT NULL
        AND TRIM(notes) <> ''
      ORDER BY RANDOM()
      LIMIT 4
    `,

    prisma.book.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 9,
      include: { progress: true },
    }),

    findContinueReading(userId),
  ]);

  return (
    <div className="w-full">
      <Hero continueReading={continueReading} />

      <Thoughts books={thoughts} />

      <Collection books={books.map(toSpineBook)} />
    </div>
  );
}
