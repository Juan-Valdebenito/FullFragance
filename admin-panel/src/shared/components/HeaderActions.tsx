"use client";
import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { Icon } from "./Icon";
import { LogoutButton } from "./LogoutButton";
import styles from "./shared.module.css";

// Durante eventos de trafico alto (ej. cyberday) se oculta el registro/login
// para que nadie pague el costo de bcrypt ni el navegador se distraiga con
// login: solo catalogo, comparador de precios y ofertas, 100% publico.
// El login sigue funcionando en /login para el admin (URL directa); esto
// solo esconde la invitacion en el header. Revertir: quitar la env var o
// ponerla en "true" y redeploy del frontend.
const ACCOUNTS_ENABLED = process.env.NEXT_PUBLIC_ACCOUNTS_ENABLED !== "false";

export function HeaderActions() {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";

  if (!user) {
    if (!ACCOUNTS_ENABLED) {
      return (
        <div className={styles.actions}>
          <ThemeToggle />
        </div>
      );
    }
    return (
      <div className={styles.actions}>
        <ThemeToggle />
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
      <ThemeToggle />
      <Link aria-label="Perfil" href="/perfil"><Icon name="user" /></Link>
      <LogoutButton />
    </div>
  );
}
