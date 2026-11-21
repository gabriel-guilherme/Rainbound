"use client";

import { useEffect, useState } from "react";
import { Expand, Minimize } from "lucide-react";

interface FullscreenButtonProps {
  onClick?: () => void;
}

export default function FullscreenButton({
  onClick,
}: FullscreenButtonProps) {
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
      type="button"
      onClick={() => {
        handleFullscreen();
        onClick?.();
      }}
      aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-contrast/80 transition-colors hover:bg-contrast/10 hover:text-contrast"
    >
      {isFullscreen ? (
        <Minimize size={20} strokeWidth={1.8} />
      ) : (
        <Expand size={20} strokeWidth={1.8} />
      )}
    </button>
  );
}
