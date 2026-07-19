import { ProtectedContent } from "@/shared/components/ProtectedContent";
export default function ProfileLayout({ children }: { children: React.ReactNode }) { return <ProtectedContent>{children}</ProtectedContent>; }
