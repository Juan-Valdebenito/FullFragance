import type { ActivityEvent } from "../AdminContext";
import styles from "./admin.module.css";

const KIND_CLASS = { sync: styles.kindSync, error: styles.kindError, info: styles.kindInfo };

export function ActivityList({ events, empty = "Sin actividad en esta sesión." }: { events: ActivityEvent[]; empty?: string }) {
  if (!events.length) return <p className={styles.empty}>{empty}</p>;
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
