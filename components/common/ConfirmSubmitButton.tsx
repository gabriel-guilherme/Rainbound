"use client";

type ConfirmSubmitButtonProps = {
  message: string;
  className?: string;
  children: React.ReactNode;
};

/*
 * Botão de submit que pede confirmação antes de enviar o formulário.
 */
export default function ConfirmSubmitButton({
  message,
  className = "",
  children,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!confirm(message)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {children}
    </button>
  );
}
