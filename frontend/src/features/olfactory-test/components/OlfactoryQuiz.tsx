"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { olfactoryNotes } from "../domain/note";
import { Icon } from "@/shared/components/Icon";
import styles from "./quiz.module.css";

export function OlfactoryQuiz() {
  const router = useRouter();
  const [ratings, setRatings] = useState<Record<string, number>>({});
  return <div className={styles.backdrop}><section className={styles.modal} aria-labelledby="quiz-title">
    <div className={styles.progress}><span /></div><div className={styles.content}>
      <header><p className="eyebrow">Paso 3 de 4</p><h1 id="quiz-title">Test olfativo</h1><p>¿Qué notas te gustan más? Califica del 1 al 5 cuánto te atrae cada nota.</p></header>
      <div className={styles.notes}>{olfactoryNotes.map(note => <article key={note.id}><div className={styles.noteIcon}><Icon name={note.icon} size={30}/></div><h2>{note.name}</h2><div className={styles.stars} aria-label={`Calificación para ${note.name}`}>{[1,2,3,4,5].map(score => <button key={score} aria-label={`${score} estrellas`} aria-pressed={(ratings[note.id] ?? 0) >= score} onClick={() => setRatings(current => ({...current, [note.id]: score}))}>★</button>)}</div><small>{note.family}</small></article>)}</div>
      <footer><button className={styles.skip} onClick={() => router.push("/dashboard")}>Omitir por ahora</button><button className={styles.next} onClick={() => router.push("/recomendaciones")}>Ver mis resultados</button></footer>
    </div>
  </section></div>;
}
