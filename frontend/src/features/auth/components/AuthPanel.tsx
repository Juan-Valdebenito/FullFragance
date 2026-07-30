"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { GoogleAuthButton } from "./GoogleAuthButton";
import styles from "./AuthPanel.module.css";

export function AuthPanel({ mode }: { mode: "register" | "login" }) {
  const router = useRouter();
  const optionalSession = useOptionalSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuccessRedirect = () => {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next || (mode === "register" ? "/test" : "/dashboard"));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      if (mode === "register") await api.register({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) });
      else await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      await optionalSession?.refreshUser();
      handleSuccessRedirect();
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : "No fue posible completar la solicitud."); setLoading(false); }
  };

  return <section className={styles.card} aria-label={mode === "register" ? "Crear cuenta" : "Iniciar sesión"}>
    <div className={styles.heading}><p className="eyebrow">{mode === "register" ? "Únete a FullFragrance" : "Bienvenido de vuelta"}</p><h2>{mode === "register" ? "Crear una cuenta" : "Iniciar sesión"}</h2></div>
    <div className={styles.form}>
      <GoogleAuthButton onSuccess={handleSuccessRedirect} onError={(msg) => setError(msg)} />
      <div className={styles.divider}>o ingresa con tu correo</div>
      <form onSubmit={submit} style={{ display: "grid", gap: "18px" }}>
        {mode === "register" && <label>Nombre completo<input name="name" required placeholder="Ej: Julian Casablancas" /></label>}
        <label>Email<input name="email" required type="email" placeholder="nombre@dominio.com" /></label>
        <label>Contraseña<input name="password" required minLength={6} type="password" placeholder="••••••••" /></label>
        {mode === "login" && <a href="#">¿Olvidaste tu contraseña?</a>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button disabled={loading} className={styles.submit} type="submit">{loading ? "Conectando…" : mode === "register" ? "Crear mi cuenta" : "Iniciar sesión"}</button>
      </form>
      {mode === "register" && <p>Al crear una cuenta aceptas la <Link href="/politica-de-uso">política de uso</Link> y la <Link href="/politica-de-datos">política de datos</Link>.</p>}
      <p>{mode === "register" ? <>¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></> : <>¿Aún no tienes cuenta? <Link href="/registro">Créala aquí</Link></>}</p>
    </div>
  </section>;
}
