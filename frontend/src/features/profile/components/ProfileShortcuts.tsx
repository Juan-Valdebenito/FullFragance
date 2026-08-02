import Link from "next/link";
import { Icon } from "@/shared/components/Icon";
import styles from "./profile.module.css";

const shortcuts = [
  { href: "/favoritos", icon: "heart" as const, title: "Mis favoritos", description: "Revisa tus perfumes guardados y sus precios." },
  { href: "/recomendaciones", icon: "compass" as const, title: "Para ti", description: "Descubre fragancias según tu perfil olfativo." },
  { href: "/test", icon: "flower" as const, title: "Perfil olfativo", description: "Actualiza las notas y aromas que más te gustan." },
];

export function ProfileShortcuts() {
  return (
    <section className={styles.shortcuts}>
      <div className={styles.sectionHeading}>
        <div>
          <p className="eyebrow">Tu experiencia</p>
          <h2>Accesos rápidos</h2>
        </div>
      </div>
      <div className={styles.shortcutsGrid}>
        {shortcuts.map(shortcut => (
          <Link className={styles.shortcut} href={shortcut.href} key={shortcut.href}>
            <span><Icon name={shortcut.icon} size={18} /></span>
            <div><strong>{shortcut.title}</strong><small>{shortcut.description}</small></div>
            <Icon name="arrow" size={16} />
          </Link>
        ))}
      </div>
    </section>
  );
}
