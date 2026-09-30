"use client";

import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { FEATURE_TABS, filterNavItems, type FeatureTabId } from "@/shared/navigation/navConfig";
import styles from "./feature-tabs.module.css";

export function FeatureTabs({ active }: { active: FeatureTabId }) {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const tabs = filterNavItems(FEATURE_TABS, user);

  return (
    <nav className={styles.tabs} aria-label="Secciones de la plataforma">
      {tabs.map(tab => {
        const isActive = tab.tabId === active;
        if (isActive) {
          return (
            <span key={tab.href} className={styles.active} aria-current="page">
              {tab.label}
            </span>
          );
        }
        return (
          <Link key={tab.href} href={tab.href}>
            {tab.label}
          </Link>
        );
      })}
      <small>Precios actuales</small>
    </nav>
  );
}
