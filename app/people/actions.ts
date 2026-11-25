"use server";

import { getApprovedUserId } from "@/lib/auth/session";
import { getFollowingFeed } from "@/lib/profile/feed";
import { normalizePeopleQuery } from "@/lib/profile/rules";
import { searchPeople } from "@/lib/profile/search";
import { getTimeZone, todayIn } from "@/lib/streak/server";

export async function loadPeople(query: unknown, offset: unknown) {
  const viewerId = await getApprovedUserId();
  const start = typeof offset === "number" && Number.isInteger(offset) && offset >= 0 ? offset : 0;

  return searchPeople(normalizePeopleQuery(query), viewerId, start);
}

export async function loadFeed(cursor: unknown) {
  const viewerId = await getApprovedUserId();
  const before = typeof cursor === "string" ? new Date(cursor) : null;

  return getFollowingFeed(
    viewerId,
    todayIn(await getTimeZone()),
    before && !Number.isNaN(before.getTime()) ? before : null,
  );
}
