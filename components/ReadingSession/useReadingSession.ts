"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";

import {
  clampDuration,
  DEFAULT_SESSION_STATE,
  parseSessionState,
  readSessionRaw,
  readSessionState,
  subscribeSession,
  writeSessionState,
  type SessionMode,
  type SessionState,
} from "./sessionState";
import { getElapsedMs, getRemainingMs, isSessionActive } from "./sessionTime";
import { useNow } from "./useNow";

/*
 * Sessão de leitura no React: o estado salvo (sessionState.ts), a hora do
 * último tique (useNow) e as ações dos botões. Leitor e widget usam este
 * hook e veem a mesma sessão.
 */
export function useReadingSession() {
  /* Antes da hidratação usa o padrão (parado), como o servidor. */
  const raw = useSyncExternalStore(subscribeSession, readSessionRaw, () => null);
  const state = useMemo(() => parseSessionState(raw), [raw]);
  const now = useNow();
  const isActive = isSessionActive(state);

  /*
   * Fim do timer: agendado para o milissegundo em que acaba (não espera o
   * próximo tique). Para e marca o aviso. Todos os componentes que usam a
   * sessão agendam isto; a conferência no estado salvo evita gravar duas
   * vezes. Se a aba estava fechada e o fim já passou, roda na hora.
   */
  const { running, mode, endsAt } = state;

  useEffect(() => {
    if (!running || mode !== "timer" || !endsAt) {
      return;
    }

    const finish = () => {
      const current = readSessionState();

      if (current.running && current.mode === "timer" && current.endsAt === endsAt) {
        writeSessionState({
          ...current,
          running: false,
          remainingMs: 0,
          endsAt: null,
          finishedAt: endsAt,
        });
      }
    };

    const timeout = setTimeout(finish, Math.max(0, endsAt - Date.now()));

    return () => clearTimeout(timeout);
  }, [running, mode, endsAt]);

  /* Toda ação parte do estado salvo agora (pode ter mudado em outra aba). */
  const update = useCallback((change: (current: SessionState) => SessionState) => {
    writeSessionState(change(readSessionState()));
  }, []);

  const setMode = useCallback(
    (mode: SessionMode) =>
      update((current) => (current.running ? current : { ...current, mode })),
    [update],
  );

  /* Escolhe a duração do timer (só parado); zera o que faltava. */
  const setDuration = useCallback(
    (minutes: number) =>
      update((current) => {
        if (current.running || !Number.isFinite(minutes)) return current;

        const durationMs = clampDuration(Math.round(minutes) * 60_000);

        return {
          ...current,
          durationMs,
          runMs: durationMs,
          remainingMs: durationMs,
          finishedAt: null,
        };
      }),
    [update],
  );

  const start = useCallback(
    () =>
      update((current) => {
        if (current.running) return current;

        const startedNow = Date.now();
        const firstStartedAt = current.firstStartedAt ?? startedNow;

        if (current.mode === "stopwatch") {
          return { ...current, running: true, startedAt: startedNow, firstStartedAt };
        }

        /* Timer que já tinha acabado recomeça do início. */
        const restart = current.remainingMs <= 0;
        const remaining = restart ? current.durationMs : current.remainingMs;

        return {
          ...current,
          running: true,
          runMs: restart ? current.durationMs : current.runMs,
          remainingMs: remaining,
          endsAt: startedNow + remaining,
          firstStartedAt,
          finishedAt: null,
        };
      }),
    [update],
  );

  const pause = useCallback(
    () =>
      update((current) => {
        if (!current.running) return current;

        const pausedNow = Date.now();

        if (current.mode === "stopwatch") {
          return {
            ...current,
            running: false,
            elapsedMs: getElapsedMs(current, pausedNow),
            startedAt: null,
          };
        }

        return {
          ...current,
          running: false,
          remainingMs: getRemainingMs(current, pausedNow),
          endsAt: null,
        };
      }),
    [update],
  );

  /* Zera a sessão e mantém o modo e a duração escolhidos. */
  const reset = useCallback(
    () =>
      update((current) => ({
        ...DEFAULT_SESSION_STATE,
        mode: current.mode,
        durationMs: current.durationMs,
        runMs: current.durationMs,
        remainingMs: current.durationMs,
      })),
    [update],
  );

  /* "Mais 5 min" no aviso de fim. */
  const extend = useCallback(
    (minutes: number) =>
      update((current) => {
        const extendedNow = Date.now();
        const extra = minutes * 60_000;

        return {
          ...current,
          mode: "timer",
          running: true,
          runMs: extra,
          remainingMs: extra,
          endsAt: extendedNow + extra,
          finishedAt: null,
        };
      }),
    [update],
  );

  /* Fecha o aviso de fim e deixa o timer pronto para outra rodada. */
  const dismissFinished = useCallback(
    () =>
      update((current) => ({
        ...current,
        running: false,
        runMs: current.durationMs,
        remainingMs: current.durationMs,
        endsAt: null,
        firstStartedAt: null,
        finishedAt: null,
      })),
    [update],
  );

  return {
    state,
    now,
    isActive,
    setMode,
    setDuration,
    start,
    pause,
    reset,
    extend,
    dismissFinished,
  };
}
