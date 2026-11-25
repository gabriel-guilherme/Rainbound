import Link from "next/link";

import type { FollowPerson } from "@/lib/profile/follow";

import Avatar from "./Avatar";
import FollowButton from "./FollowButton";

type FollowListProps = {
  people: FollowPerson[];
  viewerId: string;
  emptyText: string;
};

export default function FollowList({ people, viewerId, emptyText }: FollowListProps) {
  if (people.length === 0) {
    return <p className="bg-primary px-5 py-10 text-center text-sm text-contrast/75">{emptyText}</p>;
  }

  return (
    <ul className="flex flex-col bg-primary px-4 sm:px-5">
      {people.map((person) => (
        <li
          key={person.id}
          className="flex items-center gap-3 border-t border-contrast/10 py-3 first:border-t-0"
        >
          <Link href={`/u/${person.username}`} className="group flex min-w-0 flex-1 items-center gap-3">
            <Avatar avatar={person.avatar} size={40} />
            <span className="min-w-0">
              <span className="block truncate font-semibold group-hover:text-danger">{person.name}</span>
              <span className="block truncate text-xs text-contrast/70">@{person.displayUsername}</span>
            </span>
          </Link>

          {person.id === viewerId ? (
            <span className="text-xs text-contrast/60">Você</span>
          ) : (
            <FollowButton
              userId={person.id}
              name={person.name}
              following={person.viewerFollows}
              size="sm"
            />
          )}
        </li>
      ))}
    </ul>
  );
}
