"use client";

import Link from "next/link";
import { CloudRainWind } from "lucide-react";
import { useState, type ReactNode } from "react";

import RainWindow from "@/components/RainWindow/RainWindow";

/*
 * Moldura das telas de login, cadastro e espera
 */
export default function AuthShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const [isRainPaused, setIsRainPaused] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-darkest text-contrast lg:flex-row">
      <section
        aria-label="Janela de chuva"
        className="relative hidden flex-1 flex-col items-center justify-center overflow-hidden bg-primary lg:flex"
      >
        <RainWindow isPaused={isRainPaused} setIsPaused={setIsRainPaused} />

        <p className="max-w-md px-10 pb-12 text-center font-reading text-xl italic text-contrast/75">
          Lá fora chove. Aqui dentro, a página onde você parou continua
          esperando.
        </p>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-5 bg-secondary shadow-[0_-6px_0_-1px_rgb(0_0_0/0.45)]" />
      </section>

      {/* Celular: só uma faixa da janela no topo. */}
      <div
        aria-hidden="true"
        className="h-28 shrink-0 border-b-[12px] border-secondary bg-[linear-gradient(180deg,#0d2a2b_0%,var(--color-interaction-contrast)_70%,#1b3436_100%)] lg:hidden"
      />

      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:py-14">
        <div className="flex w-full max-w-sm flex-col gap-7">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 self-start text-contrast transition-colors hover:text-danger"
          >
            <CloudRainWind aria-hidden="true" size={26} className="text-danger" />
            <span className="title-shelf text-2xl tracking-[0.08em]">Rainbound</span>
          </Link>

          <div className="flex flex-col gap-3">
            <p className="text-xs uppercase tracking-[0.3em] text-danger">{eyebrow}</p>
            <h1 className="title-shelf text-6xl">{title}</h1>
          </div>

          {children}
        </div>
      </section>
    </div>
  );
}
