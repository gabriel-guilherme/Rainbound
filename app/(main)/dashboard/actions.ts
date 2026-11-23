"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  DASHBOARD_LAYOUT_COOKIE,
  DASHBOARD_LAYOUT_MAX_AGE,
  parseDashboardLayout,
  type DashboardLayout,
} from "@/lib/dashboardLayout";

/* Grava a arrumação dos widgets no cookie deste aparelho. */
export async function saveDashboardLayout(layout: DashboardLayout) {
  const parsed = parseDashboardLayout(layout);

  if (!parsed) {
    throw new Error("Arrumação de widgets inválida.");
  }

  (await cookies()).set(DASHBOARD_LAYOUT_COOKIE, JSON.stringify(parsed), {
    path: "/",
    maxAge: DASHBOARD_LAYOUT_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
  });

  revalidatePath("/dashboard");
}

/* Volta à arrumação padrão. */
export async function resetDashboardLayout() {
  (await cookies()).delete(DASHBOARD_LAYOUT_COOKIE);

  revalidatePath("/dashboard");
}
