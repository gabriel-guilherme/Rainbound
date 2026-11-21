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
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          "text-contrast/80 hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-40",
          buttonClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {icon}
      </button>

      {isOpen && (
        <div
          className={[
            "absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-contrast/10",
            "bg-primary/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-sm",
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
