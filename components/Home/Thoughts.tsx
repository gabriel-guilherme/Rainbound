import ScrollReveal from "@/components/common/ScrollReveal";

type BookNotes = {
  title: string;
  note: string;
};

type ThoughtsProps = {
  books: BookNotes[];
};

/* Exemplos mostrados enquanto ainda não há notas suficientes. */
const FALLBACK_NOTES: BookNotes[] = [
  { title: "Moby Dick", note: "Talvez isso fosse um prenúncio o tempo todo..." },
  { title: "Orgulho e Preconceito", note: "Lembrar deste capítulo." },
  {
    title: "O Nome do Vento",
    note: "Algumas histórias ficam com a gente muito depois da última página.",
  },
  { title: "Dom Casmurro", note: "Gostei muito desse personagem." },
];

/*
 * Posição de cada tira na grade de 12 colunas (desktop) e a leve rotação,
 * como papéis soltos guardados entre as páginas.
 */
const SLIP_LAYOUT = [
  { place: "lg:col-start-7 lg:col-end-13", tilt: "-rotate-[1.5deg]" },
  { place: "lg:col-start-2 lg:col-end-7 lg:mt-6", tilt: "rotate-1" },
  { place: "lg:col-start-8 lg:col-end-13 lg:mt-2", tilt: "-rotate-[0.6deg]" },
  { place: "lg:col-start-4 lg:col-end-10 lg:mt-5", tilt: "rotate-[0.8deg]" },
];

export default function Thoughts({ books }: ThoughtsProps) {
  const notes = SLIP_LAYOUT.map(
    (_, index) => books[index] ?? FALLBACK_NOTES[index],
  );

  return (
    <section className="w-full bg-darkest px-4 py-20 sm:px-8 lg:px-16 lg:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-8 border-b-[12px] border-primary bg-secondary px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-12 lg:gap-6">
        <ScrollReveal className="flex flex-col gap-3 lg:col-start-1 lg:col-end-6">
          <p className="text-sm uppercase tracking-[0.3em] text-danger">
            Das suas leituras
          </p>

          <h2 className="title-shelf text-balance text-[clamp(3rem,5.5vw,4.75rem)] text-contrast">
            Pequenos pensamentos
          </h2>

          <p className="max-w-sm text-pretty text-contrast/60">
            Trechos de ideias e momentos que você deixou pelo caminho,
            guardados entre as páginas.
          </p>
        </ScrollReveal>

        {notes.map((book, index) => (
          <ScrollReveal
            key={`${book.title}-${index}`}
            order={index + 1}
            distance={60}
            className={SLIP_LAYOUT[index].place}
          >
            <figure
              className={`flex flex-col gap-2 border-t-[6px] border-danger bg-contrast px-5 pb-4 pt-4 text-primary shadow-[0_16px_24px_-14px_rgb(0_0_0/0.8)] ${SLIP_LAYOUT[index].tilt}`}
            >
              <blockquote className="line-clamp-4 font-reading text-[clamp(1.125rem,1.6vw,1.375rem)] italic leading-snug">
                “{book.note}”
              </blockquote>

              <figcaption className="truncate font-display text-sm font-bold uppercase tracking-wide text-primary/65">
                {book.title}
              </figcaption>
            </figure>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
