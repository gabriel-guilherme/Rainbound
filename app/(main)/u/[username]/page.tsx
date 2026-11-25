import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import { requireApprovedUser } from "@/lib/auth/session";
import { isFollowing } from "@/lib/profile/follow";
import { getProfileByUsername, getProfileStats } from "@/lib/profile/server";

type ProfilePageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const profile = await getProfileByUsername((await params).username);

  return { title: profile ? `${profile.name} (@${profile.displayUsername})` : "Perfil" };
}

/*
 * Perfil de uma pessoa (/u/<username>). Só para quem está logado e
 * aprovado. Conta inexistente ou não aprovada: 404. Perfil privado: quem
 * visita vê só o cabeçalho (avatar, nome, apresentação, seguidores).
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const viewer = await requireApprovedUser();
  const profile = await getProfileByUsername((await params).username);

  if (!profile) {
    notFound();
  }

  const isOwner = profile.id === viewer.id;
  const canSeeContent = isOwner || profile.isPublic;
  const [stats, viewerFollows] = await Promise.all([
    canSeeContent ? getProfileStats(profile.id, profile.timeZone) : null,
    isOwner ? false : isFollowing(viewer.id, profile.id),
  ]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 pt-32">
      <ProfileHeader profile={profile} isOwner={isOwner} viewerFollows={viewerFollows} />

      {stats ? (
        <ProfileStats stats={stats} />
      ) : (
        <div className="flex flex-col items-center gap-3 bg-primary px-6 py-14 text-center">
          <Lock size={28} aria-hidden="true" className="text-contrast/60" />
          <p className="title-shelf text-3xl text-contrast">Perfil privado</p>
          <p className="text-sm text-contrast/75">
            {profile.name} preferiu não mostrar a estante.
          </p>
        </div>
      )}
    </div>
  );
}
