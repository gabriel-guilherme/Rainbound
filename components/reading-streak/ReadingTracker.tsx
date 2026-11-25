"use client";

import { useEffect, useRef } from "react";

import { countReadingTime } from "./readingTime";
import {
  flushReadingTime,
  isGoalReachedLocally,
  saveTimeZoneCookie,
} from "./readingTimeSync";

type ReadingTrackerProps = {
  trackReader?: boolean;
  /* Muda a cada página virada (EPUB vira dentro de um iframe, sem eventos aqui). */
  activityKey?: unknown;
};

/* Sem mexer no leitor por mais que isso, a contagem do leitor pausa. */
const IDLE_MS = 5 * 60 * 1000;
/* Tiques mais espaçados que isso (aba congelada, celular dormindo) não contam o leitor. */
const MAX_TICK_GAP_MS = 5000;
const FLUSH_INTERVAL_MS = 60 * 1000;

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/*
 * Conta o tempo de leitura para a sequência (readingTime.ts) e envia ao
 * servidor a cada minuto, ao bater a meta e ao esconder a aba. Fica no
 * layout das páginas (só a Sessão conta) e no leitor (leitor + Sessão).
 */
export default function ReadingTracker({
  trackReader = false,
  activityKey,
}: ReadingTrackerProps) {
  const lastActivityRef = useRef(0);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, [activityKey]);

  useEffect(() => {
    saveTimeZoneCookie();

    let lastTick: number | null = null;
    let lastFlush = Date.now();

    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const tick = () => {
      const now = Date.now();
      const readerActive =
        trackReader &&
        document.visibilityState === "visible" &&
        now - lastActivityRef.current <= IDLE_MS &&
        lastTick !== null &&
        now - lastTick <= MAX_TICK_GAP_MS;

      countReadingTime(now, readerActive ? lastTick : null);
      lastTick = now;

      if (now - lastFlush >= FLUSH_INTERVAL_MS || isGoalReachedLocally()) {
        lastFlush = now;
        void flushReadingTime("fetch");
      }
    };

    const handleVisibility = () => {
      tick();

      if (document.visibilityState === "hidden") {
        void flushReadingTime("beacon");
      } else {
        /* De volta: confirma o que foi por beacon e atualiza o resumo. */
        lastFlush = Date.now();
        void flushReadingTime("fetch");
      }
    };

    const handlePageHide = () => {
      tick();
      void flushReadingTime("beacon");
    };

    if (trackReader) {
      markActivity();
      ACTIVITY_EVENTS.forEach((type) =>
        window.addEventListener(type, markActivity, { passive: true, capture: true }),
      );
    }

    tick();
    const interval = setInterval(tick, 1000);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      ACTIVITY_EVENTS.forEach((type) =>
        window.removeEventListener(type, markActivity, { capture: true }),
      );

      /* Saindo pela navegação do app: conta e envia o que falta. */
      tick();
      void flushReadingTime("fetch");
    };
  }, [trackReader]);

  return null;
}
