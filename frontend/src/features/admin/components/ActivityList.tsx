import Link from "next/link";
import { BrandIcon } from "@/shared/components/BrandIcon";
import type { ActivityEvent } from "../AdminContext";
import styles from "./admin.module.css";

const KIND_CLASS = { sync: styles.kindSync, error: styles.kindError, info: styles.kindInfo };

export function ActivityList({ events, empty = "Sin actividad en esta sesión.", showAction = true }: { events: ActivityEvent[]; empty?: string; showAction?: boolean }) {
  if (!events.length) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyEmblem}><BrandIcon size={34} /></span>
        <p>{empty}</p>
        <small>Aquí aparecen las sincronizaciones y los errores mientras usas el panel.</small>
        {showAction && <Link href="/admin/sincronizacion">Sincronizar tiendas</Link>}
      </div>
    );
  }
  return (
    <ol className={styles.activity}>
      {events.map((event) => (
        <li key={event.id}>
          <span className={`${styles.activityDot} ${KIND_CLASS[event.kind]}`} />
          <p>{event.title}</p>
          <time>{event.time}</time>
        </li>
      ))}
    </ol>
  );
}
