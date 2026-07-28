"use client";

import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { HEADER_NAV_ITEMS, filterNavItems } from "@/shared/navigation/navConfig";
import styles from "./shared.module.css";

function PerfumesMegaMenu({ showPersonalTools }: { showPersonalTools: boolean }) {
  return (
    <div className={styles.megaTrigger}>
      <button type="button">
        Perfumes <span aria-hidden="true">⌄</span>
      </button>
      <div className={styles.megaMenu}>
        <div className={`container ${styles.megaGrid}`}>
          <section>
            <h2>Para quién</h2>
            <Link href="/dashboard?q=mujer">Perfumes de mujer</Link>
            <Link href="/dashboard?q=hombre">Perfumes de hombre</Link>
            <Link href="/dashboard?q=unisex">Fragancias unisex</Link>
            <Link className={styles.viewAll} href="/dashboard">
              Ver catálogo completo
            </Link>
          </section>
          <section>
            <h2>Familias olfativas</h2>
            <Link href="/dashboard?q=floral">Florales</Link>
            <Link href="/dashboard?q=amaderado">Amaderadas</Link>
            <Link href="/dashboard?q=citrico">Cítricas</Link>
            <Link href="/dashboard?q=gourmand">Gourmand</Link>
            <Link href="/dashboard?q=oriental">Orientales</Link>
          </section>
          <section>
            <h2>Concentración</h2>
            <Link href="/dashboard?q=edp">Eau de Parfum</Link>
            <Link href="/dashboard?q=edt">Eau de Toilette</Link>
            <Link href="/dashboard?q=parfum">Parfum y Extrait</Link>
            <Link href="/dashboard?q=colonia">Colonias</Link>
          </section>
          <section>
            <h2>Marcas destacadas</h2>
            <Link href="/dashboard?q=carolina herrera">Carolina Herrera</Link>
            <Link href="/dashboard?q=giorgio armani">Giorgio Armani</Link>
            <Link href="/dashboard?q=versace">Versace</Link>
            <Link href="/dashboard?q=ralph lauren">Ralph Lauren</Link>
            <Link href="/dashboard?q=dolce gabbana">Dolce &amp; Gabbana</Link>
          </section>
          {showPersonalTools && (
            <section className={styles.toolsColumn}>
              <h2>Encuentra tu fragancia</h2>
              <Link href="/test">
                <strong>Test olfativo</strong>
                <small>Descubre qué notas van contigo</small>
              </Link>
              <Link href="/recomendaciones">
                <strong>Recomendaciones</strong>
                <small>Selección basada en tu perfil</small>
              </Link>
              <Link href="/favoritos">
                <strong>Mis favoritos</strong>
                <small>Revisa tus perfumes guardados</small>
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export function HeaderNav({ active }: { active?: "catalog" | "test" }) {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return (
      <nav aria-label="Navegación de administración">
        <Link className={active === "catalog" ? styles.active : ""} href="/dashboard">
          Panel Admin
        </Link>
        <PerfumesMegaMenu showPersonalTools={false} />
      </nav>
    );
  }

  const navItems = filterNavItems(HEADER_NAV_ITEMS, user);

  return (
    <nav aria-label="Navegación principal">
      <PerfumesMegaMenu showPersonalTools={Boolean(user)} />
      {navItems.map(item => (
        <Link
          key={item.href}
          className={item.activeKey && active === item.activeKey ? styles.active : ""}
          href={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
