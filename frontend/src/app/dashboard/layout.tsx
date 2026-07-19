import { ProtectedContent } from "@/shared/components/ProtectedContent";
export default function DashboardLayout({ children }: { children: React.ReactNode }) { return <ProtectedContent>{children}</ProtectedContent>; }
