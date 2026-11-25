import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resetProfileLayout, saveProfileLayout } from "@/app/profile/actions";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import WidgetSection from "@/components/widgets/WidgetSection";
import { buildWidgetSections } from "@/components/widgets/buildWidgetSections";
import DashboardEditor from "@/components/widgets/editor/DashboardEditor";
import { requireApprovedUser } from "@/lib/auth/session";
import { PROFILE_HIDDEN_WIDGETS } from "@/lib/profile/layout";
import { getTimeZone } from "@/lib/streak/server";
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
  /* No próprio perfil, o fuso do aparelho (como na home); para quem visita, o do dono. */
  const timeZone = isOwner ? await getTimeZone() : profile.timeZone;
  const owner = { id: profile.id, timeZone };

  const [stats, viewerFollows] = await Promise.all([
    canSeeContent ? getProfileStats(profile.id, timeZone) : null,
    isOwner ? false : isFollowing(viewer.id, profile.id),
  ]);

  const topSections = canSeeContent ? buildWidgetSections(profile.layout, "top", owner, isOwner) : [];
  const bottomSections = canSeeContent
    ? buildWidgetSections(profile.layout, "bottom", owner, isOwner)
    : [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 pt-32">
      <ProfileHeader profile={profile} isOwner={isOwner} viewerFollows={viewerFollows} />

      {stats ? (
        <>
          <ProfileStats stats={stats} />

          {isOwner && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-contrast/70">
                Os widgets abaixo aparecem para quem visita seu perfil
                {profile.isPublic ? "." : " (hoje o perfil está privado)."}
              </p>
              <DashboardEditor
                layout={profile.layout}
                onSave={saveProfileLayout}
                onReset={resetProfileLayout}
                note="Aparece para quem visita seu perfil"
                hiddenWidgets={PROFILE_HIDDEN_WIDGETS}
              />
            </div>
          )}

          {topSections.length > 0 && (
            <WidgetSection label="Widgets do perfil, em cima" sections={topSections} />
          )}
          {bottomSections.length > 0 && (
            <WidgetSection label="Widgets do perfil, embaixo" sections={bottomSections} />
          )}
          {topSections.length === 0 && bottomSections.length === 0 && (
            <p className="py-10 text-center text-sm text-contrast/70">
              {isOwner
                ? "Nenhum widget no perfil. Use \"Editar widgets\" para escolher o que mostrar."
                : `${profile.name} ainda não escolheu o que mostrar.`}
            </p>
          )}
        </>
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
