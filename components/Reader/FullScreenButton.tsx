"use client";

import { useEffect, useState } from "react";
import { Expand, Minimize } from "lucide-react";

export default function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Erro ao alternar fullscreen:", error);
    }
  };

  return (
    <button
      onClick={handleFullscreen}
      aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white/10 cursor-pointer"
    >
      {isFullscreen ? (
        <Minimize size={20} strokeWidth={1.8} />
      ) : (
        <Expand size={20} strokeWidth={1.8} />
      )}
    </button>
  );
}
