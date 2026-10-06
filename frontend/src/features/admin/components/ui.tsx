import { AdminIcon, type AdminIconName } from "./AdminIcon";
import styles from "./admin.module.css";

export function SectionHeader({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className={styles.sectionHeader}>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className={styles.sectionActions}>{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  loading,
  icon,
  progress,
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  loading?: boolean;
  icon?: AdminIconName;
  /** 0–100: dibuja una barra bajo la cifra (porcentajes y cuotas). */
  progress?: number;
}) {
  return (
    <article className={styles.stat}>
      <div className={styles.statTop}>
        <span className={styles.statLabel}>{label}</span>
        {icon && <span className={styles.statIcon}><AdminIcon name={icon} size={18} /></span>}
      </div>
      <strong className={styles.statValue}>{loading ? <span className={styles.skeletonText} /> : value}</strong>
      {progress !== undefined && !loading && (
        <span className={styles.statProgress} aria-hidden="true">
          <span style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </span>
      )}
      {hint && <span className={styles.statHint}>{hint}</span>}
    </article>
  );
}

export function Panel({ title, meta, children, className = "" }: { title: string; meta?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`${styles.panel} ${className}`}>
      <header className={styles.panelHeader}>
        <h2>{title}</h2>
        {meta && <span className={styles.panelMeta}>{meta}</span>}
      </header>
      {children}
    </section>
  );
}

export function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
