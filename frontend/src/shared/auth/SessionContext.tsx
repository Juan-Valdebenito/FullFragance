"use client";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { api, session } from "@/shared/api/client";
import type { City, User } from "@/shared/api/types";

type SessionValue = {
  user: User | null;
  isFavorite: (id: string, aliases?: string[]) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  updateProfile: (profile: { name: string }) => Promise<void>;
  changePassword: (passwords: { currentPassword: string; newPassword: string }) => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
  updateCity: (city: City) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ initialUser, children }: { initialUser: User | null; children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);

  const refreshUser = useCallback(async () => {
    if (!session.hasToken()) {
      setUser(null);
      return null;
    }
    try {
      const updated = await api.me();
      setUser(updated);
      return updated;
    } catch {
      session.clear();
      setUser(null);
      return null;
    }
  }, []);

  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  const value = useMemo<SessionValue>(() => ({
    user,
    isFavorite: (id, aliases = []) => Boolean(user && [id, ...aliases].some(candidate => user.favorites.includes(candidate))),
    toggleFavorite: async id => {
      if (!user) throw new Error("Debes iniciar sesión para guardar favoritos.");
      const result = await api.toggleFavorite(id);
      setUser(current => current ? ({ ...current, favorites: result.favorites }) : current);
    },
    updateProfile: async profile => {
      if (!user) throw new Error("Debes iniciar sesión para actualizar tu perfil.");
      const updated = await api.updateProfile(profile);
      setUser(updated);
    },
    changePassword: async passwords => {
      if (!user) throw new Error("Debes iniciar sesión para cambiar tu contraseña.");
      await api.changePassword(passwords);
    },
    deleteAccount: async confirmation => {
      if (!user) throw new Error("Debes iniciar sesión para eliminar tu cuenta.");
      await api.deleteAccount(confirmation);
      session.clear();
      setUser(null);
    },
    updateCity: async city => {
      if (!user) throw new Error("Debes iniciar sesión para guardar tu ciudad.");
      const updated = await api.setCity(city);
      setUser(updated);
    },
    refreshUser,
    logout,
  }), [user, refreshUser, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useOptionalSession() { return useContext(SessionContext); }
export function useSession() {
  const value = useContext(SessionContext);
  if (!value || !value.user) throw new Error("useSession debe usarse dentro de una ruta protegida");
  return value as SessionValue & { user: User };
}
