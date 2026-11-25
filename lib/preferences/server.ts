import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "../services/prisma";
import { parseUserPreferences, type UserPreferences } from "./rules";

/*
 * Preferências da conta no banco (User.preferences). Formato e validação
 * em lib/preferences/rules.ts.
 */

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  return parseUserPreferences(user?.preferences);
}

/* Lê, muda e grava (o JSON inteiro, já conferido). */
export async function updateUserPreferences(
  userId: string,
  update: (current: UserPreferences) => UserPreferences,
) {
  const next = update(await getUserPreferences(userId));

  const stored = {
    library: next.library,
    ...(next.reader ? { reader: next.reader } : {}),
  } satisfies Prisma.InputJsonObject;

  await prisma.user.update({
    where: { id: userId },
    data: { preferences: stored },
  });
}
