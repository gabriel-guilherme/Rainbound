import type { Metadata } from "next";

import FollowList from "@/components/profile/FollowList";
import PeopleSearchInput from "@/components/profile/PeopleSearchInput";
import { requireApprovedUser } from "@/lib/auth/session";
import { normalizePeopleQuery } from "@/lib/profile/rules";
import { searchPeople } from "@/lib/profile/search";

export const metadata: Metadata = { title: "Pessoas" };

/*
 * Busca de pessoas (/pessoas?q=): por nome ou @usuário. Sem texto, mostra
 * quem entrou no Rainbound por último.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const viewer = await requireApprovedUser();
  const raw = (await searchParams).q;
  const query = normalizePeopleQuery(Array.isArray(raw) ? raw[0] : raw);
  const people = await searchPeople(query, viewer.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 pt-32">
      <div>
        <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">Pessoas</h1>
        <p className="mt-2 text-sm text-contrast/70">
          Encontre quem também lê no Rainbound e siga para acompanhar.
        </p>
      </div>

      <PeopleSearchInput q={query} />

      <section aria-live="polite" className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-widest text-contrast/70">
          {query ? `Resultados para “${query}”` : "Chegaram por último"}
        </h2>

        <FollowList
          people={people}
          viewerId={viewer.id}
          emptyText={query ? "Ninguém encontrado com esse nome ou usuário." : "Ainda não há ninguém por aqui."}
        />
      </section>
    </div>
  );
}
