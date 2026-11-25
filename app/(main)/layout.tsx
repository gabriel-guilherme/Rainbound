import Navbar, { type NavbarAccount } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ReadingTracker from "@/components/reading-streak/ReadingTracker";
import { AccountStatus, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/services/prisma";
import { getCurrentUser, isApproved } from "@/lib/auth/session";
import { getAvatar } from "@/lib/profile/avatar";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  let account: NavbarAccount | null = null;

  if (isApproved(user)) {
    const isAdmin = user.role === Role.ADMIN;

    const [profile, pendingRequests] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, username: true, avatarColor: true, avatarLetter: true },
      }),
      /* Aviso de pedidos esperando, só para o admin. */
      isAdmin ? prisma.user.count({ where: { status: AccountStatus.PENDING } }) : 0,
    ]);

    account = {
      username: user.username,
      profileUsername: profile?.username ?? null,
      avatar: getAvatar(
        profile ?? { id: user.id, name: user.username, avatarColor: null, avatarLetter: null },
      ),
      isAdmin,
      pendingRequests,
    };
  }

  return (
    /*
     * overflow-x-clip: nada alarga a página para os lados (no celular, isso
     * arrastava o cabeçalho fixo para fora da tela). `clip`, e não
     * `hidden`, para não virar uma área de rolagem.
     */
    <div className="flex flex-col overflow-x-clip bg-secondary">
      <Navbar account={account} />

      {/*
        * O conteúdo ocupa no mínimo uma tela: o footer começa onde a
        * primeira tela termina, em toda página. `svh` (tela com a barra do
        * navegador do celular visível) para o footer não pular quando a
        * barra some ao rolar.
        */}
      <main className="min-h-svh">{children}</main>

      <Footer />

      {account && <ReadingTracker />}
    </div>
  );
}
