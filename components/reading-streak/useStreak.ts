"use client";

import { useEffect, useSyncExternalStore } from "react";

import { goalSeconds, type StreakSummary } from "@/lib/streak/rules";

import { getUnsyncedMs } from "./readingTimeSync";
import {
  dismissJustMet,
  getServerStreakSnapshot,
  getStreakSnapshot,
  seedSummary,
  subscribeStreak,
} from "./streakStore";

/*
 * Sequência no React: o resumo do servidor (o da página até o primeiro
 * envio) mais o tempo contado e ainda não enviado. Atualiza a cada tique
 * do ReadingTracker.
 */
export function useStreak(initial: StreakSummary) {
  const snapshot = useSyncExternalStore(
    subscribeStreak,
    getStreakSnapshot,
    getServerStreakSnapshot,
  );

  useEffect(() => {
    seedSummary(initial);
  }, [initial]);

  const summary = snapshot.summary ?? initial;
  const pendingSeconds =
    snapshot.readingTimeRaw === null ? 0 : Math.floor(getUnsyncedMs(summary.today) / 1000);
  const todaySeconds = summary.todaySeconds + pendingSeconds;
  const goal = goalSeconds(summary.goalMinutes);

  return {
    summary,
    todaySeconds,
    /* 0 a 1. */
    todayProgress: summary.metToday ? 1 : Math.min(todaySeconds / goal, 1),
    justMet: snapshot.justMet,
    dismissJustMet,
  };
}
