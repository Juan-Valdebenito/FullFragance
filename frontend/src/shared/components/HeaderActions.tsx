"use client";
import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { Icon } from "./Icon";
import { LogoutButton } from "./LogoutButton";
import { UserLocation } from "./UserLocation";
import styles from "./shared.module.css";

export function HeaderActions() {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";

  if (!user) {
    return (
      <div className={styles.actions}>
        <Link className={styles.loginLink} href="/login">Ingresar</Link>
        <Link className={styles.registerLink} href="/registro">Crear cuenta</Link>
      </div>
    );
  }

  return (
    <div className={styles.actions}>
      {isAdmin && (
        <Link
          href="/dashboard"
          style={{
            background: "var(--gold-light)",
            border: "1px solid var(--gold)",
            color: "var(--gold-dark)",
            borderRadius: "99px",
            padding: "6px 12px",
            fontSize: ".68rem",
            fontWeight: 800,
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          ⚙️ Admin Panel
        </Link>
      )}
      <span><UserLocation /></span>
      <Link aria-label="Perfil" href="/perfil"><Icon name="user" /></Link>
      <LogoutButton />
    </div>
  );
}
