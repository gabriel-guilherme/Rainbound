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
const SPAWN_PADDING = 250;

export default function Rain({ isPaused, isMuted }: RainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const pausedRef = useRef(isPaused);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = isMuted;

    if (!isMuted) {
      audio.play().catch((error) => {
        console.log("Reprodução bloqueada pelo navegador:", error);
      });
    } else {
      audio.pause();
    }
  }, [isMuted]);

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
      x: Math.random() * (width + SPAWN_PADDING),
      y: randomY ? Math.random() * height : -50,
      speed: 8 + Math.random() * 8,
      length: 15 + Math.random() * 25,
      opacity: Math.random() * 0.3,
      diagonal: 5 + Math.random() * 2,
    });

    const resetDrop = (drop: Drop) => {
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
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x - drop.diagonal, drop.y + drop.length);
        ctx.stroke();

        if (!pausedRef.current) {
          drop.y += drop.speed;
          drop.x -= drop.diagonal;
        }

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

      <audio ref={audioRef} src="/sounds/rain.mp3" preload="auto" loop />
    </>
  );
}
