"use client";

import { useEffect, useState } from "react";

import RainWindow from "@/components/RainWindow/RainWindow";

/* Janela de chuva do hero das homes (o estado de pausa é dela). */
export default function HomeRainWindow() {
  const [isPaused, setIsPaused] = useState(false);

  /* Quem pede menos movimento no sistema começa com a chuva pausada. */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsPaused(true);
    }
  }, []);

  return <RainWindow isPaused={isPaused} setIsPaused={setIsPaused} />;
}
