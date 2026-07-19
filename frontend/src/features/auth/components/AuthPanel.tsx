"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AuthPanel.module.css";

export function AuthPanel() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const router = useRouter();
  const submit = (event: FormEvent) => { event.preventDefault(); router.push("/dashboard"); };
  return <section className={styles.card} aria-label="Acceso a FullFragrance">
    <div className={styles.tabs} role="tablist">
      <button role="tab" aria-selected={mode === "register"} onClick={() => setMode("register")}>Crear cuenta</button>
      <button role="tab" aria-selected={mode === "login"} onClick={() => setMode("login")}>Ya tengo cuenta</button>
    </div>
    <form onSubmit={submit} className={styles.form}>
      {mode === "register" && <label>Nombre completo<input required placeholder="Ej: Julian Casablancas" /></label>}
      <label>Email<input required type="email" placeholder="nombre@dominio.com" /></label>
      <label>Contraseña<input required minLength={6} type="password" placeholder="••••••••" /></label>
      {mode === "login" && <a href="#">¿Olvidaste tu contraseña?</a>}
      <button className={styles.submit} type="submit">{mode === "register" ? "Registrarse ahora" : "Iniciar sesión"}</button>
      {mode === "register" && <p>Al registrarte, aceptas nuestros <a href="#">Términos de Servicio</a>.</p>}
    </form>
  </section>;
}
