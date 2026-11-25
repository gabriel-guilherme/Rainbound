import type { Metadata } from "next";
import Link from "next/link";

import ActivityItem from "@/components/profile/ActivityItem";
import FollowList from "@/components/profile/FollowList";
import PeopleSearchInput from "@/components/profile/PeopleSearchInput";
import { requireApprovedUser } from "@/lib/auth/session";
import { ACTIVITY_WINDOW_DAYS } from "@/lib/reading/activity";
import { FEED_LIMIT, getFollowingFeed } from "@/lib/profile/feed";
import { normalizePeopleQuery } from "@/lib/profile/rules";
import { searchPeople } from "@/lib/profile/search";
import { getTimeZone, todayIn } from "@/lib/streak/server";

export const metadata: Metadata = { title: "Pessoas" };

type Tab = "atividade" | "buscar";

function pageNow() {
  return Date.now();
}

/*
 * Pessoas (/pessoas), em duas abas:
 * - Atividade (padrão): a sua e a de quem você segue, do mais novo ao
 *   mais antigo (lib/profile/feed.ts);
 * - Buscar (?aba=buscar&q=): por nome ou @usuário; sem texto, quem entrou
 *   no Rainbound por último.
 */
export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; aba?: string | string[] }>;
}) {
  const viewer = await requireApprovedUser();
  const params = await searchParams;
  const raw = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = normalizePeopleQuery(raw);
  const tab: Tab = params.aba === "buscar" || query ? "buscar" : "atividade";

  const tabs: { id: Tab; label: string; href: string }[] = [
    { id: "atividade", label: "Atividade", href: "/pessoas" },
    { id: "buscar", label: "Buscar", href: "/pessoas?aba=buscar" },
  ];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 pt-32">
      <div>
        <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">Pessoas</h1>
        <p className="mt-2 text-sm text-contrast/70">
          Acompanhe quem você segue e encontre quem também lê no Rainbound.
        </p>
      </div>

      <nav aria-label="Seções de pessoas" className="flex gap-1">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            scroll={false}
            aria-current={tab === item.id ? "page" : undefined}
            className={`px-3 py-1.5 font-display text-lg font-bold uppercase tracking-wide transition-colors ${
              tab === item.id
                ? "bg-contrast text-primary"
                : "text-contrast/70 hover:bg-primary hover:text-contrast"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {tab === "buscar" ? (
        <SearchTab query={query} viewerId={viewer.id} />
      ) : (
        <ActivityTab viewerId={viewer.id} />
      )}
    </div>
  );
}

async function SearchTab({ query, viewerId }: { query: string; viewerId: string }) {
  const people = await searchPeople(query, viewerId);

  return (
    <>
      <PeopleSearchInput q={query} />

      <section aria-live="polite" className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-widest text-contrast/70">
          {query ? `Resultados para “${query}”` : "Chegaram por último"}
        </h2>

        <FollowList
          people={people}
          viewerId={viewerId}
          emptyText={query ? "Ninguém encontrado com esse nome ou usuário." : "Ainda não há ninguém por aqui."}
        />
      </section>
    </>
  );
}

async function ActivityTab({ viewerId }: { viewerId: string }) {
  const feed = await getFollowingFeed(viewerId, todayIn(await getTimeZone()));
  const now = pageNow();

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs uppercase tracking-widest text-contrast/70">
        Você e quem você segue · últimos {ACTIVITY_WINDOW_DAYS} dias
      </h2>

      {feed.followingCount === 0 && (
        <p className="bg-primary px-5 py-4 text-sm text-contrast/75">
          Você ainda não segue ninguém.{" "}
          <Link href="/pessoas?aba=buscar" className="text-danger hover:underline">
            Buscar pessoas
          </Link>{" "}
          para ver a atividade delas aqui.
        </p>
      )}

      {feed.items.length === 0 ? (
        <p className="bg-primary px-5 py-10 text-center text-sm text-contrast/75">
          Nenhuma atividade por enquanto.
        </p>
      ) : (
        <ol className="flex flex-col bg-primary px-4 sm:px-5">
          {feed.items.map(({ event, person }, index) => (
            <li key={`${event.userId}-${event.kind}-${index}`} className="border-t border-contrast/10 first:border-t-0">
              <ActivityItem event={event} isMine={event.userId === viewerId} person={person} now={now} />
            </li>
          ))}
        </ol>
      )}

      {feed.items.length >= FEED_LIMIT && (
        <p className="text-center text-xs text-contrast/60">Mostrando as {FEED_LIMIT} mais recentes.</p>
      )}
    </section>
  );
}
