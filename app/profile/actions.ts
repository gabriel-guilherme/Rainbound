"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { getApprovedUserId } from "@/lib/auth/session";
import type { DashboardLayout } from "@/lib/dashboardLayout";
import { findAvatarColor, parseAvatarLetter } from "@/lib/profile/avatar";
import { findFollowTarget, follow, unfollow } from "@/lib/profile/follow";
import { notifyFollow } from "@/lib/notifications/server";
import { parseProfileLayout } from "@/lib/profile/layout";
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

/*
 * Seguir ou deixar de seguir alguém (livre, sem pedido). Atualiza o
 * perfil da pessoa e o de quem segue (os contadores dos dois mudam).
 */
export async function setFollowing(value: { userId: unknown; follow: unknown }) {
  const viewerId = await getApprovedUserId();

  if (typeof value.userId !== "string" || typeof value.follow !== "boolean") {
    return { error: "Pedido inválido." };
  }

  const target = await findFollowTarget(viewerId, value.userId);

  if (!target) {
    return { error: "Não é possível seguir esta conta." };
  }

  if (value.follow) {
    await follow(viewerId, target.id);
    await notifyFollow(viewerId, target.id);
  } else {
    await unfollow(viewerId, target.id);
  }

  if (target.username) revalidatePath(`/u/${target.username}`, "layout");

  const viewer = await prisma.user.findUnique({
    where: { id: viewerId },
    select: { username: true },
  });

  if (viewer?.username) revalidatePath(`/u/${viewer.username}`, "layout");

  return {};
}

/* Revalida o perfil de quem está logado (/u/<username> e as listas). */
async function revalidateOwnProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

  if (user?.username) revalidatePath(`/u/${user.username}`, "layout");
}

export async function saveProfileLayout(layout: DashboardLayout) {
  const userId = await getApprovedUserId();
  const parsed = parseProfileLayout(layout);

  if (!parsed) {
    throw new Error("Arrumação de widgets inválida.");
  }

  await prisma.user.update({ where: { id: userId }, data: { profileLayout: parsed } });
  await revalidateOwnProfile(userId);
}

export async function resetProfileLayout() {
  const userId = await getApprovedUserId();

  await prisma.user.update({ where: { id: userId }, data: { profileLayout: Prisma.DbNull } });
  await revalidateOwnProfile(userId);
}
