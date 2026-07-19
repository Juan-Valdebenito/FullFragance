"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, session } from "@/shared/api/client";
import type { User } from "@/shared/api/types";
import { SessionProvider } from "@/shared/auth/SessionContext";
export function ProtectedContent({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const [user, setUser] = useState<User | null>(null);
  useEffect(() => { if (!session.hasToken()) { router.replace(`/login?next=${encodeURIComponent(pathname)}`); return; } api.me().then(setUser).catch(() => { session.clear(); router.replace("/login"); }); }, [pathname, router]);
  if (!user) return <div style={{minHeight:"70vh",display:"grid",placeItems:"center",color:"var(--on-surface-muted)"}}>Verificando sesión…</div>;
  return <SessionProvider initialUser={user}>{children}</SessionProvider>;
}
