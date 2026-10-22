/**
 * Favoritos de invitado: viven solo en este navegador (localStorage), sin
 * necesidad de cuenta. Personales a quien los guarda, nadie más los ve.
 */
const STORAGE_KEY = "fullfragrance_guest_favorites";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): el cambio no persiste,
    // pero no rompe la interacción del usuario.
  }
}

export function getGuestFavorites(): string[] {
  return read();
}

export function toggleGuestFavorite(id: string): string[] {
  const current = read();
  const next = current.includes(id) ? current.filter((fav) => fav !== id) : [...current, id];
  write(next);
  return next;
}
