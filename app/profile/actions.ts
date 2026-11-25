"use server";

import { revalidatePath } from "next/cache";

import { getApprovedUserId } from "@/lib/auth/session";
import { findAvatarColor, parseAvatarLetter } from "@/lib/profile/avatar";
import { MAX_BIO_LENGTH, parseBio } from "@/lib/profile/rules";
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

export async function updateProfile(value: { bio: unknown; isPublic: unknown }) {
  const userId = await getApprovedUserId();
  const bio = parseBio(value.bio);

  if (bio === undefined) {
    return { error: `A apresentação pode ter até ${MAX_BIO_LENGTH} caracteres.` };
  }

  if (typeof value.isPublic !== "boolean") {
    return { error: "Escolha se o perfil é público ou privado." };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { bio, isProfilePublic: value.isPublic },
    select: { username: true },
  });

  if (user.username) revalidatePath(`/u/${user.username}`);

  return {};
}
