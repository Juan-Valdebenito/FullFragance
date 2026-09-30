"use client";
import { useRouter } from "next/navigation";
import { session } from "@/shared/api/client";
import { Icon } from "./Icon";
import styles from "./shared.module.css";

export function LogoutButton() {
  const router = useRouter();
  return <button className={styles.iconAction} aria-label="Cerrar sesión" onClick={() => { session.clear(); router.push("/login"); }}><Icon name="logout" /></button>;
}
