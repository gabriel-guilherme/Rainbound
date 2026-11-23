import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Pedir acesso — Rainbound" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <AuthShell
      eyebrow="Pedir acesso"
      title={
        <>
          Montar sua <span className="text-danger">estante</span>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
