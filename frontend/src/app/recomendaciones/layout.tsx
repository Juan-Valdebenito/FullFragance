import { ProtectedContent } from "@/shared/components/ProtectedContent";
export default function RecommendationsLayout({ children }: { children: React.ReactNode }) { return <ProtectedContent>{children}</ProtectedContent>; }
