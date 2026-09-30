"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, session } from "@/shared/api/client";
import type { ApiNote } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import styles from "./quiz.module.css";

const STEP_SIZE = 6;
const iconFor = (family: string): "leaf" | "tree" | "flower" => family.includes("Amader") ? "tree" : family.includes("Floral") ? "flower" : "leaf";

export function OlfactoryQuiz() {
  const router = useRouter();
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.notes()
      .then(availableNotes => {
        setNotes(availableNotes);
        if (session.hasToken()) {
          api.me()
            .then(user => setRatings(user.scentPreferences?.scores ?? {}))
            .catch(() => {});
        }
      })
      .catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las notas."));
  }, []);

  const pages = useMemo(() => Array.from({ length: Math.ceil(notes.length / STEP_SIZE) }, (_, index) => notes.slice(index * STEP_SIZE, (index + 1) * STEP_SIZE)), [notes]);
  const currentNotes = pages[step] ?? [];
  const isLastStep = step === pages.length - 1;
  const ratedOnStep = currentNotes.filter(note => ratings[note.id]).length;
  const progress = pages.length ? ((step + 1) / pages.length) * 100 : 0;

  const continueTest = async () => {
    if (ratedOnStep === 0) { setError("Califica al menos una nota de esta etapa para continuar."); return; }
    setError("");
    if (!isLastStep) { setStep(current => current + 1); return; }
    setSaving(true);
    try {
      if (session.hasToken()) {
        await api.saveQuiz(ratings);
      }
      router.push("/recomendaciones");
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo guardar el test.");
      setSaving(false);
    }
  };

  return <div className={styles.backdrop}><section className={styles.modal} aria-labelledby="quiz-title">
    <div className={styles.progress}><span style={{ width: `${progress}%` }}/></div>
    <div className={styles.content}>
      <header><p className="eyebrow">Etapa {Math.min(step + 1, pages.length || 1)} de {pages.length || 4}</p><h1 id="quiz-title">Construye tu perfil olfativo</h1><p>Califica cuánto te atrae cada nota. Puedes dejar sin calificar las que aún no conozcas.</p></header>
      <div className={styles.stepMeta}><strong>{currentNotes[0]?.family ?? "Cargando preferencias"}</strong><span>{ratedOnStep} de {currentNotes.length} calificadas</span></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.notes}>{currentNotes.map(note => <article key={note.id}>
        <div className={styles.noteIcon}><Icon name={iconFor(note.family)} size={28}/></div>
        <div className={styles.noteText}><h2>{note.name}</h2><small>{note.family}</small><p>{note.description}</p></div>
        <div className={styles.stars} aria-label={`Calificación para ${note.name}`}>{[1,2,3,4,5].map(score => <button key={score} aria-label={`${score} estrellas`} aria-pressed={(ratings[note.id] ?? 0) >= score} onClick={() => { setRatings(current => ({...current,[note.id]:score})); setError(""); }}>★</button>)}</div>
      </article>)}</div>
      {!notes.length && !error && <p className={styles.loading}>Cargando el test completo…</p>}
      <footer><button className={styles.skip} disabled={step === 0} onClick={() => { setStep(current => Math.max(0, current - 1)); setError(""); }}>Anterior</button><div className={styles.dots}>{pages.map((_, index) => <span key={index} data-active={index === step}/>)}</div><button disabled={saving || !notes.length} className={styles.next} onClick={continueTest}>{saving ? "Creando recomendaciones…" : isLastStep ? "Finalizar test" : "Siguiente etapa"}</button></footer>
    </div>
  </section></div>;
}
