"use client";
import { useEffect, useState } from "react";
import { api, session } from "@/shared/api/client";
import type { User } from "@/shared/api/types";
import { SessionProvider } from "@/shared/auth/SessionContext";

export function PublicSessionContent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!session.hasToken()) return;
    api.me()
      .then(setUser)
      .catch(() => session.clear());
  }, []);

  // La sesión es opcional: se monta como invitado y se reemplaza sólo si el
  // token se valida. Así el catálogo nunca depende de iniciar sesión.
  return <SessionProvider key={user?.id ?? "guest"} initialUser={user}>{children}</SessionProvider>;
}
