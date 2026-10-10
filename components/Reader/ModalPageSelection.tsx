"use client";

import { X } from "lucide-react";
import { useState } from "react";

type ModalPageSelectionProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (position: number) => void;
  locator?: string | null;
};

export default function ModalPageSelection({
  isOpen,
  onClose,
  onNavigate,
  locator,
}: ModalPageSelectionProps) {
  const [selectedPosition, setSelectedPosition] = useState<number>(1);
  const [inputValue, setInputValue] = useState<string>("");

  // Extrai a página inicial do locator (ex: "pdf-page:5" -> 5)
  const initialPosition = Number(locator?.split(":")[1] ?? 1);

  // Atualiza o estado quando o modal abre
  if (isOpen && initialPosition > 1) {
    setSelectedPosition(initialPosition);
    setInputValue(initialPosition.toString());
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permite apenas números
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-xl border border-contrast/20 bg-primary p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-contrast">
            Selecionar Página/Capítulo
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-contrast/10"
          >
            <X className="h-5 w-5 text-contrast" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="space-y-4">
          <p className="text-sm text-contrast/70">
            Digite o número da página ou capítulo para navegar:
          </p>

          <input
            type="number"
            min="1"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ex: 5"
            className="w-full rounded-lg border border-contrast/30 bg-primary/50 px-4 py-3 text-contrast placeholder:text-contrast/50 focus:border-contrast focus:outline-none focus:ring-2 focus:ring-contrast/20"
          />

          {/* Preview da posição selecionada */}
          <div className="rounded-lg border border-contrast/20 bg-primary/30 p-4">
            <p className="text-sm text-contrast/70">
              Você vai para a posição:
            </p>
            <p className="mt-1 text-2xl font-bold text-contrast">
              {selectedPosition}
            </p>
          </div>

          <button
            onClick={handleNavigate}
            disabled={!inputValue}
            className="w-full rounded-lg bg-contrast px-4 py-3 text-primary hover:bg-contrast/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Navegar
          </button>
        </div>
      </div>
    </div>
  );
}
