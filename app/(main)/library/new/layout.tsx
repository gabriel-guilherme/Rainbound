import { requireApprovedUser } from "@/lib/session";

/*
 * A página de cadastro é um componente de cliente e não confere a sessão;
 * este layout barra quem não está aprovado antes de mostrar o formulário.
 */
export default async function NewBookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireApprovedUser();

  return children;
}
