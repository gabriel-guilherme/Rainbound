import type { Prisma } from "@/generated/prisma/client";

export const statusLabel: Record<string, string> = {
  WANT_TO_READ: "Quero ler",
  READING: "Lendo",
  READ: "Lido",
  ABANDONED: "Abandonado",
};

export const statusColor: Record<string, string> = {
  WANT_TO_READ: "bg-gray-100 text-gray-700 border-2 border-gray-400",
  READING: "bg-blue-100 text-blue-700 border-2 border-blue-400",
  READ: "bg-green-100 text-green-700 border-2 border-green-400",
  ABANDONED: "bg-red-100 text-red-700 border-2 border-red-400",
};

export const sortOptions = [
  { value: "added_desc", label: "Mais recentes" },
  { value: "added_asc", label: "Mais antigos" },
  { value: "title_asc", label: "A-Z" },
  { value: "title_desc", label: "Z-A" },
  { value: "progress_desc", label: "Progresso (Desc)" },
  { value: "progress_asc", label: "Progresso (Asc)" },
];

export const orderByOptions = {
  added_desc: { createdAt: "desc" },
  added_asc: { createdAt: "asc" },
} satisfies Record<string, Prisma.BookOrderByWithRelationInput>;
