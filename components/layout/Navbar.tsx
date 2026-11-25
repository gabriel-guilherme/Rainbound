"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudRainWind } from "lucide-react-motion";
import { House, Library, Plus, Users } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

import type { Avatar } from "@/lib/profile/avatar";

import NotificationBell from "@/components/notifications/NotificationBell";

import AccountMenu from "./AccountMenu";

/* Usuário aprovado logado (null: visitante, vê só a marca e "Entrar"). */
export type NavbarAccount = {
  username: string;
  profileUsername: string | null;
  avatar: Avatar;
  isAdmin: boolean;
  pendingRequests: number;
  unreadNotifications: number;
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
  const isPeopleRoute = pathname === "/pessoas";

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
              aria-label="Início"
              title="Início"
              aria-current={isDashboardRoute ? "page" : undefined}
              className={`flex h-10 items-center px-2 text-sm font-medium uppercase tracking-widest text-contrast transition sm:h-auto sm:px-1 sm:py-1 sm:text-base ${
                isDashboardRoute
                  ? "shadow-[inset_0_-2px_0_var(--color-danger)]"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              {/* No celular, ícone no lugar do texto. */}
              <House size={20} aria-hidden="true" className="sm:hidden" />
              <span className="hidden sm:inline">Início</span>
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
              aria-label="Biblioteca"
              title="Biblioteca"
              aria-current={isBookRoute && !isNewBookRoute ? "page" : undefined}
              className={`flex h-10 items-center px-2 text-sm font-medium uppercase tracking-widest text-contrast transition sm:h-auto sm:px-1 sm:py-1 sm:text-base ${
                isBookRoute && !isNewBookRoute
                  ? "shadow-[inset_0_-2px_0_var(--color-danger)]"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Library size={20} aria-hidden="true" className="sm:hidden" />
              <span className="hidden sm:inline">Biblioteca</span>
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

          {account && (
            <Link
              href="/pessoas"
              aria-label="Pessoas"
              title="Pessoas"
              aria-current={isPeopleRoute ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center transition-colors ${
                isPeopleRoute
                  ? "bg-contrast text-primary"
                  : "text-contrast/70 hover:bg-contrast/10 hover:text-contrast"
              }`}
            >
              <Users size={19} />
            </Link>
          )}

          {account && <NotificationBell initialUnread={account.unreadNotifications} />}

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

          {account && (
            <AccountMenu
              displayName={account.username}
              profileUsername={account.profileUsername}
              avatar={account.avatar}
              pendingRequests={account.isAdmin ? account.pendingRequests : null}
            />
          )}
        </div>
      </div>
    </motion.nav>
  );
}
