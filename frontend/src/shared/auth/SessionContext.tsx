"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, session } from "@/shared/api/client";
import type { User } from "@/shared/api/types";
import { getGuestFavorites, toggleGuestFavorite } from "@/shared/favorites/guestFavorites";

type SessionValue = {
  user: User | null;
  favorites: string[];
  isFavorite: (id: string, aliases?: string[]) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  updateProfile: (profile: { name: string }) => Promise<void>;
  changePassword: (passwords: { currentPassword: string; newPassword: string }) => Promise<void>;
  deleteAccount: (confirmation: string) => Promise<void>;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ initialUser, children }: { initialUser: User | null; children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [guestFavorites, setGuestFavorites] = useState<string[]>([]);

  // Se lee después de montar (no en el render del servidor) para no romper
  // la hidratación: localStorage no existe en el servidor.
  useEffect(() => {
    if (!user) setGuestFavorites(getGuestFavorites());
  }, [user]);

  const favorites = user?.favorites ?? guestFavorites;

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

  const logout = useCallback(async () => {
    await session.clear();
    setUser(null);
  }, []);

  const value = useMemo<SessionValue>(() => ({
    user,
    favorites,
    isFavorite: (id, aliases = []) => [id, ...aliases].some(candidate => favorites.includes(candidate)),
    toggleFavorite: async id => {
      // Sin cuenta: el favorito queda en este navegador (localStorage), no en
      // el servidor. Con cuenta, se sincroniza como antes.
      if (!user) {
        setGuestFavorites(toggleGuestFavorite(id));
        return;
      }
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
    refreshUser,
    logout,
  }), [user, favorites, refreshUser, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useOptionalSession() { return useContext(SessionContext); }
export function useSession() {
  const value = useContext(SessionContext);
  if (!value || !value.user) throw new Error("useSession debe usarse dentro de una ruta protegida");
  return value as SessionValue & { user: User };
}
