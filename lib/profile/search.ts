import { prisma } from "../services/prisma";
import { personSelect, toFollowPeople, type FollowPerson } from "./follow";

/*
 * Busca de pessoas (/pessoas?aba=buscar): por nome ou @usuário, só contas
 * aprovadas. Primeiro quem começa com o texto, depois quem só o contém;
 * sem texto, quem entrou por último. Paginada por posição (`offset`).
 */

export const PEOPLE_PAGE_SIZE = 20;

function likeEscape(value: string) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function searchPeople(
  query: string,
  viewerId: string,
  offset = 0,
): Promise<{ people: FollowPerson[]; nextOffset: number | null }> {
  const term = likeEscape(query.toLowerCase());
  const contains = `%${term}%`;
  const startsWith = `${term}%`;

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT u."id"
    FROM "User" u
    WHERE u."status" = 'APPROVED' AND u."username" IS NOT NULL
      AND (${query} = '' OR lower(u."name") LIKE ${contains} OR u."username" LIKE ${contains})
    ORDER BY
      CASE WHEN ${query} <> '' AND (lower(u."name") LIKE ${startsWith} OR u."username" LIKE ${startsWith})
        THEN 0 ELSE 1 END,
      u."createdAt" DESC,
      u."id"
    LIMIT ${PEOPLE_PAGE_SIZE + 1} OFFSET ${offset}
  `;

  const pageIds = rows.slice(0, PEOPLE_PAGE_SIZE).map((row) => row.id);
  const users = await prisma.user.findMany({ where: { id: { in: pageIds } }, select: personSelect });
  const byId = new Map(users.map((user) => [user.id, user]));
  const ordered = pageIds.map((id) => byId.get(id)).filter((user) => user !== undefined);

  return {
    people: await toFollowPeople(ordered, viewerId),
    nextOffset: rows.length > PEOPLE_PAGE_SIZE ? offset + PEOPLE_PAGE_SIZE : null,
  };
}
