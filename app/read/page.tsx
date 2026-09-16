"use client";

import EpubReader from "@/components/EpubReader";
import {
  CloudRainWind,
  Summary,
  Fullscreen,
  EllipsisVertical,
} from "lucide-react";
import { useState } from "react";

export default function Read() {
  const [pageInfo, setPageInfo] = useState({
    currentPage: 1,
    totalPages: 365,
    progress: 0,
  });

  return (
    <div className="flex h-screen w-full flex-col bg-darkest text-contrast">
      {/* Header */}
      <header className="grid h-20 shrink-0 grid-cols-3 items-center px-5">
        <CloudRainWind className="justify-self-start" />

        <h1 className="justify-self-center">Title</h1>

        <div className="flex gap-3 justify-self-end">
          <p>Aa</p>
          <Summary />
          <Fullscreen />
          <EllipsisVertical />
        </div>
      </header>

      {/* Leitor */}
      <main className="relative min-h-0 flex-1 px-20">
        <EpubReader onPageChange={setPageInfo} />
      </main>

      {/* Footer */}
      <footer className="flex h-12 shrink-0 items-center justify-center">
        {pageInfo.currentPage}-{pageInfo.currentPage + 1} de{" "}
        {pageInfo.totalPages} ({pageInfo.progress}%)
      </footer>
    </div>
  );
}
