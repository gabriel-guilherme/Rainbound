import { Bell } from "lucide-react";

import Avatar from "@/components/profile/Avatar";

import { SAMPLE_PEOPLE } from "./landingSamples";

/* Cabeçalho de perfil (faixa de cor com a letra), atividade e um aviso. */
export default function PeoplePreview() {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
      <div className="overflow-hidden bg-primary">
        <div className="relative h-36 overflow-hidden bg-interaction-contrast">
          <span className="title-shelf absolute -bottom-10 -right-2 text-[14rem] text-contrast/90">
            M
          </span>
        </div>

        <div className="flex flex-col gap-3.5 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="title-shelf text-4xl text-contrast">Marina</p>
              <p className="text-[13px] text-contrast/55">@marina</p>
            </div>

            <span className="btn-shelf h-10 bg-danger text-primary shadow-[4px_4px_0_rgb(0_0_0/0.45)]">
              Seguir
            </span>
          </div>

          <p className="text-sm text-contrast/70">Clássicos brasileiros e terror de vez em quando.</p>

          <div className="flex gap-5 text-xs text-contrast/55">
            <span><b className="title-shelf mr-1 text-2xl text-contrast">42</b>livros</span>
            <span><b className="title-shelf mr-1 text-2xl text-contrast">18</b>seguidores</span>
            <span><b className="title-shelf mr-1 text-2xl text-contrast">12</b>seguindo</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 bg-primary p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-contrast/55">Quem você segue</p>

          {SAMPLE_PEOPLE.map((person) => (
            <div key={person.text} className="flex items-center gap-3 text-sm leading-snug text-contrast/85">
              <Avatar avatar={person} size={32} />
              <span>
                {person.text}
                <br />
                <span className="text-xs text-contrast/55">{person.when}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2.5 bg-contrast px-3.5 py-3 text-[13px] text-primary shadow-[0_14px_24px_-12px_rgb(0_0_0)]">
          <Bell size={18} />
          <span>
            <b>Caio</b> começou a seguir você
          </span>
        </div>
      </div>
    </div>
  );
}
