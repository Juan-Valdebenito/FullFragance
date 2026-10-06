import type { Metadata } from "next";
import { AdminLogin } from "@/features/admin/components/AdminLogin";

export const metadata: Metadata = { title: "Acceso · Admin" };

export default function AdminLoginPage() {
  return <AdminLogin />;
}
