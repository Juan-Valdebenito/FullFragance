"use client";

import { FormEvent, useState } from "react";
import { api, ApiError, session } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";
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
      <form className={styles.loginCard} onSubmit={submit}>
        <h1>Panel interno</h1>
        <p className={styles.subtitle}>Acceso restringido — solo administradores.</p>
        <label>
          Correo
          <input name="email" type="email" required autoComplete="username" />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" required autoComplete="current-password" />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
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
          <h1>Sin acceso</h1>
          <p className={styles.subtitle}>Tu cuenta no tiene permisos de administrador.</p>
          <button type="button" onClick={() => optionalSession?.logout()}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panelShell}>
      <header className={styles.panelHeader}>
        <span>Panel interno · {user.name}</span>
        <button type="button" onClick={() => optionalSession?.logout()}>Cerrar sesión</button>
      </header>
      <div className="container">
        <AdminDashboard user={user} />
      </div>
    </div>
  );
}
