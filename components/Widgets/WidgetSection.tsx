"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { attachSwipe } from "@/lib/swipe";

export type WidgetSectionItem = {
  id: string;
  /* Nome da aba. */
  label: string;
  /* Widgets da seção, lado a lado a partir de md. */
  content: ReactNode[];
  /* Colunas no desktop (padrão: partes iguais). */
  columnsClassName?: string;
  /*
   * Celular (abaixo de md): em vez de empilhar, os widgets ficam numa
   * fileira com encaixe, cada um com ~85% da largura e a borda do
   * próximo aparecendo. Mantém o "lado a lado" de quando há espaço.
   */
  mobileSlides?: boolean;
};

/* Fileira com encaixe no celular; grade normal a partir de md. */
const MOBILE_SLIDES_CLASS =
  "max-md:grid-flow-col max-md:auto-cols-[85%] max-md:grid-cols-none max-md:items-stretch max-md:gap-3 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:snap-x max-md:snap-mandatory scrollbar-none";

type WidgetSectionProps = {
  sections: WidgetSectionItem[];
  /* Nome do carrossel para leitores de tela. */
  label: string;
};

/*
 * Carrossel de widgets do Início: cada seção é uma aba com um ou mais
 * widgets. Troca pelas abas, pelas setas, pelas setas do teclado (com
 * foco nas abas) ou arrastando para o lado no celular.
 */
export default function WidgetSection({ sections, label }: WidgetSectionProps) {
  const [current, setCurrent] = useState(0);
  /* Direção da última troca, para a animação entrar pelo lado certo. */
  const [direction, setDirection] = useState<1 | -1>(1);

  const shouldReduceMotion = useReducedMotion();
  const baseId = useId();

  const contentRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const total = sections.length;
  const section = sections[Math.min(current, total - 1)];

  function goTo(index: number) {
    const next = Math.min(Math.max(index, 0), total - 1);

    if (next === current) return;

    setDirection(next > current ? 1 : -1);
    setCurrent(next);
  }

  /* Passo a partir da seção atual, lido no fim do gesto (sem re-registrar). */
  const stepRef = useRef((delta: number) => goTo(current + delta));

  useEffect(() => {
    stepRef.current = (delta) => goTo(current + delta);
  });

  useEffect(() => {
    const content = contentRef.current;

    if (!content || total < 2) return;

    return attachSwipe(
      content,
      () => ({
        onPrevious: () => stepRef.current(-1),
        onNext: () => stepRef.current(1),
      }),
      { scrollRoot: content },
    );
  }, [total]);

  /* Setas, Home e End nas abas (padrão de tablist do WAI-ARIA). */
  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const targets: Record<string, number> = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: total - 1,
    };

    const target = targets[event.key];

    if (target === undefined) return;

    event.preventDefault();

    const next = Math.min(Math.max(target, 0), total - 1);

    goTo(next);
    tabRefs.current[next]?.focus();
  }

  if (!section) return null;

  /* Com um widget só não há o que deslizar. */
  const slides = Boolean(section.mobileSlides) && section.content.length > 1;

  /*
   * Variantes com `custom`: o AnimatePresence repassa a direção atual
   * também para a seção que está saindo (com `exit` inline ela usaria a
   * direção de quando entrou).
   */
  const offset = shouldReduceMotion ? 0 : 40;
  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * offset }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: -dir * offset }),
  };
  const stepClass =
    "flex size-10 shrink-0 cursor-pointer items-center justify-center text-contrast ring-2 ring-inset ring-contrast/20 transition-colors hover:bg-primary hover:ring-primary disabled:pointer-events-none disabled:opacity-25";

  return (
    <section aria-label={label} className="flex flex-col gap-4">
      {total > 1 && (
        <div className="flex items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label={label}
            className="scrollbar-none flex min-w-0 gap-1 overflow-x-auto"
          >
            {sections.map((item, index) => {
              const isCurrent = index === current;

              return (
                <button
                  key={item.id}
                  ref={(element) => {
                    tabRefs.current[index] = element;
                  }}
                  id={`${baseId}-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isCurrent}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={isCurrent ? 0 : -1}
                  onClick={() => goTo(index)}
                  onKeyDown={handleTabKeyDown}
                  className={[
                    "shrink-0 cursor-pointer px-3 py-1.5 font-display text-lg font-bold uppercase tracking-wide transition-colors",
                    isCurrent
                      ? "bg-contrast text-primary"
                      : "text-contrast/55 hover:bg-primary hover:text-contrast",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="hidden font-display text-lg font-bold tabular-nums text-contrast/40 sm:inline"
            >
              {current + 1}/{total}
            </span>

            <button
              type="button"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              aria-label="Seção anterior"
              className={stepClass}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => goTo(current + 1)}
              disabled={current === total - 1}
              aria-label="Próxima seção"
              className={stepClass}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={contentRef}
        id={`${baseId}-panel`}
        role={total > 1 ? "tabpanel" : undefined}
        aria-labelledby={total > 1 ? `${baseId}-tab-${section.id}` : undefined}
        /*
         * `relative` junto do overflow-hidden: sem ele, o Safari do iPhone
         * deixa a seção que entra deslizando (transform) escapar do corte e
         * alargar a página para a direita.
         */
        className="relative w-full overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={section.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
            className={[
              "grid grid-cols-1 items-start gap-6",
              section.columnsClassName ??
                (section.content.length > 1 ? "md:grid-cols-2" : ""),
              slides ? MOBILE_SLIDES_CLASS : "",
            ].join(" ")}
          >
            {section.content.map((widget, index) => (
              <div
                key={index}
                className={`min-w-0 ${slides ? "max-md:snap-start" : ""}`}
              >
                {widget}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
