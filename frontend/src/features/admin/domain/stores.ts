import { api } from "@/shared/api/client";
import type { SyncJob } from "@/shared/api/types";
import { storeLabel } from "@/features/catalog/domain/stores";

export type AdminStore = {
  source: string;
  /** Nombre que el backend asigna a los precios de esta fuente (priceService). */
  name: string;
  domain: string;
  protocol: string;
  color: string;
  sync: () => Promise<{ job: SyncJob }>;
};

function store(source: string, domain: string, protocol: string, color: string, sync: AdminStore["sync"]): AdminStore {
  return { source, name: storeLabel(source), domain, protocol, color, sync };
}

// Única lista de tiendas del panel: tarjetas de sincronización, distribución,
// filtros y badges salen de aquí. Para sumar una tienda basta una línea.
export const ADMIN_STORES: AdminStore[] = [
  store("falabella-cl", "falabella.com", "JSON API", "#3f7d4e", api.syncFalabellaPerfumes),
  store("ripley-cl", "ripley.cl", "REST", "#6d5bd0", api.syncRipleyPerfumes),
  store("paris-cl", "paris.cl", "Catálogo SSR", "#c2415d", api.syncParisPerfumes),
  store("abc-cl", "abc.cl", "Catálogo SSR", "#2f5d9e", api.syncAbcPerfumes),
  store("preunic-cl", "preunic.cl", "API", "#d4577a", api.syncPreunicPerfumes),
  store("alisha-cl", "alisha.cl", "Shopify", "#c76aa3", api.syncAlishaPerfumes),
  store("silk-cl", "silkperfumes.cl", "Shopify", "#4a78c2", api.syncSilkPerfumes),
  store("elite-cl", "eliteperfumes.cl", "Shopify", "#b8862f", api.syncElitePerfumes),
  store("cosmetic-cl", "cosmetic.cl", "Shopify", "#3a9478", api.syncCosmeticPerfumes),
  store("leparis-cl", "leparisparfums.com", "Shopify", "#3d5fc4", api.syncLeparisPerfumes),
  store("lodoro-cl", "lodoro.cl", "UCP / MCP", "#8a63c9", api.syncLodoroPerfumes),
  store("dreams-cl", "dreamsparfums.cl", "Jumpseller", "#9b4f93", api.syncDreamsPerfumes),
];

export function adminStore(source: string) {
  return ADMIN_STORES.find((item) => item.source === source);
}
