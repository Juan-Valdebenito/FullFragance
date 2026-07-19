import { ProtectedContent } from "@/shared/components/ProtectedContent";
export default function TestLayout({ children }: { children: React.ReactNode }) { return <ProtectedContent>{children}</ProtectedContent>; }
