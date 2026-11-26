import type { ReactNode } from "react";

import ScrollReveal from "@/components/common/ScrollReveal";

type LandingFeatureProps = {
  label: string;
  title: string;
  text: string;
  items?: string[];
  /* Peça do app mostrada ao lado do texto. */
  preview: ReactNode;
  /* Prévia à esquerda no computador. */
  reverse?: boolean;
  /* A prévia tem controles: fica visível para leitores de tela. */
  interactive?: boolean;
  className?: string;
};

/* Seção da home de visitante: texto de um lado, prévia do outro. */
export default function LandingFeature({
  label,
  title,
  text,
  items = [],
  preview,
  reverse = false,
  interactive = false,
  className = "",
}: LandingFeatureProps) {
  return (
    <section className={`w-full px-4 sm:px-8 lg:px-10 ${className}`}>
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <ScrollReveal
          className={`flex flex-col gap-4 max-lg:items-center max-lg:text-center lg:col-span-5 ${reverse ? "lg:order-2" : ""}`}
        >
          <p className="font-display text-sm font-extrabold tracking-[0.2em] text-interaction">
            {label}
          </p>

          <h2 className="title-shelf text-balance text-5xl text-contrast sm:text-6xl">{title}</h2>

          <p className="max-w-md text-pretty leading-relaxed text-contrast/70 max-lg:text-balance">{text}</p>

          {items.length > 0 && (
            <ul className="mt-1 flex flex-col gap-2.5 max-lg:items-center">
              {items.map((item) => (
                <li key={item} className="text-[15px] text-contrast/80 max-lg:text-balance max-lg:text-center lg:flex lg:items-baseline lg:gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block size-2 bg-danger align-middle lg:mr-0 lg:shrink-0"
                  />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </ScrollReveal>

        <ScrollReveal
          order={1}
          distance={60}
          className={`min-w-0 lg:col-span-7 ${reverse ? "lg:order-1" : ""}`}
        >
          <div aria-hidden={interactive ? undefined : true}>{preview}</div>
        </ScrollReveal>
      </div>
    </section>
  );
}
