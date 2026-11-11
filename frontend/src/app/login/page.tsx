import { ACCOUNTS_ENABLED } from "@/shared/auth/accounts";
import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { AuthDisabled } from "@/features/auth/components/AuthDisabled";

export const metadata: Metadata = { title: "Iniciar sesión" };

// Mismo interruptor que oculta el boton "Ingresar" del header: mientras las
// cuentas esten cerradas, la pagina tampoco funciona aunque alguien escriba
// /login directo en la URL.
export default function LoginPage() {
  if (!ACCOUNTS_ENABLED) return <AuthDisabled />;
  return <AuthShell mode="login" />;
}
