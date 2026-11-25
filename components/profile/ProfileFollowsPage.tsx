import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { requireApprovedUser } from "@/lib/auth/session";
import { FOLLOW_LIST_LIMIT, listFollows } from "@/lib/profile/follow";
import { getProfileByUsername } from "@/lib/profile/server";

import Avatar from "./Avatar";
import FollowList from "./FollowList";
import FollowsModal from "./FollowsModal";

type ProfileFollowsPageProps = {
  username: string;
  direction: "followers" | "following";
  variant: "page" | "modal";
};

/*
 * Seguidores e seguindo de um perfil (/u/<username>/seguidores e
 * /seguindo), com abas para trocar entre as duas listas.
 */
export default async function ProfileFollowsPage({
  username,
  direction,
  variant,
}: ProfileFollowsPageProps) {
  const viewer = await requireApprovedUser();
  const profile = await getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const people = await listFollows(profile.id, direction, viewer.id);
  const isOwner = profile.id === viewer.id;
  const base = `/u/${profile.username}`;

  const tabs = [
    { href: `${base}/seguidores`, label: "Seguidores", count: profile.followers, active: direction === "followers" },
    { href: `${base}/seguindo`, label: "Seguindo", count: profile.following, active: direction === "following" },
  ];

  const emptyText =
    direction === "followers"
      ? isOwner
        ? "Ninguém segue você ainda."
        : `Ninguém segue ${profile.name} ainda.`
      : isOwner
        ? "Você ainda não segue ninguém."
        : `${profile.name} ainda não segue ninguém.`;

  const tabsNav = (
    <nav aria-label="Listas do perfil" className="flex gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          /* No modal, trocar de aba não empilha histórico: "voltar" fecha. */
          replace={variant === "modal"}
          scroll={false}
          aria-current={tab.active ? "page" : undefined}
          className={`px-3 py-1.5 font-display text-lg font-bold uppercase tracking-wide transition-colors ${
            tab.active ? "bg-contrast text-primary" : "text-contrast/70 hover:bg-secondary hover:text-contrast"
          }`}
        >
          {tab.label} <span className="tabular-nums">{tab.count}</span>
        </Link>
      ))}
    </nav>
  );

  const list = (
    <>
      <FollowList people={people} viewerId={viewer.id} emptyText={emptyText} />
      {people.length >= FOLLOW_LIST_LIMIT && (
        <p className="py-3 text-center text-xs text-contrast/60">
          Mostrando as {FOLLOW_LIST_LIMIT} mais recentes.
        </p>
      )}
    </>
  );

  if (variant === "modal") {
    return (
      <FollowsModal
        title={
          <span className="flex items-center gap-3">
            <Avatar avatar={profile.avatar} size={32} />
            <span className="truncate">{profile.name}</span>
          </span>
        }
        tabs={tabsNav}
      >
        {list}
      </FollowsModal>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 pt-32">
      <Link
        href={base}
        className="flex items-center gap-3 self-start text-sm text-contrast/75 transition-colors hover:text-contrast"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        <Avatar avatar={profile.avatar} size={28} />
        Voltar ao perfil de {profile.name}
      </Link>

      {tabsNav}
      {list}
    </div>
  );
}
