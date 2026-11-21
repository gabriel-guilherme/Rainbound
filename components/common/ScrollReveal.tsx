"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef } from "react";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  /*
   * Posição do item num grupo que entra junto (ex.: tiras na mesma linha).
   * Cada passo atrasa um pouco a entrada.
   */
  order?: number;
  /* false: só aparece (útil no fim da página, onde não dá para rolar além). */
  exit?: boolean;
  /* Deslocamento vertical em px. */
  distance?: number;
};

/* Fração do trajeto na tela usada para entrar e para sair. */
const ENTER_SPAN = 0.22;
const EXIT_START = 0.78;
const ORDER_STEP = 0.03;

/*
 * Aparece subindo quando entra na tela e some subindo quando sai por cima,
 * acompanhando o scroll nos dois sentidos. Com "reduzir movimento" ativo,
 * mostra o conteúdo parado.
 */
export default function ScrollReveal({
  children,
  className,
  order = 0,
  exit = true,
  distance = 40,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const enterStart = Math.min(order * ORDER_STEP, 0.15);
  const enterEnd = enterStart + ENTER_SPAN;

  const input = exit
    ? [enterStart, enterEnd, EXIT_START, 1]
    : [enterStart, enterEnd];

  const opacity = useTransform(
    scrollYProgress,
    input,
    exit ? [0, 1, 1, 0] : [0, 1],
  );

  const y = useTransform(
    scrollYProgress,
    input,
    exit ? [distance, 0, 0, -distance] : [distance, 0],
  );

  return (
    <motion.div
      ref={ref}
      style={shouldReduceMotion ? undefined : { opacity, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
