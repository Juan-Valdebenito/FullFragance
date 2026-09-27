"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "pitch-black";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "fullfragrance_theme";
const THEMES: Theme[] = ["light", "dark", "pitch-black"];
const listeners = new Set<() => void>();
// Tema elegido en esta pestaña. Tiene prioridad sobre localStorage para que el
// selector refleje la elección aunque el navegador bloquee el almacenamiento.
let chosenTheme: Theme | null = null;

function applyTheme(theme: Theme) {
  if (theme === "light") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

function readTheme(): Theme {
  if (chosenTheme) return chosenTheme;
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (savedTheme && THEMES.includes(savedTheme)) return savedTheme;
  } catch {
    // Sin acceso a localStorage se usa la preferencia del sistema.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Otra pestaña cambió el tema: se adopta y se aplica también a este documento.
function handleStorage(event: StorageEvent) {
  if (event.key !== THEME_STORAGE_KEY) return;
  chosenTheme = null;
  applyTheme(readTheme());
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  if (!listeners.size) window.addEventListener("storage", handleStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", handleStorage);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // En el servidor y durante la hidratación se usa "light"; el data-theme real
  // ya fue aplicado por el script inline en <head> antes del primer render.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);

  const setTheme = (newTheme: Theme) => {
    chosenTheme = newTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Sin almacenamiento el tema igual se aplica durante esta visita.
    }
    applyTheme(newTheme);
    listeners.forEach((listener) => listener());
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
}
