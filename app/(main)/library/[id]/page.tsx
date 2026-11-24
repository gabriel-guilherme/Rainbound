import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { deleteBookAndRedirect } from "./actions";
import BackButton from "@/components/common/BackButton";
import ConfirmSubmitButton from "@/components/common/ConfirmSubmitButton";
import ProgressBar from "@/components/common/ProgressBar";
import { bookTabFromParam } from "@/components/forms/bookTabs";
import EditBookForm from "@/components/forms/EditBookForm";
import LogReadingForm from "@/components/forms/LogReadingForm";
import { requireApprovedUser } from "@/lib/session";
import { parseBookId } from "@/lib/utils";

export default async function BookDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string | string[] }>;
}) {
  const { id: userId } = await requireApprovedUser();
  const id = parseBookId((await params).id);
  const initialTab = bookTabFromParam((await searchParams).aba);

  if (id === null) {
    notFound();
  }

  /* Livro de outra pessoa responde 404, como se não existisse. */
  const book = await prisma.book.findFirst({
    where: { id, userId },
    include: { progress: true },
  });

  if (!book) {
    notFound();
  }

  /*
   * Aba Leitura: sem arquivo, o livro é lido fora do site e o progresso
   * é anotado à mão; com arquivo, o progresso vem do leitor.
   */
  const readingPanel = book.filePath ? (
    <section
      aria-label="Progresso de leitura"
      className="mx-auto flex w-full max-w-2xl flex-col gap-5 pt-2"
    >
      <ProgressBar
        percentage={book.status === "READ" ? 100 : (book.progress?.percentage ?? 0)}
      />

      <p className="text-sm text-contrast/60">
        O progresso é salvo pelo leitor do site enquanto você lê.
      </p>

      <Link
        href={`/read/${book.id}`}
        className="btn-shelf self-start bg-danger text-primary hover:bg-contrast max-sm:w-full"
      >
        <BookOpen size={18} aria-hidden="true" />
        Continuar lendo
      </Link>
    </section>
  ) : (
    <LogReadingForm
      bookId={book.id}
      pageCount={book.pageCount}
      progress={book.progress}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 pt-32">
      <BackButton />

      <div className="flex flex-col p-4 sm:p-6 md:p-10">
        <EditBookForm
          book={book}
          readingPanel={readingPanel}
          initialTab={initialTab}
        />

        <div className="mt-10 border-t-[12px] border-primary pt-6">
          <form action={deleteBookAndRedirect} className="w-full md:w-auto">
            <input type="hidden" name="id" value={book.id} />
            <ConfirmSubmitButton
              message={`Tem certeza que deseja excluir "${book.title}"?`}
              className="btn-shelf w-full text-danger ring-1 ring-inset ring-danger/45 hover:bg-danger/10 md:w-auto"
            >
              Excluir livro
            </ConfirmSubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
