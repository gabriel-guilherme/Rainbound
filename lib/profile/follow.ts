import { AccountStatus } from "@/generated/prisma/enums";

import { prisma } from "../services/prisma";
import { getAvatar } from "./avatar";

/*
 * Seguir (tabela Follow): livre, sem pedido para aceitar. Leitura e
 * gravação no banco; as actions ficam em app/profile/actions.ts.
 */

export const FOLLOW_LIST_LIMIT = 200;

export async function isFollowing(followerId: string, followedId: string) {
  const follow = await prisma.follow.findUnique({
    where: { followerId_followedId: { followerId, followedId } },
    select: { followerId: true },
  });

  return follow !== null;
}

export async function findFollowTarget(followerId: string, followedId: string) {
  if (followerId === followedId) return null;

  return prisma.user.findFirst({
    where: { id: followedId, status: AccountStatus.APPROVED },
    select: { id: true, username: true },
  });
}

export async function follow(followerId: string, followedId: string) {
  await prisma.follow.upsert({
    where: { followerId_followedId: { followerId, followedId } },
    create: { followerId, followedId },
    update: {},
  });
}

export async function unfollow(followerId: string, followedId: string) {
  await prisma.follow.deleteMany({ where: { followerId, followedId } });
}

const personSelect = {
  id: true,
  name: true,
  username: true,
  displayUsername: true,
  avatarColor: true,
  avatarLetter: true,
} as const;

export type FollowPerson = {
  id: string;
  name: string;
  username: string;
  displayUsername: string;
  avatar: ReturnType<typeof getAvatar>;
  /* Quem está vendo a lista segue esta pessoa. */
  viewerFollows: boolean;
};

/*
 * Seguidores (`direction: "followers"`) ou quem a pessoa segue
 * ("following"), do mais recente ao mais antigo. Só contas aprovadas.
 */
export async function listFollows(
  userId: string,
  direction: "followers" | "following",
  viewerId: string,
): Promise<FollowPerson[]> {
  const rows = await prisma.follow.findMany({
    where:
      direction === "followers"
        ? { followedId: userId, follower: { status: AccountStatus.APPROVED } }
        : { followerId: userId, followed: { status: AccountStatus.APPROVED } },
    orderBy: { createdAt: "desc" },
    take: FOLLOW_LIST_LIMIT,
    select: { follower: { select: personSelect }, followed: { select: personSelect } },
  });

  const people = rows
    .map((row) => (direction === "followers" ? row.follower : row.followed))
    .filter((person) => person.username);

  const viewerFollows = new Set(
    (
      await prisma.follow.findMany({
        where: { followerId: viewerId, followedId: { in: people.map((person) => person.id) } },
        select: { followedId: true },
      })
    ).map((row) => row.followedId),
  );

  return people.map((person) => ({
    id: person.id,
    name: person.name,
    username: person.username!,
    displayUsername: person.displayUsername || person.username!,
    avatar: getAvatar(person),
    viewerFollows: viewerFollows.has(person.id),
  }));
}
