import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/AuthShell";
export const metadata: Metadata = { title: "Crear cuenta | FullFragrance" };
export default function RegisterPage() { return <AuthShell mode="register"/>; }
