"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, session } from "@/shared/api/client";
import styles from "./admin.module.css";

// Acceso del panel. No depende de NEXT_PUBLIC_ACCOUNTS_ENABLED: aunque /login y
// /registro estén desactivados para el público, el admin necesita entrar.
// Solo deja sesión abierta a cuentas con rol admin.
export function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session.hasToken()) return;
    let cancelled = false;
    api.me()
      .then((user) => { if (!cancelled && user.role === "admin") router.replace("/admin"); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const user = await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      if (user.role !== "admin") {
        session.clear();
        setError("Esta cuenta no tiene acceso al panel.");
        setLoading(false);
        return;
      }
      router.replace("/admin");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No fue posible iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <form className={styles.loginCard} onSubmit={submit}>
        <div>
          <p className={styles.brand}>FullFragrance <span>Admin</span></p>
          <h1>Iniciar sesión</h1>
          <p>Acceso exclusivo para administradores.</p>
        </div>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          <span>Contraseña</span>
          <input name="password" type="password" autoComplete="current-password" minLength={6} required />
        </label>
        {error && <p className={styles.loginError} role="alert">{error}</p>}
        <button type="submit" className={styles.primaryButton} disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </main>
  );
}
