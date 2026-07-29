"use client";
import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import styles from "./profile.module.css";

export function ProfileSummary() {
  const session = useOptionalSession();
  const user = session?.user ?? null;

  if (!user) {
    return (
      <div className={styles.summary}>
        <div className={styles.avatar}>?</div>
        <div>
          <p className="eyebrow">Tu cuenta</p>
          <h1>Inicia sesión en FullFragrance</h1>
          <p>Accede a tu perfil olfativo, perfumes favoritos y preferencias regionales.</p>
        </div>
        <Link href="/login">Iniciar sesión</Link>
      </div>
    );
  }

  return (
    <div className={styles.summary}>
      <div className={styles.avatar}>{user.name.slice(0, 1).toUpperCase()}</div>
      <div>
        <p className="eyebrow">Tu cuenta</p>
        <h1>{user.name}</h1>
        <p>{user.email}</p>
      </div>
      <div className={styles.stats}>
        <span><strong>{user.favorites.length}</strong> favoritos</span>
        <span><strong>{Object.keys(user.scentPreferences?.scores ?? {}).length}</strong> notas calificadas</span>
      </div>
      <Link href="/test">Editar perfil olfativo</Link>
    </div>
  );
}
