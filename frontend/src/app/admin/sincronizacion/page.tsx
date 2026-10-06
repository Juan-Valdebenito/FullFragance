import type { Metadata } from "next";
import { SyncSection } from "@/features/admin/components/SyncSection";

export const metadata: Metadata = { title: "Sincronización · Admin" };

export default function AdminSyncPage() {
  return <SyncSection />;
}
