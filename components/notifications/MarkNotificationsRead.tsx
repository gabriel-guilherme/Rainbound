"use client";

import { useEffect } from "react";

import { markNotificationsRead } from "@/app/notifications/actions";

/*
 * Marca as notificações como lidas quando a página /notificacoes abre de
 * verdade no navegador (e não num pré-carregamento de link).
 */
export default function MarkNotificationsRead() {
  useEffect(() => {
    markNotificationsRead().catch(console.error);
  }, []);

  return null;
}
