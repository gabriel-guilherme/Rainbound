import { Lock } from "lucide-react";
import Link from "next/link";

import type { Profile } from "@/lib/profile/server";

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
 * Cabeçalho do perfil (versão G): uma faixa de ponta a ponta na cor do
 * avatar, com a letra dele enorme e transparente ao fundo, o nome em
 * tamanho de manchete, a apresentação e os seguidores. O dono vê "Editar
 * perfil"; quem visita, "Seguir". Os números (ProfileStats) sobem por cima
 * da borda de baixo da faixa.
 */
export default function ProfileHeader({ profile, isOwner, viewerFollows }: ProfileHeaderProps) {
  const base = `/u/${profile.username}`;
  const { avatar } = profile;

  return (
    <header
      className="relative overflow-hidden"
      style={{ background: avatar.background, color: avatar.foreground }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-2 translate-y-[16%] select-none font-display text-[15rem] font-extrabold leading-none opacity-[0.16] sm:right-6 sm:text-[22rem] lg:text-[30rem]"
      >
        {avatar.letter}
      </span>

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-24 pt-32 sm:pb-28 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 max-w-3xl flex-col gap-2.5">
          <p className="text-sm opacity-85">
            @{profile.displayUsername} · no Rainbound desde {sinceFormatter.format(profile.createdAt)}
          </p>
          <h1 className="title-shelf break-words text-7xl sm:text-8xl lg:text-9xl">{profile.name}</h1>

          {profile.bio && (
            <p className="mt-1 font-reading text-xl italic opacity-90 sm:text-2xl">“{profile.bio}”</p>
          )}

          <p className="flex flex-wrap gap-x-4 text-sm">
            <Link href={`${base}/seguindo`} className="underline-offset-4 hover:underline">
              <strong className="tabular-nums">{profile.following}</strong> seguindo
            </Link>
            <Link href={`${base}/seguidores`} className="underline-offset-4 hover:underline">
              <strong className="tabular-nums">{profile.followers}</strong>{" "}
              {profile.followers === 1 ? "seguidor" : "seguidores"}
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 md:flex-col md:items-end">
          {isOwner ? (
            <>
              <ProfileEditor avatar={avatar} bio={profile.bio} isPublic={profile.isPublic} />
              {!profile.isPublic && (
                <span className="flex items-center gap-1.5 text-xs opacity-85">
                  <Lock size={13} aria-hidden="true" />
                  Perfil privado
                </span>
              )}
            </>
          ) : (
            <FollowButton userId={profile.id} name={profile.name} following={viewerFollows} onColor />
          )}
        </div>
      </div>
    </header>
  );
}
