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
  const isBookRoute = pathname === "/books" || pathname.startsWith("/books/");
  const isNewBookRoute = pathname === "/books/new";

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : "-100%" }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="fixed left-0 top-0 z-50 h-24 w-full bg-primary shadow-md shadow-black/25"
    >
      <div className="font-sans mx-auto grid h-full grid-cols-[1fr_auto] items-center px-2 sm:grid-cols-[1fr_auto_1fr] sm:px-4">
        <div className="hidden sm:block" />

        <div className="flex items-center justify-self-start gap-3 sm:gap-6 sm:justify-self-auto">
          <Link
            href="/dashboard"
            className={`text-sm font-medium text-contrast transition sm:text-xl ${
              isDashboardRoute ? "opacity-100" : "opacity-60 hover:opacity-100"
            }`}
          >
            Início
          </Link>

          <Link
            href="/"
            data-motion-icon-group
            className={`order-first flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap text-2xl font-bold text-contrast transition sm:order-none ${
              isHomeRoute
                ? "text-interaction opacity-100"
                : "opacity-60 hover:text-interaction"
            }`}
          >
            <CloudRainWind aria-hidden="true" trigger="parent-hover" />

            <span className="hidden sm:inline">Rainbound</span>
          </Link>

          <Link
            href="/books"
            className={`text-sm font-medium text-contrast transition sm:text-xl ${
              isBookRoute ? "opacity-100" : "opacity-60 hover:opacity-100"
            }`}
          >
            Biblioteca
          </Link>
        </div>

        <div className="mr-1 flex justify-end sm:mr-4">
          <Link
            href="/books/new"
            aria-label="Adicionar livro"
            className={`flex h-10 w-10 items-center justify-center rounded-lg bg-interaction text-xl text-contrast transition hover:bg-interaction-hover hover:bg-interaction-contrast hover:text-primary ${
              isNewBookRoute ? "bg-interaction-contrast text-primary" : ""
            }`}
          >
            <Plus />
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
