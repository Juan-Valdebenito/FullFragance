"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { api } from "@/shared/api/client";
import type { City, User } from "@/shared/api/types";
type SessionValue = { user: User | null; isFavorite: (id: string, aliases?: string[]) => boolean; toggleFavorite: (id: string) => Promise<void>; updateCity: (city: City) => Promise<void> };
const SessionContext = createContext<SessionValue | null>(null);
export function SessionProvider({ initialUser, children }: { initialUser: User | null; children: React.ReactNode }) {
  const [user, setUser] = useState(initialUser);
  const value = useMemo<SessionValue>(() => ({
    user,
    isFavorite: (id, aliases = []) => Boolean(user && [id, ...aliases].some(candidate => user.favorites.includes(candidate))),
    toggleFavorite: async id => {
      if (!user) throw new Error("Debes iniciar sesión para guardar favoritos.");
      const result = await api.toggleFavorite(id);
      setUser(current => current ? ({ ...current, favorites: result.favorites }) : current);
    },
    updateCity: async city => {
      if (!user) throw new Error("Debes iniciar sesión para guardar tu ciudad.");
      const updated = await api.setCity(city);
      setUser(updated);
    },
  }), [user]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
export function useOptionalSession() { return useContext(SessionContext); }
export function useSession() {
  const value = useContext(SessionContext);
  if (!value || !value.user) throw new Error("useSession debe usarse dentro de una ruta protegida");
  return value as SessionValue & { user: User };
}
