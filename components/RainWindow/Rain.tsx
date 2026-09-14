"use client";

import { useEffect, useRef } from "react";

type RainProps = {
  isPaused: boolean;
  isMuted: boolean;
};

type Drop = {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
  diagonal: number;
};

const DROP_COUNT = 500;

// Quanto espaço extra existe fora da tela para gerar as gotas
const SPAWN_PADDING = 250;

export default function Rain({ isPaused, isMuted }: RainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const pausedRef = useRef(isPaused);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;

    let width = 0;
    let height = 0;

    const drops: Drop[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createDrop = (randomY = true): Drop => ({
      // Permite que algumas gotas nasçam fora do lado direito
      x: Math.random() * (width + SPAWN_PADDING),

      y: randomY ? Math.random() * height : -50,

      speed: 8 + Math.random() * 8,

      length: 15 + Math.random() * 25,

      opacity: Math.random() * 0.3,

      // Movimento horizontal da gota
      diagonal: 5 + Math.random() * 2,
    });

    const resetDrop = (drop: Drop) => {
      // Quando sair pela parte inferior/esquerda,
      // ela volta para a região superior/direita
      drop.x = Math.random() * (width + SPAWN_PADDING);

      drop.y = -drop.length;

      drop.speed = 8 + Math.random() * 8;

      drop.length = 15 + Math.random() * 25;

      drop.opacity = Math.random() * 0.3;
    };

    const init = () => {
      drops.length = 0;

      for (let i = 0; i < DROP_COUNT; i++) {
        drops.push(createDrop());
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 1;

      for (const drop of drops) {
        ctx.beginPath();

        ctx.strokeStyle = `rgba(147, 197, 253, ${drop.opacity})`;

        // A linha acompanha o movimento diagonal
        ctx.moveTo(drop.x, drop.y);

        ctx.lineTo(drop.x - drop.diagonal, drop.y + drop.length);

        ctx.stroke();

        if (!pausedRef.current) {
          // Movimento diagonal
          drop.y += drop.speed;
          drop.x -= drop.diagonal;
        }

        // Saiu pela parte inferior ou esquerda
        if (drop.y > height + drop.length || drop.x < -50) {
          resetDrop(drop);
        }
      }

      animationFrame = requestAnimationFrame(render);
    };

    resize();
    init();
    render();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      />

      <audio
        src="/sounds/rain.mp3"
        preload="auto"
        muted={isMuted}
        autoPlay={!isMuted}
        loop
      />
    </>
  );
}
