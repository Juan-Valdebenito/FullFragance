"use client";

import { FormEvent, useState } from "react";
import { api, ApiError, session } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";
import { PageHeader } from "@/shared/components/PageHeader";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { Icon } from "@/shared/components/Icon";
import styles from "./panel.module.css";

function LoginForm() {
  const optionalSession = useOptionalSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      const user = await optionalSession?.refreshUser();
      if (user && user.role !== "admin") {
        session.clear();
        setError("Esta cuenta no tiene permisos de administrador.");
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.topRight}><ThemeToggle /></div>
      <form className={styles.loginCard} onSubmit={submit}>
        <div className={styles.loginBrand}>
          <p className="eyebrow">FullFragrance</p>
          <h1 className="display">Panel interno</h1>
          <p className={styles.subtitle}>Acceso restringido — solo administradores.</p>
        </div>
        <label>
          Correo
          <input name="email" type="email" required autoComplete="username" placeholder="tu@correo.com" />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" required autoComplete="current-password" placeholder="••••••••" />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
        <p className={styles.footnote}>Herramienta interna — no indexada, no pública.</p>
      </form>
    </div>
  );
}

export default function PanelPage() {
  const optionalSession = useOptionalSession();
  const user = optionalSession?.user ?? null;

  if (!user) return <LoginForm />;

  if (user.role !== "admin") {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <p className="eyebrow">FullFragrance</p>
            <h1 className="display">Sin acceso</h1>
            <p className={styles.subtitle}>Tu cuenta no tiene permisos de administrador.</p>
          </div>
          <button type="button" className={styles.logoutButton} onClick={() => optionalSession?.logout()}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <PageHeader
        eyebrow="Panel interno"
        title={`Hola, ${user.name.split(" ")[0]}`}
        description="Monitorea métricas del sistema, ejecuta scrapers en tiempo real y gestiona el catálogo."
      >
        <div className={styles.headerActions}>
          <ThemeToggle />
          <span className={styles.userChip}><Icon name="user" size={14} />{user.name}</span>
          <button type="button" className={styles.logoutButton} onClick={() => optionalSession?.logout()}>
            <Icon name="logout" size={14} />
            Cerrar sesión
          </button>
        </div>
      </PageHeader>
      <div className={`container ${styles.body}`}>
        <AdminDashboard user={user} />
      </div>
    </main>
  );
}
