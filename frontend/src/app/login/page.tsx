import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthDisabled } from "@/features/auth/components/AuthDisabled";

export const metadata: Metadata = { title: "Iniciar sesión | FullFragance" };

// Mismo interruptor que oculta el boton "Ingresar" del header: cuando esta
// en "false", la pagina tampoco funciona aunque alguien escriba /login
// directo en la URL.
const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED !== "false";

export default function LoginPage() {
  if (!ACCOUNTS_ENABLED) return <AuthDisabled />;
  return <AuthShell mode="login" />;
}
