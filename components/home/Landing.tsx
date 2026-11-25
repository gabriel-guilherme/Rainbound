import Link from "next/link";

import HomeHero from "./HomeHero";

/*
 * Home de quem não está logado: apresenta o app e leva ao login ou ao
 * pedido de acesso. Só descreve o que o app já faz.
 */
const FEATURES = [
  {
    title: "Estante",
    text: "Livros, quadrinhos e mangás organizados por status: quero ler, lendo, lido ou abandonado.",
    className: "bg-secondary text-contrast lg:min-h-72",
  },
  {
    title: "Leitor",
    text: "PDF, EPUB e CBZ direto no navegador, com temas Noite, Sépia e Claro e tela cheia no celular.",
    className: "bg-interaction-contrast text-contrast lg:min-h-80",
  },
  {
    title: "Marcadores",
    text: "“Onde parei” avança sozinho; os marcadores com nome guardam os trechos que você quer reencontrar.",
    className: "bg-danger text-primary lg:min-h-64",
  },
  {
    title: "Notas",
    text: "Pensamentos guardados entre as páginas, como papéis soltos dentro do livro.",
    className: "bg-contrast text-primary lg:min-h-76",
  },
];

export default function Landing() {
  return (
    <div className="w-full bg-darkest text-contrast">
      <HomeHero
        actions={
          <>
            <Link
              href="/cadastro"
              className="btn-shelf h-13 w-full bg-danger px-6 text-primary shadow-[6px_6px_0_rgb(0_0_0/0.45)] hover:bg-contrast sm:w-auto"
            >
              Pedir acesso
            </Link>
            <Link
              href="/login"
              className="btn-shelf h-13 w-full border-2 border-contrast/35 px-6 text-contrast hover:border-contrast sm:w-auto"
            >
              Já tenho conta
            </Link>
          </>
        }
      />

      <section aria-labelledby="landing-features" className="bg-primary px-4 pt-20 sm:px-8 lg:pt-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex flex-col gap-2">
            <p className="text-sm uppercase tracking-[0.3em] text-danger">Na estante</p>
            <h2 id="landing-features" className="title-shelf text-5xl sm:text-6xl">
              Tudo o que você lê, num lugar só
            </h2>
          </div>

          <ul className="grid items-end gap-1.5 border-b-[14px] border-darkest sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5 lg:border-b-[18px]">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className={`flex flex-col justify-between gap-6 p-6 shadow-[inset_0_4px_0_rgb(255_255_255/0.07),inset_0_-8px_12px_rgb(0_0_0/0.3)] ${feature.className}`}
              >
                <h3 className="title-shelf text-4xl">{feature.title}</h3>
                <p className="text-base leading-relaxed opacity-85">{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-secondary px-4 py-20 sm:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-7 text-center">
          <p className="font-reading text-2xl italic leading-snug sm:text-3xl">
            Sua próxima página está esperando.
          </p>
          <Link
            href="/cadastro"
            className="btn-shelf h-13 bg-danger px-7 text-primary shadow-[6px_6px_0_rgb(0_0_0/0.45)] hover:bg-contrast"
          >
            Pedir acesso
          </Link>
        </div>
      </section>
    </div>
  );
}
