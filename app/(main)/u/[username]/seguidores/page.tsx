import type { Metadata } from "next";

import ProfileFollowsPage from "@/components/profile/ProfileFollowsPage";

type PageProps = { params: Promise<{ username: string }> };

export const metadata: Metadata = { title: "Seguidores" };

export default async function Page({ params }: PageProps) {
  return <ProfileFollowsPage username={(await params).username} direction="followers" variant="page" />;
}
