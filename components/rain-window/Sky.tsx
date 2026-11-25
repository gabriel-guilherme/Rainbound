"use client";

import { useEffect, useState } from "react";

type RGB = [number, number, number];

const skyColors: { hour: number; color: RGB }[] = [
  { hour: 4, color: [49, 46, 129] }, // roxo
  { hour: 7, color: [125, 211, 252] }, // azul claro
  { hour: 12, color: [56, 189, 248] }, // azul
  { hour: 17, color: [251, 146, 60] }, // pôr do sol
  { hour: 18, color: [49, 46, 129] }, // roxo
  { hour: 20, color: [15, 23, 42] }, // noite
];

function interpolate(color1: RGB, color2: RGB, factor: number): RGB {
  return [
    Math.round(color1[0] + (color2[0] - color1[0]) * factor),
    Math.round(color1[1] + (color2[1] - color1[1]) * factor),
    Math.round(color1[2] + (color2[2] - color1[2]) * factor),
  ];
}

function getSkyColor(hour: number): RGB {
  if (hour < 4 || hour >= 20) {
    return skyColors[skyColors.length - 1].color;
  }

  for (let i = 0; i < skyColors.length - 1; i++) {
    const current = skyColors[i];
    const next = skyColors[i + 1];

    if (hour >= current.hour && hour <= next.hour) {
      const factor = (hour - current.hour) / (next.hour - current.hour);

      return interpolate(current.color, next.color, factor);
    }
  }

  return skyColors[skyColors.length - 1].color;
}

function rgb(color: RGB) {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function formatHour(hour: number) {
  const hours = Math.floor(hour);
  const minutes = Math.round((hour - hours) * 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

export default function Sky() {
  const [hour, setHour] = useState(12);
  const [isTesting, setIsTesting] = useState(false);

  const color = getSkyColor(hour);

  useEffect(() => {
    if (isTesting) return;

    const updateSky = () => {
      const now = new Date();

      const currentHour =
        now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

      setHour(currentHour);
    };

    updateSky();

    const interval = setInterval(updateSky, 60_000);

    return () => clearInterval(interval);
  }, [isTesting]);

  return (
    <>
      {/* Céu */}
      <div
        className="absolute inset-0 transition-[background] duration-[1000ms]"
        style={{
          background: `
            linear-gradient(
              to bottom,
              ${rgb(color)},
              rgba(15, 23, 42, 0.95)
            )
          `,
        }}
      />

      {/* Controle de teste */}
      {isTesting ? (
        <div className="absolute bottom-4 left-1/2 z-50 flex w-72 -translate-x-1/2 flex-col gap-2 rounded-xl bg-black/40 p-4 text-white backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-sm">Horário</span>

            <span className="font-mono text-sm">{formatHour(hour)}</span>
          </div>

          <input
            type="range"
            min={0}
            max={23.99}
            step={0.05}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="w-full"
          />

          <button
            onClick={() => setIsTesting(false)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Usar horário real
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsTesting(true)}
          className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-black/40 px-4 py-2 text-xs text-white backdrop-blur-md"
        >
          Testar horário
        </button>
      )}
    </>
  );
}
