import { ACCOUNTS_ENABLED } from "@/shared/auth/accounts";
import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthDisabled } from "@/features/auth/components/AuthDisabled";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  if (!ACCOUNTS_ENABLED) return <AuthDisabled />;
  return <AuthShell mode="register" />;
}
