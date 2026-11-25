import { abandonBook } from "@/app/(main)/library/[id]/actions";
import ConfirmSubmitButton from "@/components/common/ConfirmSubmitButton";

/* "Abandonar" com confirmação (widget "Parados"). */
export default function AbandonButton({ book }: { book: { id: number; title: string } }) {
  return (
    <form action={abandonBook.bind(null, book.id)}>
      <ConfirmSubmitButton
        message={`Marcar "${book.title}" como abandonado? O progresso continua salvo.`}
        className="btn-shelf cursor-pointer text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
      >
        Abandonar
      </ConfirmSubmitButton>
    </form>
  );
}
