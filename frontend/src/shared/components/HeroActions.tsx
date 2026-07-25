"use client";

import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { Icon } from "@/shared/components/Icon";
import styles from "@/app/home.module.css";

export function HeroActions() {
  const session = useOptionalSession();
  const isLoggedIn = Boolean(session?.user && session.user.role !== "admin");

  return (
    <div className={styles.actions}>
      <Link className={styles.primaryAction} href="/dashboard">
        Ver catálogo <Icon name="arrow" size={18} />
      </Link>
      {isLoggedIn && (
        <Link className={styles.secondaryAction} href="/test">
          Hacer test olfativo
        </Link>
      )}
    </div>
  );
}
