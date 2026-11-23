/*
 * Erro ao abrir o arquivo, igual em todos os motores (PDF, EPUB, CBZ).
 */
export default function FileError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center"
    >
      <p className="title-shelf text-3xl">{title}</p>

      <p className="max-w-md text-sm text-contrast/50">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-shelf mt-2 bg-danger text-primary hover:bg-contrast"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
