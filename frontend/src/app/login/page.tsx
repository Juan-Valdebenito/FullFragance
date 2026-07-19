import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
export const metadata: Metadata = { title: "Iniciar sesión | FullFragrance" };
export default function LoginPage() { return <AuthShell mode="login"/>; }
