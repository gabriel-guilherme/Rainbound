import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { deleteBook } from "./actions";
import BackButton from "@/components/BackButton";
import EditBookForm from "@/components/EditBookForm";

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

        <div className="mt-8 flex justify-end">
          <form action={deleteBook} className="w-full md:w-auto">
            <input type="hidden" name="id" value={book.id} />
            <button
              type="submit"
              className="w-full md:w-auto cursor-pointer rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-primary"
            >
              Excluir livro
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
