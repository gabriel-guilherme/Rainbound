"use server";

import { revalidatePath } from "next/cache";

import { getApprovedUserId } from "@/lib/auth/session";
import { findAvatarColor, parseAvatarLetter } from "@/lib/profile/avatar";
import { prisma } from "@/lib/services/prisma";

/*
 * Troca a cor e a letra do avatar. Devolve `{ error }` em vez de lançar:
 * em produção a mensagem de um erro lançado não chega ao navegador.
 */
export async function updateAvatar(value: { color: unknown; letter: unknown }) {
  const userId = await getApprovedUserId();
  const color = findAvatarColor(value.color);
  const letter = parseAvatarLetter(value.letter);

  if (!color || !letter) {
    return { error: "Escolha uma cor e uma letra ou número." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarColor: color.id, avatarLetter: letter },
  });

  /* O avatar aparece no menu de todas as páginas. */
  revalidatePath("/", "layout");

  return {};
}
