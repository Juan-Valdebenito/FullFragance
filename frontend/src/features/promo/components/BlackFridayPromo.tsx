"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/shared/components/Icon";
import styles from "./promo.module.css";

// Horario de verano de Chile continental (UTC-3) en noviembre.
const STARTS_AT = Date.parse("2026-11-27T00:00:00-03:00");
// Las tiendas extienden el evento hasta el domingo; el lunes la promo se retira sola.
const ENDS_AT = Date.parse("2026-11-30T00:00:00-03:00");

const INSTAGRAM_URL = "https://www.instagram.com/fullfragance67/";

// La primera tarjeta es el dato del Cyber anterior: cerca de 6.000 visitas.
const CARDS = [
  { icon: "trend" as const, title: "Casi 6.000 visitas", text: "en el último Cyber. ¡Gracias por comparar con nosotros!" },
  { icon: "swap" as const, title: "Todas las tiendas", text: "Comparamos cada oferta para que veas el descuento real" },
  { icon: "history" as const, title: "Precio histórico", text: "Revisa si el precio de verdad bajó antes de comprar" },
];

type Phase = "upcoming" | "live" | "over";
// A medida que se acerca la fecha, el contador pasa de dorado (calm) a
// ámbar (soon, últimos 3 días) y a rojo con pulso (urgent, últimas 24 h).
type Urgency = "calm" | "soon" | "urgent";
const SOON_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;
const URGENT_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function phaseAt(now: number): Phase {
  if (now >= ENDS_AT) return "over";
  if (now >= STARTS_AT) return "live";
  return "upcoming";
}

function urgencyAt(now: number): Urgency {
  const msLeft = STARTS_AT - now;
  if (msLeft <= URGENT_THRESHOLD_MS) return "urgent";
  if (msLeft <= SOON_THRESHOLD_MS) return "soon";
  return "calm";
}

function remaining(now: number) {
  const minutes = Math.max(0, Math.floor((STARTS_AT - now) / 60_000));
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60), minutes: minutes % 60 };
}

// La hora sale del navegador: en el servidor no se conoce, así que el primer
// render no muestra cifras y evita diferencias de hidratación.
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

// Marca "recién llegó" por unos segundos justo cuando pasa de upcoming a
// live, para disparar la animación de entrada una sola vez.
function useJustWentLive(phase: Phase) {
  const [justWentLive, setJustWentLive] = useState(false);
  const wasLive = useRef(false);
  useEffect(() => {
    if (phase === "live" && !wasLive.current) {
      wasLive.current = true;
      setJustWentLive(true);
      const timer = window.setTimeout(() => setJustWentLive(false), 1500);
      return () => window.clearTimeout(timer);
    }
    if (phase !== "live") wasLive.current = false;
  }, [phase]);
  return justWentLive;
}

export function BlackFridayPromo() {
  const now = useNow();
  const phase = now === null ? "upcoming" : phaseAt(now);
  const justWentLive = useJustWentLive(phase);
  if (phase === "over") return null;

  const live = phase === "live";
  const time = now === null ? null : remaining(now);
  const urgency = now === null ? "calm" : urgencyAt(now);

  return (
    <section className={`container ${styles.wrap}`} aria-labelledby="black-friday-title">
      <div className={styles.promo}>
        <div className={styles.copy}>
          <span className={styles.bar} aria-hidden="true" />
          <span className={styles.eyebrow}>{live ? "Es hoy" : "Viernes 27 de noviembre"}</span>
          <h2 id="black-friday-title">Black Friday 2026</h2>
          <p>
            {live
              ? "Ya están las ofertas del Black Friday. Compara antes de comprar y revisa qué descuento es real en cada tienda."
              : "Nos estamos preparando con todo para el cyber: vamos a comparar las ofertas de todas las tiendas para que sepas qué descuento es real y dónde está más barato."}
          </p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/dashboard?sort=savings">
              {live ? "Ver ofertas Black Friday" : "Ver ofertas de hoy"} <Icon name="arrow" size={18} />
            </Link>
            <a className={styles.secondary} href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
              <Icon name="instagram" size={18} /> Síguenos para las alertas
            </a>
          </div>
        </div>

        {live ? (
          <div className={`${styles.liveBadge} ${justWentLive ? styles.liveBurst : ""}`} aria-hidden="true">
            {justWentLive && (
              <>
                <span className={styles.liveFlash} />
                <span className={styles.shards}>
                  {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} style={{ transform: `rotate(${i * 45}deg)` }}><b /></i>
                  ))}
                </span>
              </>
            )}
            <span>Black</span>
            <strong>Friday</strong>
          </div>
        ) : (
          <dl className={styles.countdown} data-urgency={urgency} aria-label="Tiempo que falta para el Black Friday">
            <Unit value={time?.days} label="días" />
            <Unit value={time?.hours} label="horas" />
            <Unit value={time?.minutes} label="min" />
          </dl>
        )}
      </div>

      <ul className={styles.cards} aria-label="FullFragance en el Cyber">
        {CARDS.map((card, index) => (
          <li key={card.title} className={index === 0 ? styles.cardHighlight : undefined}>
            <span className={styles.cardIcon}><Icon name={card.icon} size={22} /></span>
            <span>
              <strong>{card.title}</strong>
              {card.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Unit({ value, label }: { value: number | undefined; label: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value === undefined ? "–" : String(value).padStart(2, "0")}</dd>
    </div>
  );
}
