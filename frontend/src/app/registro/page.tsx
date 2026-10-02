import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthDisabled } from "@/features/auth/components/AuthDisabled";

export const metadata: Metadata = { title: "Crear cuenta | FullFragrance" };

const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED !== "false";

export default function RegisterPage() {
  if (!ACCOUNTS_ENABLED) return <AuthDisabled />;
  return <AuthShell mode="register" />;
}
