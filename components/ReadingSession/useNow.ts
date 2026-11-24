"use client";

import { useSyncExternalStore } from "react";

/*
 * Relógio que bate a cada segundo, compartilhado por todos os componentes
 * que mostram a hora ou uma contagem (um só setInterval para todos).
 */

const tickListeners = new Set<() => void>();
let tickInterval: ReturnType<typeof setInterval> | null = null;

/*
 * Hora do último tique, em milissegundos exatos (sem arredondar para o
 * segundo: o fim do timer é guardado com milissegundos, e arredondar a
 * hora para baixo fazia a contagem mostrar 1 s a mais). Fica a mesma
 * entre um tique e outro, como o useSyncExternalStore exige.
 */
let currentNow: number | null = null;

function refreshNow() {
  currentNow = Date.now();
  tickListeners.forEach((tick) => tick());
}

function subscribeTick(listener: () => void) {
  tickListeners.add(listener);

  if (!tickInterval) {
    tickInterval = setInterval(refreshNow, 1000);
  }

  return () => {
    tickListeners.delete(listener);

    if (tickListeners.size === 0 && tickInterval) {
      clearInterval(tickInterval);
      tickInterval = null;
      /* Sem ninguém ouvindo, a próxima leitura pega a hora de novo. */
      currentNow = null;
    }
  };
}

function readNow() {
  currentNow ??= Date.now();

  return currentNow;
}

/*
 * Hora atual, atualizada a cada segundo. No servidor (e na hidratação)
 * é null: a hora do servidor não é a do navegador.
 */
export function useNow() {
  return useSyncExternalStore(subscribeTick, readNow, () => null);
}
