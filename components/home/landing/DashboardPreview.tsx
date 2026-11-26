import { SAMPLE_QUEUE } from "./landingSamples";

const TABS = ["Estante", "Fila", "Sessão", "Sequência", "Quase lá"];

export default function DashboardPreview() {
  return (
    <div className="grid gap-3.5 sm:grid-cols-2">
      <div className="scrollbar-none flex gap-1 overflow-x-auto sm:col-span-2">
        {TABS.map((tab, index) => (
          <span
            key={tab}
            className={`shrink-0 px-3 py-1.5 font-display text-base font-bold uppercase tracking-wide ${
              index === 0 ? "bg-primary text-contrast" : "text-contrast/50"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-4 bg-primary p-5 sm:col-span-2">
        <div className="flex h-9">
          <span className="grow-[3] bg-interaction" />
          <span className="grow-[14] bg-secondary" />
          <span className="grow-[9] bg-interaction-contrast" />
          <span className="grow-[2] bg-danger" />
        </div>

        <div className="flex flex-wrap gap-x-7 gap-y-2 text-xs text-contrast/55">
          <span><b className="title-shelf mr-1.5 text-3xl text-contrast">28</b>na estante</span>
          <span><b className="title-shelf mr-1.5 text-3xl text-contrast">3</b>lendo</span>
          <span><b className="title-shelf mr-1.5 text-3xl text-contrast">14</b>lidos</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 bg-primary p-5">
        <span className="title-shelf text-3xl text-contrast">Fila</span>

        <div className="grid grid-cols-4 gap-2">
          {SAMPLE_QUEUE.map((book) => (
            <span
              key={book.title}
              className="flex aspect-[7/10] items-end p-1.5 font-display text-xs font-extrabold uppercase leading-none text-contrast"
              style={{ background: book.color }}
            >
              {book.title}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-primary p-5">
        <span className="title-shelf text-3xl text-contrast">Sessão</span>
        <span className="title-shelf text-6xl tabular-nums text-contrast">25:00</span>

        <div className="flex gap-1.5 text-[13px]">
          <span className="bg-interaction px-3 py-1.5 text-darkest">Timer</span>
          <span className="bg-darkest px-3 py-1.5 text-contrast">Cronômetro</span>
        </div>
      </div>
    </div>
  );
}
