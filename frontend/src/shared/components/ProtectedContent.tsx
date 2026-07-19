"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, session } from "@/shared/api/client";
export function ProtectedContent({ children }: { children: React.ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const [ready, setReady] = useState(false);
  useEffect(() => { if (!session.hasToken()) { router.replace(`/login?next=${encodeURIComponent(pathname)}`); return; } api.me().then(() => setReady(true)).catch(() => { session.clear(); router.replace("/login"); }); }, [pathname, router]);
  if (!ready) return <div style={{minHeight:"70vh",display:"grid",placeItems:"center",color:"var(--on-surface-muted)"}}>Verificando sesión…</div>;
  return children;
}
