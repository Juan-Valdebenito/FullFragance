"use client";

import { AdBanner } from "./AdBanner";
import styles from "./AdSidebarLayout.module.css";

interface AdSidebarLayoutProps {
  children: React.ReactNode;
  /** Mostrar anuncio izquierdo */
  left?: boolean;
  /** Mostrar anuncio derecho */
  right?: boolean;
}

/**
 * Wrapper que envuelve cualquier page con sidebars de anuncios.
 * Los sidebars solo aparecen en pantallas >= 1200px (controlado por CSS).
 *
 * Los Slot IDs se leen desde las variables de entorno:
 *   NEXT_PUBLIC_AD_SLOT_SIDEBAR_LEFT
 *   NEXT_PUBLIC_AD_SLOT_SIDEBAR_RIGHT
 *
 * Si no están configuradas → muestra anuncios demo.
 */
export function AdSidebarLayout({
  children,
  left = true,
  right = true,
}: AdSidebarLayoutProps) {
  return (
    <div className={styles.layout}>
      {left && (
        <aside className={styles.sidebarLeft} aria-label="Anuncio izquierdo">
          <div className={styles.stickyAd}>
            <AdBanner
              format="sidebar"
              slotId={process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR_LEFT}
            />
          </div>
        </aside>
      )}

      <main className={styles.content}>{children}</main>

      {right && (
        <aside className={styles.sidebarRight} aria-label="Anuncio derecho">
          <div className={styles.stickyAd}>
            <AdBanner
              format="sidebar"
              slotId={process.env.NEXT_PUBLIC_AD_SLOT_SIDEBAR_RIGHT}
            />
          </div>
        </aside>
      )}
    </div>
  );
}

