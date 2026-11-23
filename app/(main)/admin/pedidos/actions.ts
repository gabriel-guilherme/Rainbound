"use server";

import { revalidatePath } from "next/cache";

import { AccountStatus } from "@/generated/prisma/enums";
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
