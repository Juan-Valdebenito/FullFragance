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

export function StatCard({ label, value, hint, loading }: { label: string; value: string; hint?: React.ReactNode; loading?: boolean }) {
  return (
    <article className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{loading ? <span className={styles.skeletonText} /> : value}</strong>
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
