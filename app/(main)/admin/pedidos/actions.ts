"use server";

import { revalidatePath } from "next/cache";

import { AccountStatus } from "@/generated/prisma/enums";
import { MAX_STORAGE_LIMIT_MB, MIN_STORAGE_LIMIT_MB } from "@/lib/bookFiles";
import { prisma } from "@/lib/prisma";
import { getAdminUserId } from "@/lib/session";

/*
 * Aprovar ou recusar um pedido de acesso. Só o admin; ele não muda o
 * próprio status. O usuário vê o resultado no próximo acesso (a sessão
 * relê o status do banco a cada requisição).
 */
async function reviewRequest(userId: string, status: AccountStatus) {
  const adminId = await getAdminUserId();

  if (typeof userId !== "string" || userId === adminId) {
    throw new Error("Pedido inválido.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status, reviewedAt: new Date() },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/", "layout");
}

export async function approveRequest(userId: string) {
  await reviewRequest(userId, AccountStatus.APPROVED);
}

export async function rejectRequest(userId: string) {
  await reviewRequest(userId, AccountStatus.REJECTED);
}

/*
 * Limite de espaço de um usuário (o próprio admin incluído), em MB.
 * `null` volta ao padrão do app. Devolve `{ error }` em vez de lançar:
 * em produção a mensagem de um erro lançado não chega ao navegador.
 */
export async function updateStorageLimit(
  userId: string,
  limitMb: number | null,
): Promise<{ error?: string }> {
  await getAdminUserId();

  if (typeof userId !== "string" || !userId) {
    return { error: "Usuário inválido." };
  }

  if (
    limitMb !== null &&
    (!Number.isInteger(limitMb) ||
      limitMb < MIN_STORAGE_LIMIT_MB ||
      limitMb > MAX_STORAGE_LIMIT_MB)
  ) {
    return {
      error: `Use um valor entre ${MIN_STORAGE_LIMIT_MB / 1000} e ${MAX_STORAGE_LIMIT_MB / 1000} GB.`,
    };
  }

  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: { storageLimitMb: limitMb },
  });

  if (count === 0) {
    return { error: "Usuário não encontrado." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/library");

  return {};
}
