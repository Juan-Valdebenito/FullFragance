import type { User } from "@/shared/api/types";

export type FeatureTabId = "dashboard" | "recomendaciones" | "test" | "favoritos";


export type NavItem = {
  href: string;
  label: string;
  requiresAuth?: boolean;
  tabId?: FeatureTabId;
  activeKey?: "catalog" | "test";
};

/** Enlaces principales del header (clientes). El mega menú de perfumes se inserta aparte. */
export const HEADER_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard?sort=savings", label: "Mejores Ofertas" },
  { href: "/dashboard?segment=designer", label: "Diseñador" },
  { href: "/dashboard?segment=niche", label: "Nicho" },
  { href: "/dashboard?segment=arabic", label: "Árabes" },
  { href: "/dashboard", label: "Catálogo Completo", activeKey: "catalog" },
];

/** Pestañas secundarias del comparador y secciones relacionadas. */
export const FEATURE_TABS: NavItem[] = [
  { href: "/dashboard", label: "Comparar precios", tabId: "dashboard" },
  { href: "/recomendaciones", label: "Para ti", requiresAuth: true, tabId: "recomendaciones" },
  { href: "/test", label: "Notas olfativas", requiresAuth: true, tabId: "test" },
  { href: "/favoritos", label: "Mis favoritos", requiresAuth: true, tabId: "favoritos" },
];

/** Enlaces del footer en la columna Plataforma. */
export const FOOTER_PLATFORM_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Comparar precios" },
  { href: "/test", label: "Test olfativo", requiresAuth: true },
  { href: "/recomendaciones", label: "Recomendaciones", requiresAuth: true },
  { href: "/favoritos", label: "Favoritos", requiresAuth: true },
];

export function filterNavItems(items: NavItem[], user: User | null): NavItem[] {
  return items.filter(item => !item.requiresAuth || Boolean(user));
}
