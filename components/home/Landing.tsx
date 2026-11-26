import Link from "next/link";

import ScrollReveal from "@/components/common/ScrollReveal";

import HomeHero from "./HomeHero";
import DashboardPreview from "./landing/DashboardPreview";
import LandingFeature from "./landing/LandingFeature";
import PeoplePreview from "./landing/PeoplePreview";
import ReaderPreview from "./landing/ReaderPreview";
import ShelfPreview from "./landing/ShelfPreview";
import StreakPreview from "./landing/StreakPreview";

/*
 * Home de quem não está logado: apresenta o app seção por seção, com peças
 * de exemplo, e leva ao login ou ao pedido de acesso. Só descreve o que o
 * app já faz.
 */
/* `short`: no celular, para caberem lado a lado numa linha. */
const FORMATS = [
  { label: "EPUB", short: "EPUB" },
  { label: "PDF", short: "PDF" },
  { label: "Quadrinhos e mangás em CBZ", short: "CBZ" },
  { label: "Livros lidos fora do app", short: "Lidos fora do app" },
];

function AccessButtons({ full = false }: { full?: boolean }) {
  const width = full ? "w-full sm:w-auto" : "";

  return (
    <>
      <Link
        href="/cadastro"
        className={`btn-shelf h-13 bg-danger px-6 text-primary shadow-[6px_6px_0_rgb(0_0_0/0.45)] hover:bg-contrast ${width}`}
      >
        Pedir acesso
      </Link>
      <Link
        href="/login"
        className={`btn-shelf h-13 border-2 border-contrast/35 px-6 text-contrast hover:border-contrast ${width}`}
      >
        Já tenho conta
      </Link>
    </>
  );
}

export default function Landing() {
  return (
    <div className="w-full bg-darkest text-contrast">
      <HomeHero
        kicker="Um app de leitura, por convite"
        description={
          /* Cada trecho fica inteiro: a linha só quebra entre eles. */
          <>
            <span className="inline-block">Sua estante, seu leitor</span>{" "}
            <span className="inline-block">e seus dias de leitura</span>{" "}
            <span className="inline-block">num lugar tranquilo.</span>
          </>
        }
        note="Cada pedido é aprovado à mão."
        actions={<AccessButtons full />}
      />

      <ul
        aria-label="Formatos"
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 whitespace-nowrap bg-secondary px-4 py-5 font-display text-base font-extrabold uppercase tracking-wider sm:gap-x-10 sm:text-xl"
      >
        {FORMATS.map((format, index) => (
          <li key={format.label} className="flex items-center gap-3 sm:gap-10">
            {index > 0 && (
              <span aria-hidden="true" className="text-danger max-sm:text-xs">
                ✦
              </span>
            )}
            <span className="sm:hidden">{format.short}</span>
            <span className="max-sm:hidden">{format.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-28 py-24 sm:gap-36 sm:py-32">
        <LandingFeature
          label="Estante"
          title="Lombadas, capas e fitas de status"
          text="Cada livro ganha lombada com a cor e a largura dele. A fita conta o status: quero ler, lendo, lido ou abandonado. Troque para capas quando quiser."
          items={[
            "Filtros por status, tipo e busca",
            "Livros lidos fora do app, com as páginas registradas à mão",
            "Até 200 MB por arquivo, com o espaço da conta sempre à vista",
          ]}
          interactive
          preview={<ShelfPreview />}
        />

        <LandingFeature
          reverse
          interactive
          label="Leitor"
          title="Abra e continue de onde parou"
          text="EPUB, PDF e quadrinhos direto no navegador, sem instalar nada. O lugar onde você parou anda sozinho, no computador ou no celular."
          items={[
            "Temas Noite, Sépia e Claro: experimente na engrenagem",
            "Marcadores com nome e notas entre as páginas",
            "Relógio, cronômetro e timer no rodapé",
          ]}
          preview={<ReaderPreview />}
        />
      </div>

      <div className="bg-primary py-20 sm:py-24">
        <LandingFeature
          label="Sequência"
          title="Um pouco por dia, todo dia"
          text="Escolha uma meta de minutos. Cada dia em que você chega nela soma uma gota na sequência, e o ano inteiro fica desenhado, dia a dia."
          preview={<StreakPreview />}
        />
      </div>

      <div className="flex flex-col gap-28 py-24 sm:gap-36 sm:py-32">
        <LandingFeature
          reverse
          label="Início"
          title="Um painel do seu jeito"
          text="Escolha os widgets, organize em abas e mude a ordem quando quiser: o que está lendo, a fila, o tempo de sessão, o ano em números."
          items={["Widgets de livros em capa ou lombada", "Uma arrumação para cada aparelho"]}
          preview={<DashboardPreview />}
        />

        <LandingFeature
          label="Pessoas"
          title="Leia junto, sem pressa"
          text="Seu perfil mostra a estante e os widgets que você escolher. Siga quem lê com você e veja o que essa pessoa começou e terminou. Prefere ficar na sua? Deixe o perfil privado."
          preview={<PeoplePreview />}
        />
      </div>

      <section className="bg-secondary px-4 py-20 sm:py-28">
        <ScrollReveal exit={false} className="mx-auto flex max-w-3xl flex-col items-center gap-7 text-center">
          <p className="font-reading text-3xl italic leading-snug sm:text-4xl">
            Sua próxima página está esperando.
          </p>

          <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
            <AccessButtons full />
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
