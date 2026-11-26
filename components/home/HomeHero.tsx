import type { ReactNode } from "react";

import HomeRainWindow from "./HomeRainWindow";

/*
 * Hero das duas homes (visitante e logado): mesma janela, mesmo título e
 * mesmo texto. Só as ações mudam (pedir acesso / continuar lendo).
 */
export default function HomeHero({
  actions,
  kicker = "Rainbound",
}: {
  actions: ReactNode;
  kicker?: string;
}) {
  return (
    <div className="w-full bg-darkest">
      <section className="mx-auto flex max-w-7xl flex-col-reverse items-center gap-6 px-6 pb-20 pt-28 sm:pt-32 lg:flex-row lg:gap-10 lg:px-10">
        <div className="w-full min-w-0 lg:flex-1">
          <HomeRainWindow />
        </div>

        <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center lg:flex-1 lg:items-start lg:text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-danger">{kicker}</p>

          <h1 className="title-shelf text-[clamp(3.25rem,13vw,5.5rem)] text-contrast lg:text-[clamp(4rem,5.4vw,6rem)]">
            Seu cantinho <br /> <span className="text-danger">de leitura</span>
          </h1>

          <p className="max-w-md text-pretty font-reading text-lg italic text-contrast/70 sm:text-xl">
            Um lugar tranquilo para seus livros, suas anotações e as histórias
            que você ainda não terminou.
          </p>

          <div className="flex w-full flex-col items-center gap-3 pt-2 sm:w-auto sm:flex-row lg:items-start">
            {actions}
          </div>
        </div>
      </section>
    </div>
  );
}
