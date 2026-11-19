"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/shared/api/client";
import type { Review } from "@/shared/api/types";
import styles from "./Reviews.module.css";

const NAME_MAX = 40;
const BODY_MIN = 10;
const BODY_MAX = 600;
const dateFormat = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });

type Status = { kind: "idle" | "sending" | "sent" | "error"; message?: string };

/**
 * Reseñas del sitio: cualquiera puede dejar una con su nombre, pero sólo se
 * muestran las que un administrador aprobó en /admin/resenas.
 */
export function Reviews() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    api.reviews().then(setReviews).catch(() => setReviews([]));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "sending" });
    try {
      const result = await api.submitReview({ name: name.trim(), body: body.trim(), website });
      setStatus({ kind: "sent", message: result.message });
      setName("");
      setBody("");
    } catch (reason) {
      setStatus({ kind: "error", message: reason instanceof ApiError ? reason.message : "No se pudo enviar tu reseña." });
    }
  }

  return (
    <section className={`container ${styles.reviews}`} aria-labelledby="reviews-title">
      <div className={styles.intro}>
        <h2 id="reviews-title">Lo que dicen de FullFragance</h2>
        <p>¿Te sirvió el comparador? Cuéntalo en pocas palabras. Revisamos cada reseña antes de publicarla.</p>

        <form className={styles.form} onSubmit={submit}>
          <label>
            <span>Tu nombre</span>
            <input value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={NAME_MAX} autoComplete="given-name" placeholder="Cómo quieres firmar" />
          </label>
          <label>
            <span>Tu reseña</span>
            <textarea value={body} onChange={event => setBody(event.target.value)} required minLength={BODY_MIN} maxLength={BODY_MAX} rows={4} placeholder="Qué perfume buscabas y cómo te fue" />
            <small>{body.length}/{BODY_MAX}</small>
          </label>
          {/* Campo trampa para bots: oculto a personas y lectores de pantalla. */}
          <input className={styles.trap} value={website} onChange={event => setWebsite(event.target.value)} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <button type="submit" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Enviando…" : "Enviar reseña"}
          </button>
          {status.message && (
            <p className={status.kind === "error" ? styles.error : styles.success} role={status.kind === "error" ? "alert" : "status"}>
              {status.message}
            </p>
          )}
        </form>
      </div>

      {reviews === null ? (
        <p className={styles.empty} role="status">Cargando reseñas…</p>
      ) : reviews.length ? (
        // Cada reseña es una mouillette: la tira de papel con que se prueba un perfume.
        <ul className={styles.list}>
          {reviews.map(review => (
            <li key={review.id} className={styles.strip}>
              <blockquote>{review.body}</blockquote>
              <footer>
                <span className={styles.monogram} aria-hidden="true">{review.name.trim().charAt(0).toUpperCase()}</span>
                <span>
                  <strong>{review.name}</strong>
                  <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
                </span>
              </footer>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.empty}>
          <div className={styles.fan} aria-hidden="true">
            <span className={styles.strip} />
            <span className={styles.strip}>Tu reseña</span>
            <span className={styles.strip} />
          </div>
          <p>Todavía no hay reseñas publicadas. Deja la primera con el formulario.</p>
        </div>
      )}
    </section>
  );
}
