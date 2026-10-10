"use client";

import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

type DropdownPageSelectionProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (position: number) => void;
  initialPosition?: number;
  totalPages?: number;
};

export default function DropdownPageSelection({
  isOpen,
  onClose,
  onNavigate,
  initialPosition = 1,
  totalPages = 10,
}: DropdownPageSelectionProps) {
  const [selectedPosition, setSelectedPosition] = useState<number>(initialPosition);
  const [inputValue, setInputValue] = useState<string>(initialPosition.toString());
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Atualiza estado quando o dropdown abre
  useEffect(() => {
    if (isOpen) {
      setSelectedPosition(initialPosition);
      setInputValue(initialPosition.toString());
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isOpen, initialPosition]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!/^\d*$/.test(value)) {
      return;
    }
    setInputValue(value);
    setSelectedPosition(Number(value) || 1);
  };

  const handleNavigate = () => {
    const position = Number(inputValue) || selectedPosition;
    onNavigate(position);
    onClose();
  };

  const handleQuickJump = (position: number) => {
    setInputValue(position.toString());
    setSelectedPosition(position);
  };

  // Gera páginas rápidas (a cada 5 páginas)
  const quickJumps = Array.from(
    { length: Math.ceil(totalPages / 5) },
    (_, i) => (i + 1) * 5,
  );

  return (
    <div className="relative">
      {/* Botão do dropdown */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-contrast hover:bg-contrast/10 whitespace-nowrap"
      >
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        <span className="text-sm">Página {selectedPosition}</span>
      </button>

      {/* Lista expandível */}
      {isExpanded && (
        <div className="absolute left-1/2 top-full z-40 w-fit max-w-[256px] -translate-x-1/2 rounded-xl border border-contrast/20 bg-primary shadow-lg">
          {/* Input para digitar */}
          <div className="border-b border-contrast/10 p-3">
            <input
              type="number"
              min="1"
              max={totalPages}
              value={inputValue}
              onChange={handleInputChange}
              placeholder={`Página ${initialPosition}`}
              className="w-full rounded-md border border-contrast/20 bg-primary/50 px-3 py-2 text-contrast placeholder:text-contrast/50 focus:border-contrast focus:outline-none focus:ring-2 focus:ring-contrast/20"
            />
          </div>

          {/* Lista de páginas rápidas */}
          <div className="max-h-64 overflow-y-auto p-1">
            {quickJumps.map((jump) => (
              <button
                key={jump}
                onClick={() => handleQuickJump(jump)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  selectedPosition === jump
                    ? "bg-contrast/20 font-medium text-contrast"
                    : "hover:bg-primary cursor-pointer text-contrast hover:bg-primary"
                }`}
              >
                Página {jump}
              </button>
            ))}

            {/* Botão navegar */}
            <button
              onClick={handleNavigate}
              disabled={!inputValue}
              className="w-full rounded-md bg-contrast px-3 py-2 text-primary hover:bg-contrast/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Ir para página {selectedPosition}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
