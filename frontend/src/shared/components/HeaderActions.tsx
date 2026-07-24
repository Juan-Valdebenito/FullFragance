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

  if (!user) {
    return <div className={styles.actions}>
      <Link className={styles.loginLink} href="/login">Ingresar</Link>
      <Link className={styles.registerLink} href="/registro">Crear cuenta</Link>
    </div>;
  }

  return <div className={styles.actions}>
    <span><UserLocation /></span>
    <Link aria-label="Perfil" href="/perfil"><Icon name="user" /></Link>
    <LogoutButton />
  </div>;
}
