import {
  BYTES_PER_MB,
  DEFAULT_STORAGE_LIMIT_MB,
  formatStorageSize,
} from "@/lib/bookFiles";
import { prisma } from "@/lib/prisma";
import { getObjectSize } from "@/lib/r2";

/*
 * Limite de espaço por usuário: soma de Book.fileSize dos livros dele
 * contra User.storageLimitMb (ou o padrão). Só no servidor.
 *
 * Excluir um livro (ou trocar o arquivo) apaga o arquivo do R2 e tira o
 * tamanho da soma, liberando o espaço na hora.
 */

/* Em bytes. */
export type StorageUsage = {
  used: number;
  limit: number;
};

/* Mensagem pronta para o usuário quando o arquivo não cabe. */
export class StorageLimitError extends Error {}

/*
 * Livros enviados antes do limite não têm `fileSize`. Na primeira vez
 * que o uso é calculado, consulta o tamanho no R2 e grava; arquivo que
 * não existe mais conta como 0.
 */
async function backfillFileSizes(userId: string) {
  const missing = await prisma.book.findMany({
    where: { userId, filePath: { not: null }, fileSize: null },
    select: { id: true, filePath: true },
  });

  for (const book of missing) {
    try {
      const size = await getObjectSize(book.filePath as string);

      await prisma.book.update({
        where: { id: book.id },
        data: { fileSize: size ?? 0 },
      });
    } catch (error) {
      /* Fica para a próxima; não impede o resto. */
      console.error("Falha ao medir arquivo do livro", book.id, error);
    }
  }
}

/*
 * Espaço usado e limite do usuário. `excludeBookId`: livro cujo arquivo
 * vai ser substituído (o antigo é apagado, então não conta).
 */
export async function getStorageUsage(
  userId: string,
  excludeBookId?: number,
): Promise<StorageUsage> {
  await backfillFileSizes(userId);

  const [user, sum] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { storageLimitMb: true },
    }),
    prisma.book.aggregate({
      where: {
        userId,
        ...(excludeBookId ? { id: { not: excludeBookId } } : {}),
      },
      _sum: { fileSize: true },
    }),
  ]);

  return {
    used: sum._sum.fileSize ?? 0,
    limit: (user?.storageLimitMb ?? DEFAULT_STORAGE_LIMIT_MB) * BYTES_PER_MB,
  };
}

/* Lança StorageLimitError se um arquivo de `size` bytes não cabe. */
export async function assertStorageAvailable(
  userId: string,
  size: number,
  excludeBookId?: number,
) {
  const { used, limit } = await getStorageUsage(userId, excludeBookId);

  if (used + size > limit) {
    const free = Math.max(limit - used, 0);

    throw new StorageLimitError(
      `Sem espaço para este arquivo (${formatStorageSize(size)}). ` +
        `Você tem ${formatStorageSize(free)} livres de ${formatStorageSize(limit)}. ` +
        "Exclua livros que não usa mais para liberar espaço.",
    );
  }
}
