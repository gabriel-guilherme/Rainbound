import { AccountStatus } from "@/generated/prisma/enums";

import { getActivity } from "../reading/activity";
import { prisma } from "../services/prisma";
import { getAvatar } from "./avatar";

/*
 * Aba Atividade de /pessoas: a sua atividade e a de quem você segue,
 * do mais novo ao mais antigo. Perfis privados de quem você segue ficam
 * de fora (os outros só veem o cabeçalho deles).
 */

export const FEED_PAGE_SIZE = 20;

/*
 * Uma página da aba Atividade. `before`: data do último item já mostrado
 * (sem ela, as mais recentes); `nextCursor` é null quando acabou.
 */
export async function getFollowingFeed(viewerId: string, today: string, before: Date | null = null) {
  const followed = await prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followed: { status: AccountStatus.APPROVED, isProfilePublic: true, username: { not: null } },
    },
    select: { followedId: true },
  });

  const userIds = [viewerId, ...followed.map((row) => row.followedId)];

  const [events, users] = await Promise.all([
    getActivity(userIds, today, FEED_PAGE_SIZE + 1, before),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, username: true, avatarColor: true, avatarLetter: true },
    }),
  ]);

  const people = new Map(
    users.map((user) => [
      user.id,
      { name: user.name, username: user.username ?? "", avatar: getAvatar(user) },
    ]),
  );

  const page = events.slice(0, FEED_PAGE_SIZE);

  return {
    followingCount: followed.length,
    items: page.map((event) => ({ event, person: people.get(event.userId)! })),
    nextCursor: events.length > FEED_PAGE_SIZE ? page[page.length - 1].at.toISOString() : null,
  };
}

export type FollowingFeedPage = Awaited<ReturnType<typeof getFollowingFeed>>;
