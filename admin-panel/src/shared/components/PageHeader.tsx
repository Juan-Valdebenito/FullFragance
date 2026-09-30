import styles from "./shared.module.css";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}

/**
 * Encabezado unificado para páginas internas.
 * Reemplaza los `<section className={styles.hero}>` ad-hoc de cada página.
 */
export function PageHeader({ eyebrow, title, description, children }: PageHeaderProps) {
  return (
    <section className={`pageHeader container ${styles.pageHeaderInner}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="display">{title}</h1>
      {description && <p className="pageHeaderDesc">{description}</p>}
      {children}
    </section>
  );
}
