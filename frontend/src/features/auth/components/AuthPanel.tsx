"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { GOOGLE_LOGIN_ENABLED, GoogleAuthButton } from "./GoogleAuthButton";
import styles from "./AuthPanel.module.css";

export function AuthPanel({ mode }: { mode: "register" | "login" }) {
  const router = useRouter();
  const optionalSession = useOptionalSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuccessRedirect = async () => {
    const user = await optionalSession?.refreshUser();
    const next = new URLSearchParams(window.location.search).get("next");
    const home = user?.role === "admin" ? "/admin" : "/dashboard";
    router.push(next || (mode === "register" ? "/test" : home));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      if (mode === "register") await api.register({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) });
      else await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      await handleSuccessRedirect();
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : "No fue posible completar la solicitud."); setLoading(false); }
  };

  return (
    <section className={styles.card} aria-labelledby="auth-title">
      <h2 id="auth-title">{mode === "register" ? "Crear cuenta" : "Iniciar sesión"}</h2>
      {GOOGLE_LOGIN_ENABLED && (
        <>
          <GoogleAuthButton onSuccess={handleSuccessRedirect} onError={(msg) => setError(msg)} />
          <div className={styles.divider}>o con tu correo</div>
        </>
      )}
      <form onSubmit={submit} className={styles.form}>
        {mode === "register" && (
          <label>Nombre<input name="name" required autoComplete="name" placeholder="Cómo te llamamos" /></label>
        )}
        <label>Correo<input name="email" required type="email" autoComplete="email" placeholder="nombre@correo.com" /></label>
        <label>
          Contraseña
          <input name="password" required minLength={6} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "Mínimo 6 caracteres" : ""} />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button disabled={loading} className={styles.submit} type="submit">
          {loading ? (mode === "register" ? "Creando cuenta…" : "Iniciando sesión…") : mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>
      {mode === "register" && (
        <p className={styles.legal}>Al crear una cuenta aceptas la <Link href="/politica-de-uso">política de uso</Link> y la <Link href="/politica-de-datos">política de datos</Link>.</p>
      )}
      <p className={styles.switch}>
        {mode === "register"
          ? <>¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></>
          : <>¿No tienes cuenta? <Link href="/registro">Crea una</Link></>}
      </p>
    </section>
  );
}
