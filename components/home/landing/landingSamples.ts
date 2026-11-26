import type { ReadingStatus } from "@/generated/prisma/enums";
import { getSpineLook } from "@/lib/books/spine";
import { addDays, type StreakDay } from "@/lib/streak/rules";

/*
 * Exemplos da home de quem não está logado: livros, pessoas e dias
 * inventados, só para mostrar as peças do app.
 */

type SampleBook = {
  title: string;
  creator: string;
  status: ReadingStatus;
  percentage: number;
  pages: number;
};

const BOOKS: SampleBook[] = [
  { title: "Drácula", creator: "Bram Stoker", status: "WANT_TO_READ", percentage: 0, pages: 420 },
  { title: "Iracema", creator: "José de Alencar", status: "READ", percentage: 100, pages: 150 },
  { title: "O Cortiço", creator: "Aluísio Azevedo", status: "READING", percentage: 45, pages: 312 },
  { title: "O Alienista", creator: "Machado de Assis", status: "READ", percentage: 100, pages: 96 },
  { title: "Lucíola", creator: "José de Alencar", status: "WANT_TO_READ", percentage: 0, pages: 200 },
  { title: "Frankenstein", creator: "Mary Shelley", status: "READING", percentage: 71, pages: 280 },
  { title: "Senhora", creator: "José de Alencar", status: "ABANDONED", percentage: 30, pages: 240 },
  { title: "Moby Dick", creator: "Herman Melville", status: "READING", percentage: 13, pages: 620 },
  { title: "Quincas Borba", creator: "Machado de Assis", status: "READ", percentage: 100, pages: 330 },
];

export const SAMPLE_SPINES = BOOKS.map((book) => ({
  book,
  look: getSpineLook(`landing-${book.title}`, "BOOK", book.pages),
}));

export const SAMPLE_QUEUE = [
  { title: "Drácula", color: "var(--color-spine-wine)" },
  { title: "Iracema", color: "var(--color-spine-sand)" },
  { title: "O Cortiço", color: "var(--color-interaction-contrast)" },
  { title: "Senhora", color: "var(--color-spine-umber)" },
];

export const SAMPLE_TODAY = "2026-11-26";

export const SAMPLE_WEEK: StreakDay[] = Array.from({ length: 7 }, (_, index) => ({
  date: addDays(SAMPLE_TODAY, index - 6),
  seconds: index === 6 ? 14 * 60 : 25 * 60,
  met: index < 6,
}));

/* Últimos seis meses (26 semanas × 7 dias): 0 = nada, 3 = muito. */
export const SAMPLE_YEAR = Array.from({ length: 26 * 7 }, (_, index) => {
  const value = (index * 37 + (index % 11) * 13) % 10;

  return value < 3 ? 0 : value < 5 ? 1 : value < 8 ? 2 : 3;
});

export const SAMPLE_PEOPLE = [
  {
    letter: "M",
    background: "#114d4d",
    foreground: "#e0e4ce",
    text: "Marina terminou Drácula",
    when: "há 2 horas",
  },
  {
    letter: "C",
    background: "#d4a09a",
    foreground: "#27191c",
    text: "Caio começou O Cortiço",
    when: "ontem",
  },
  {
    letter: "L",
    background: "#5b4a3e",
    foreground: "#e0e4ce",
    text: "Lia colocou Senhora na fila",
    when: "23 de nov.",
  },
];
