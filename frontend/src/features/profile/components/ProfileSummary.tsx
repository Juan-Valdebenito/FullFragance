"use client";
import Link from "next/link";
import { useSession } from "@/shared/auth/SessionContext";
import styles from "./profile.module.css";
export function ProfileSummary() { const { user } = useSession(); return <div className={styles.summary}><div className={styles.avatar}>{user.name.slice(0,1).toUpperCase()}</div><div><p className="eyebrow">Tu cuenta</p><h1>{user.name}</h1><p>{user.email}</p></div><div className={styles.stats}><span><strong>{user.favorites.length}</strong> favoritos</span><span><strong>{Object.keys(user.scentPreferences?.scores ?? {}).length}</strong> notas calificadas</span></div><Link href="/test">Editar perfil olfativo</Link></div>; }
