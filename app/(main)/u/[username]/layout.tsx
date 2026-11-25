import type { ReactNode } from "react";

/*
 * Perfil com o slot @modal: as listas de seguidores e seguindo abrem num
 * modal por cima do perfil quando se clica nos contadores (rota
 * interceptada); abertas direto pelo endereço, viram a página inteira.
 */
export default function ProfileLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
