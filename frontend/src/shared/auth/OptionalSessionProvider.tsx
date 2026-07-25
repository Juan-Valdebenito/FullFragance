"use client";

import { useEffect, useState } from "react";
import { api, session } from "@/shared/api/client";
import type { User } from "@/shared/api/types";
import { SessionProvider } from "@/shared/auth/SessionContext";

/** Carga la sesión de forma opcional para toda la app (invitado o autenticado). */
export function OptionalSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!session.hasToken()) return;
    api.me()
      .then(setUser)
      .catch(() => session.clear());
  }, []);

  return (
    <SessionProvider key={user?.id ?? "guest"} initialUser={user}>
      {children}
    </SessionProvider>
  );
}
