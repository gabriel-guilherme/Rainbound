"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";

import Rain from "./Rain";
import Sky from "./Sky";
import WindowFrame from "./WindowFrame";

type RainWindowProps = {
  isPaused: boolean;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
};

export default function RainWindow({ isPaused, setIsPaused }: RainWindowProps) {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative mx-auto flex max-w-7xl items-center justify-center px-4 py-10">
      <div className="group relative aspect-square w-[min(75vh,90vw)] max-w-xl overflow-hidden">
        {/* Céu */}
        <Sky />

        {/* Chuva */}
        <Rain isPaused={isPaused} isMuted={isMuted} />

        {/* Moldura */}
        <WindowFrame isPaused={isPaused} />

        {/* Controles */}
        <div className="absolute right-4 top-4 z-50 flex items-center gap-2 transition-opacity duration-300">
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/60"
            title={isMuted ? "Ligar som" : "Mutar som"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            type="button"
            onClick={() => setIsPaused((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/60"
            title={isPaused ? "Retomar animação" : "Pausar animação"}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
