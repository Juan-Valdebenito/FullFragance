"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/shared/api/client";
import styles from "./AuthPanel.module.css";

export function AuthPanel({ mode }: { mode: "register" | "login" }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setLoading(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      if (mode === "register") await api.register({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) });
      else await api.login({ email: String(form.get("email")), password: String(form.get("password")) });
      router.push(mode === "register" ? "/test" : "/dashboard");
    } catch (reason) { setError(reason instanceof ApiError ? reason.message : "No fue posible completar la solicitud."); setLoading(false); }
  };
  return <section className={styles.card} aria-label={mode === "register" ? "Crear cuenta" : "Iniciar sesión"}>
    <div className={styles.heading}><p className="eyebrow">{mode === "register" ? "Únete a FullFragrance" : "Bienvenido de vuelta"}</p><h2>{mode === "register" ? "Crear una cuenta" : "Iniciar sesión"}</h2></div>
    <form onSubmit={submit} className={styles.form}>
      {mode === "register" && <label>Nombre completo<input name="name" required placeholder="Ej: Julian Casablancas" /></label>}
      <label>Email<input name="email" required type="email" placeholder="nombre@dominio.com" /></label>
      <label>Contraseña<input name="password" required minLength={6} type="password" placeholder="••••••••" /></label>
      {mode === "login" && <a href="#">¿Olvidaste tu contraseña?</a>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button disabled={loading} className={styles.submit} type="submit">{loading ? "Conectando…" : mode === "register" ? "Crear mi cuenta" : "Iniciar sesión"}</button>
      <p>{mode === "register" ? <>¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link></> : <>¿Aún no tienes cuenta? <Link href="/registro">Créala aquí</Link></>}</p>
    </form>
  </section>;
}
