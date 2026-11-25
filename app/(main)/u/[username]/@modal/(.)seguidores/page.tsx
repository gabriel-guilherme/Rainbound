import ProfileFollowsPage from "@/components/profile/ProfileFollowsPage";

type PageProps = { params: Promise<{ username: string }> };

/* Lista por cima do perfil (rota interceptada de ../seguidores). */
export default async function Page({ params }: PageProps) {
  return <ProfileFollowsPage username={(await params).username} direction="followers" variant="modal" />;
}
