import type { Metadata } from "next";
import { MonitoringSection } from "@/features/admin/components/MonitoringSection";

export const metadata: Metadata = { title: "Monitoreo · Admin" };

export default function AdminMonitoringPage() {
  return <MonitoringSection />;
}
