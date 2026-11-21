"use client";

import { useEffect, useRef, type ReactNode } from "react";

type HeaderActionWindowProps = {
  isOpen: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  label: string;
  icon: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  buttonClassName?: string;
  panelClassName?: string;
};

export default function HeaderActionWindow({
  isOpen,
  onOpenChange,
  label,
  icon,
  children,
  disabled = false,
  buttonClassName = "",
  panelClassName = "",
}: HeaderActionWindowProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onOpenChange]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        disabled={disabled}
        aria-label={label}
        title={label}
        aria-expanded={isOpen}
        className={[
          "flex h-10 w-10 items-center justify-center transition-colors",
          "text-contrast/80 hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-40",
          buttonClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {icon}
      </button>

      {/*
        * Celular: painel fixo em largura total logo abaixo do cabeçalho
        * (ancorado no botão, ele vazava pela esquerda da tela). A partir
        * de sm, abre preso ao botão. Larguras de desktop vêm com prefixo
        * sm: em panelClassName (ex.: "sm:w-80").
        */}
      {isOpen && (
        <div
          className={[
            "fixed inset-x-2 top-[calc(4rem+env(safe-area-inset-top)+0.5rem)] z-50 border border-contrast/10",
            "sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2",
            "bg-primary p-2 shadow-[6px_6px_0_rgb(0_0_0/0.45)]",
            panelClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {children}
        </div>
      )}
    </div>
  );
}
