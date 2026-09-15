"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type WidgetSectionProps = {
  sections: { id: number; content: React.ReactNode[] }[];
  navStyle?: string;
};

export default function WidgetSection({
  sections,
  navStyle = "default",
}: WidgetSectionProps) {
  const [currentSection, setCurrentSection] = useState(0);

  const nextSection = () => {
    setCurrentSection((prev) => Math.min(prev + 1, sections.length - 1));
  };

  const previousSection = () => {
    setCurrentSection((prev) => Math.max(prev - 1, 0));
  };

  const navigation = (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={previousSection}
        disabled={currentSection === 0}
        aria-label="Seção anterior"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-contrast transition hover:bg-interaction-contrast disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Indicadores */}
      <div className="flex items-center gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => setCurrentSection(section.id)}
            aria-label={`Ir para seção ${section.id + 1}`}
            aria-current={currentSection === section.id ? "true" : undefined}
            className={`
                h-2 rounded-full transition-all
                ${
                  currentSection === section.id
                    ? "w-6 bg-interaction"
                    : "w-2 bg-interaction-contrast"
                }
              `}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={nextSection}
        disabled={currentSection === sections.length - 1}
        aria-label="Próxima seção"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-contrast transition hover:bg-interaction-contrast disabled:pointer-events-none disabled:opacity-30"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );

  return (
    <section
      className={`relative mt-10 w-full flex flex-col gap-3 ${["top-right", "bottom-right"].includes(navStyle) ? "items-end" : ""} ${["top-left", "bottom-left"].includes(navStyle) ? "items-start" : ""}`}
    >
      {["top", "top-left", "top-right"].includes(navStyle) && navigation}
      {/* Widgets */}
      <div className="w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSection}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex w-full flex-col gap-6 md:flex-row md:gap-8"
          >
            {sections[currentSection].content.map((widget, index) => (
              <div key={index} className="min-w-0 flex-1">
                {widget}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegação */}
      {["bottom", "bottom-left", "bottom-right", "default"].includes(
        navStyle,
      ) && navigation}
    </section>
  );
}
