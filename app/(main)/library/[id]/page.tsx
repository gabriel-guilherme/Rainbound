import Link from "next/link";
import { BookOpen } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { deleteBookAndRedirect } from "./actions";
import BackButton from "@/components/common/BackButton";
import ConfirmSubmitButton from "@/components/common/ConfirmSubmitButton";
import EditBookForm from "@/components/forms/EditBookForm";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await prisma.book.findUnique({ where: { id: Number(id) } });

  if (!book) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 pt-32">
      <BackButton />

      <div className="flex flex-col p-4 sm:p-6 md:p-10">
        <EditBookForm book={book} />

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-contrast/10 pt-6 md:flex-row md:items-center md:justify-between">
          <form action={deleteBookAndRedirect} className="w-full md:w-auto">
            <input type="hidden" name="id" value={book.id} />
            <ConfirmSubmitButton
              message={`Tem certeza que deseja excluir "${book.title}"?`}
              className="w-full cursor-pointer rounded-3xl border border-danger/40 px-5 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/10 md:w-auto"
            >
              Excluir livro
            </ConfirmSubmitButton>
          </form>

          {book.filePath && (
            <Link
              href={`/read/${book.id}`}
              className="flex items-center justify-center gap-2 rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 text-sm font-medium text-contrast transition-colors hover:bg-interaction hover:text-primary"
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
