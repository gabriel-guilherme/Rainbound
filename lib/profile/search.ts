import { AccountStatus } from "@/generated/prisma/enums";

import { prisma } from "../services/prisma";
import { personSelect, toFollowPeople } from "./follow";

/*
 * Busca de pessoas (/pessoas): por nome ou @usuário, só contas aprovadas.
 */

export const PEOPLE_SEARCH_LIMIT = 30;

export async function searchPeople(query: string, viewerId: string) {
  const rows = await prisma.user.findMany({
    where: {
      status: AccountStatus.APPROVED,
      username: { not: null },
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query.toLowerCase() } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: query ? PEOPLE_SEARCH_LIMIT * 2 : PEOPLE_SEARCH_LIMIT,
    select: personSelect,
  });

  if (query) {
    const lower = query.toLocaleLowerCase("pt-BR");
    const startsWith = (person: (typeof rows)[number]) =>
      person.username?.startsWith(lower) || person.name.toLocaleLowerCase("pt-BR").startsWith(lower);

    rows.sort((a, b) => Number(startsWith(b)) - Number(startsWith(a)));
  }

  return toFollowPeople(rows.slice(0, PEOPLE_SEARCH_LIMIT), viewerId);
}
