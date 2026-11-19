"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "@/shared/api/client";
import type { Review } from "@/shared/api/types";
import { Panel, SectionHeader } from "./ui";
import styles from "./admin.module.css";
import own from "./ReviewsSection.module.css";

const dateFormat = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" });

export function ReviewsSection() {
  const [pending, setPending] = useState<Review[] | null>(null);
  const [approved, setApproved] = useState<Review[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Borrar pide un segundo clic: el admin no tiene diálogo de confirmación.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => api.adminReviews().then(
    data => {
      setPending(data.pending);
      setApproved(data.approved);
      setError("");
    },
    reason => {
      setPending(current => current ?? []);
      setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las reseñas.");
    },
  ), []);

  useEffect(() => { void load(); }, [load]);

  async function run(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError("");
    try {
      await action();
      setConfirmId(null);
      await load();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo completar la acción.");
    } finally {
      setBusyId(null);
    }
  }

  function renderReview(review: Review, canApprove: boolean) {
    const busy = busyId === review.id;
    const confirming = confirmId === review.id;
    return (
      <li key={review.id} className={own.item}>
        <div className={own.meta}>
          <strong>{review.name}</strong>
          <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
        </div>
        <p className={own.body}>{review.body}</p>
        <div className={own.actions}>
          {canApprove && (
            <button type="button" className={styles.primaryButton} disabled={busy} onClick={() => run(review.id, () => api.approveReview(review.id))}>
              Aprobar
            </button>
          )}
          {confirming ? (
            <>
              <button type="button" className={`${styles.ghostButton} ${own.danger}`} disabled={busy} onClick={() => run(review.id, () => api.deleteReview(review.id))}>
                Sí, eliminar
              </button>
              <button type="button" className={styles.ghostButton} disabled={busy} onClick={() => setConfirmId(null)}>
                Cancelar
              </button>
            </>
          ) : (
            <button type="button" className={styles.ghostButton} disabled={busy} onClick={() => setConfirmId(review.id)}>
              {canApprove ? "Rechazar" : "Eliminar"}
            </button>
          )}
        </div>
      </li>
    );
  }

  return (
    <>
      <SectionHeader title="Reseñas" description="Las reseñas nuevas no se publican hasta que las apruebes. Rechazar una la elimina." />
      {error && <p className={own.error} role="alert">{error}</p>}

      <Panel title="Pendientes" meta={pending ? `${pending.length} por revisar` : "Cargando…"}>
        {pending === null ? (
          <p className={styles.empty}>Cargando reseñas…</p>
        ) : pending.length ? (
          <ul className={own.list}>{pending.map(review => renderReview(review, true))}</ul>
        ) : (
          <p className={styles.empty}>No hay reseñas esperando aprobación.</p>
        )}
      </Panel>

      <Panel title="Publicadas" meta={`${approved.length} visibles en la home`}>
        {approved.length ? (
          <ul className={own.list}>{approved.map(review => renderReview(review, false))}</ul>
        ) : (
          <p className={styles.empty}>Todavía no hay reseñas publicadas.</p>
        )}
      </Panel>
    </>
  );
}
