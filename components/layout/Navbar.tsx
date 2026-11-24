"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudRainWind } from "lucide-react-motion";
import { Inbox, Plus } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

import SignOutButton from "@/components/auth/SignOutButton";

/* Usuário aprovado logado (null: visitante, vê só a marca e "Entrar"). */
export type NavbarAccount = {
  username: string;
  isAdmin: boolean;
  pendingRequests: number;
};

export default function Navbar({ account }: { account: NavbarAccount | null }) {
  const pathname = usePathname();

  const [isVisible, setIsVisible] = useState(true);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;

    if (current <= 10) {
      setIsVisible(true);
      return;
    }

    if (current < previous) {
      setIsVisible(true);
    }

    if (current > previous) {
      setIsVisible(false);
    }
  });

  const isHomeRoute = pathname === "/";
  const isDashboardRoute = pathname === "/dashboard";
  const isBookRoute =
    pathname === "/library" || pathname.startsWith("/library/");
  const isNewBookRoute = pathname === "/library/new";
  const isRequestsRoute = pathname === "/admin/pedidos";

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : "-100%" }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      /*
       * Sombra suave para destacar do conteúdo. Some quando o cabeçalho se
       * esconde, senão ela apareceria como uma faixa no topo da tela.
       */
      className={`fixed left-0 top-0 z-50 h-20 w-full border-b border-contrast/10 bg-primary transition-shadow duration-300 sm:h-24 ${
        isVisible
          ? "shadow-[0_3px_0_-1px_rgb(0_0_0/0.35),0_12px_26px_-8px_rgb(0_0_0/0.8)]"
          : "shadow-none"
      }`}
    >
      <div className="font-sans mx-auto grid h-full grid-cols-[1fr_auto] items-center px-2 sm:grid-cols-[1fr_auto_1fr] sm:px-4">
        <div className="hidden sm:block" />

        <div className="flex items-center justify-self-start gap-3 sm:gap-6 sm:justify-self-auto">
          {account && (
            <Link
              href="/dashboard"
              aria-current={isDashboardRoute ? "page" : undefined}
              className={`px-1 py-1 text-sm font-medium uppercase tracking-widest text-contrast transition sm:text-base ${
                isDashboardRoute
                  ? "shadow-[inset_0_-2px_0_var(--color-danger)]"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              Início
            </Link>
          )}

          <Link
            href="/"
            data-motion-icon-group
            aria-label="Rainbound — página inicial"
            aria-current={isHomeRoute ? "page" : undefined}
            className={`title-shelf order-first flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-3xl transition sm:order-none ${
              isHomeRoute
                ? "text-interaction"
                : "text-contrast opacity-60 hover:text-interaction hover:opacity-100"
            }`}
          >
            <CloudRainWind aria-hidden="true" trigger="parent-hover" />

            <span className="hidden sm:inline">Rainbound</span>
          </Link>

          {account && (
            <Link
              href="/library"
              aria-current={isBookRoute && !isNewBookRoute ? "page" : undefined}
              className={`px-1 py-1 text-sm font-medium uppercase tracking-widest text-contrast transition sm:text-base ${
                isBookRoute && !isNewBookRoute
                  ? "shadow-[inset_0_-2px_0_var(--color-danger)]"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              Biblioteca
            </Link>
          )}
        </div>

        <div className="mr-1 flex items-center justify-end gap-1 sm:mr-4 sm:gap-2">
          {!account && (
            <Link
              href="/login"
              className="btn-shelf bg-danger text-primary hover:bg-contrast"
            >
              Entrar
            </Link>
          )}

          {account?.isAdmin && (
            <Link
              href="/admin/pedidos"
              aria-label={`Administração (${account.pendingRequests} pedidos esperando)`}
              title="Administração"
              aria-current={isRequestsRoute ? "page" : undefined}
              className={`relative flex h-10 w-10 items-center justify-center transition-colors ${
                isRequestsRoute
                  ? "bg-contrast text-primary"
                  : "text-contrast/70 hover:bg-contrast/10 hover:text-contrast"
              }`}
            >
              <Inbox size={19} />
              {account.pendingRequests > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-danger px-1 text-[11px] font-semibold tabular-nums text-primary"
                >
                  {account.pendingRequests}
                </span>
              )}
            </Link>
          )}

          {account && (
            <Link
              href="/library/new"
              aria-label="Adicionar livro"
              title="Adicionar livro"
              aria-current={isNewBookRoute ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center text-xl transition ${
                isNewBookRoute
                  ? "bg-contrast text-primary"
                  : "bg-danger text-primary hover:bg-contrast"
              }`}
            >
              <Plus />
            </Link>
          )}

          {account && <SignOutButton label={`Sair (${account.username})`} />}
        </div>
      </div>
    </motion.nav>
  );
}
