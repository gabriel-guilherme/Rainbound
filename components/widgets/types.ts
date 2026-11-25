import type { WidgetLook, WidgetVariant } from "@/lib/dashboardLayout";

export type WidgetOwner = {
  id: string;
  /* Fuso do dono */
  timeZone: string;
};

/*
 * Props de todo widget. Na home, o dono é quem está logado; no perfil
 * (/u/<username>), o dono do perfil. Sem `isOwner`, o widget fica só para
 * ver: sem botões de ação e sem links para as páginas dos livros.
 */
export type WidgetProps = {
  variant: WidgetVariant;
  look: WidgetLook;
  owner: WidgetOwner;
  isOwner: boolean;
};
