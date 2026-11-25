import { Lock } from "lucide-react";
import Link from "next/link";

import type { Profile } from "@/lib/profile/server";

import Avatar from "./Avatar";
import FollowButton from "./FollowButton";
import ProfileEditor from "./ProfileEditor";

const sinceFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
});

type ProfileHeaderProps = {
  profile: Profile;
  isOwner: boolean;
  /* Quem está vendo segue o dono do perfil. */
  viewerFollows: boolean;
};

/*
 * Cabeçalho do perfil (direção A, "Estante pessoal"): avatar grande, nome,
 * @usuário, apresentação, desde quando está no Rainbound e seguidores,
 * com a tábua escura da estante embaixo. O dono vê "Editar perfil"; quem
 * visita, "Seguir".
 */
export default function ProfileHeader({ profile, isOwner, viewerFollows }: ProfileHeaderProps) {
  const base = `/u/${profile.username}`;

  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-x-5 gap-y-4 border-b-[10px] border-darkest pb-6 sm:gap-x-7 sm:pb-7 md:grid-cols-[auto_minmax(0,1fr)_auto]">
      <Avatar avatar={profile.avatar} size={136} className="max-sm:hidden" />
      <Avatar avatar={profile.avatar} size={88} className="sm:hidden" />

      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="title-shelf break-words text-5xl text-contrast sm:text-6xl">
          {profile.name}
        </h1>
        <p className="text-sm text-contrast/75 sm:text-base">
          @{profile.displayUsername} · no Rainbound desde {sinceFormatter.format(profile.createdAt)}
        </p>
      </div>

      <div className="col-span-2 flex flex-wrap items-center gap-3 md:col-span-1 md:flex-col md:items-end">
        {!isOwner && (
          <FollowButton userId={profile.id} name={profile.name} following={viewerFollows} />
        )}
        {isOwner && (
          <>
            <ProfileEditor avatar={profile.avatar} bio={profile.bio} isPublic={profile.isPublic} />
            {!profile.isPublic && (
              <span className="flex items-center gap-1.5 text-xs text-contrast/75">
                <Lock size={13} aria-hidden="true" />
                Perfil privado
              </span>
            )}
          </>
        )}
      </div>

      {profile.bio && (
        <p className="col-span-2 font-reading text-lg italic text-contrast/85 md:col-span-3 md:-mt-1">
          “{profile.bio}”
        </p>
      )}

      <p className="col-span-2 flex flex-wrap gap-x-4 text-sm md:col-span-3">
        <Link href={`${base}/seguindo`} className="group">
          <strong className="tabular-nums">{profile.following}</strong>{" "}
          <span className="text-contrast/75 group-hover:text-danger">seguindo</span>
        </Link>
        <Link href={`${base}/seguidores`} className="group">
          <strong className="tabular-nums">{profile.followers}</strong>{" "}
          <span className="text-contrast/75 group-hover:text-danger">
            {profile.followers === 1 ? "seguidor" : "seguidores"}
          </span>
        </Link>
      </p>
    </header>
  );
}
