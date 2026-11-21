"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloudRainWind } from "lucide-react-motion";
import { Plus } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

export default function Navbar() {
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

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : "-100%" }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="fixed left-0 top-0 z-50 h-20 w-full border-b border-contrast/10 bg-primary sm:h-24"
    >
      <div className="font-sans mx-auto grid h-full grid-cols-[1fr_auto] items-center px-2 sm:grid-cols-[1fr_auto_1fr] sm:px-4">
        <div className="hidden sm:block" />

        <div className="flex items-center justify-self-start gap-3 sm:gap-6 sm:justify-self-auto">
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
        </div>

        <div className="mr-1 flex justify-end sm:mr-4">
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
        </div>
      </div>
    </motion.nav>
  );
}
