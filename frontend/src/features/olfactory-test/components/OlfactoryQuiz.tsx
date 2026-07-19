"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/shared/api/client";
import type { ApiNote } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import styles from "./quiz.module.css";
const iconFor = (family: string): "leaf" | "tree" | "flower" => family.includes("Amader") ? "tree" : family.includes("Floral") ? "flower" : "leaf";
export function OlfactoryQuiz() {
  const router = useRouter(); const [notes, setNotes] = useState<ApiNote[]>([]); const [ratings, setRatings] = useState<Record<string, number>>({}); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { api.notes().then(data => setNotes(data.slice(0, 6))).catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las notas.")); }, []);
  const finish = async () => { if (!Object.keys(ratings).length) { setError("Califica al menos una nota para continuar."); return; } setSaving(true); setError(""); try { await api.saveQuiz(ratings); router.push("/recomendaciones"); } catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo guardar el test."); setSaving(false); } };
  return <div className={styles.backdrop}><section className={styles.modal} aria-labelledby="quiz-title"><div className={styles.progress}><span/></div><div className={styles.content}><header><p className="eyebrow">Paso 3 de 4</p><h1 id="quiz-title">Test olfativo</h1><p>¿Qué notas te gustan más? Califica del 1 al 5 cuánto te atrae cada nota.</p></header>
    {error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.notes}>{notes.map(note => <article key={note.id}><div className={styles.noteIcon}><Icon name={iconFor(note.family)} size={30}/></div><h2>{note.name}</h2><div className={styles.stars} aria-label={`Calificación para ${note.name}`}>{[1,2,3,4,5].map(score => <button key={score} aria-label={`${score} estrellas`} aria-pressed={(ratings[note.id] ?? 0) >= score} onClick={() => setRatings(current => ({...current,[note.id]:score}))}>★</button>)}</div><small>{note.family}</small></article>)}</div>
    {!notes.length && !error && <p className={styles.loading}>Cargando notas olfativas…</p>}<footer><button className={styles.skip} onClick={() => router.push("/dashboard")}>Omitir por ahora</button><button disabled={saving} className={styles.next} onClick={finish}>{saving ? "Guardando…" : "Ver mis resultados"}</button></footer></div></section></div>;
}
