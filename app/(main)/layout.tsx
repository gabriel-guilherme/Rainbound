import Navbar, { type NavbarAccount } from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AccountStatus, Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, isApproved } from "@/lib/session";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  let account: NavbarAccount | null = null;

  if (isApproved(user)) {
    const isAdmin = user.role === Role.ADMIN;

    account = {
      username: user.username,
      isAdmin,
      /* Aviso de pedidos esperando, só para o admin. */
      pendingRequests: isAdmin
        ? await prisma.user.count({ where: { status: AccountStatus.PENDING } })
        : 0,
    };
  }

  return (
    <div className="flex flex-col bg-secondary">
      <Navbar account={account} />

      {/*
        * O conteúdo ocupa no mínimo uma tela: o footer começa onde a
        * primeira tela termina, em toda página. `svh` (tela com a barra do
        * navegador do celular visível) para o footer não pular quando a
        * barra some ao rolar.
        */}
      <main className="min-h-svh">{children}</main>

      <Footer />
    </div>
  );
}
