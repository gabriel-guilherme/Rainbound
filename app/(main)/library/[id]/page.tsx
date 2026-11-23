import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { deleteBookAndRedirect } from "./actions";
import BackButton from "@/components/common/BackButton";
import ConfirmSubmitButton from "@/components/common/ConfirmSubmitButton";
import EditBookForm from "@/components/forms/EditBookForm";
import { requireApprovedUser } from "@/lib/session";
import { parseBookId } from "@/lib/utils";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await requireApprovedUser();
  const id = parseBookId((await params).id);

  if (id === null) {
    notFound();
  }

  /* Livro de outra pessoa responde 404, como se não existisse. */
  const book = await prisma.book.findFirst({ where: { id, userId } });

  if (!book) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 pt-32">
      <BackButton />

      <div className="flex flex-col p-4 sm:p-6 md:p-10">
        <EditBookForm book={book} />

        <div className="mt-10 flex flex-col-reverse gap-3 border-t-[12px] border-primary pt-6 md:flex-row md:items-center md:justify-between">
          <form action={deleteBookAndRedirect} className="w-full md:w-auto">
            <input type="hidden" name="id" value={book.id} />
            <ConfirmSubmitButton
              message={`Tem certeza que deseja excluir "${book.title}"?`}
              className="btn-shelf w-full text-danger ring-1 ring-inset ring-danger/45 hover:bg-danger/10 md:w-auto"
            >
              Excluir livro
            </ConfirmSubmitButton>
          </form>

          {book.filePath && (
            <Link
              href={`/read/${book.id}`}
              className="btn-shelf bg-danger text-primary hover:bg-contrast"
            >
              <BookOpen size={18} aria-hidden="true" />
              Ler agora
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
