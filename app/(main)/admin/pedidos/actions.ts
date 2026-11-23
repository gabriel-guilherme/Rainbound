"use server";

import { revalidatePath } from "next/cache";

import { AccountStatus } from "@/generated/prisma/enums";
import { MAX_STORAGE_LIMIT_MB } from "@/lib/bookFiles";
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
 * Limite de espaço de um usuário (o próprio admin incluído), em GB no
 * formulário (guardado em MB). Campo vazio volta ao padrão do app.
 */
export async function setStorageLimit(userId: string, formData: FormData) {
  await getAdminUserId();

  if (typeof userId !== "string") {
    throw new Error("Usuário inválido.");
  }

  const raw = String(formData.get("limitGb") ?? "").replace(",", ".").trim();
  const limitMb = raw === "" ? null : Math.round(Number(raw) * 1000);

  if (
    limitMb !== null &&
    (!Number.isInteger(limitMb) || limitMb < 0 || limitMb > MAX_STORAGE_LIMIT_MB)
  ) {
    throw new Error("Limite inválido.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { storageLimitMb: limitMb },
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/library");
}
