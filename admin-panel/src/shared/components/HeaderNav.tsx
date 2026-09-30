"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { HEADER_NAV_ITEMS, filterNavItems, type NavItem } from "@/shared/navigation/navConfig";
import { Icon } from "./Icon";
import styles from "./shared.module.css";

/**
 * Secciones del menú de perfumes. Se reutilizan en dos sitios: el mega menú
 * de escritorio y el panel desplegable móvil, para que ambos ofrezcan los
 * mismos enlaces sin duplicar la lista.
 */
function PerfumesSections({ showPersonalTools }: { showPersonalTools: boolean }) {
  return (
    <>
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
    </>
  );
}

function PerfumesMegaMenu({ showPersonalTools }: { showPersonalTools: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // En escritorio el panel abre con :hover, pero en pantallas táctiles el
  // hover no existe: sin este estado el mega menú es inalcanzable.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!triggerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.megaTrigger} ref={triggerRef}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
        Perfumes <span aria-hidden="true">⌄</span>
      </button>
      <div className={styles.megaMenu} data-open={open || undefined}>
        <div className={`container ${styles.megaGrid}`} onClick={() => setOpen(false)}>
          <PerfumesSections showPersonalTools={showPersonalTools} />
        </div>
      </div>
    </div>
  );
}

/**
 * Panel de navegación para móvil y tablet pequeña. Por debajo de 900px el
 * `nav` de escritorio se oculta, así que sin esto no queda ninguna forma de
 * navegar fuera del logo.
 */
function MobileNav({
  items,
  active,
  showPersonalTools,
}: {
  items: NavItem[];
  active?: "catalog" | "test";
  showPersonalTools: boolean;
}) {
  const pathname = usePathname();
  // El panel se recuerda junto a la ruta en la que se abrió, así se cierra
  // solo al navegar sin necesidad de un efecto. Los enlaces que solo cambian
  // el query string (el catálogo) se cierran con el onClick del contenedor.
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  const setOpen = (value: boolean) => setOpenPath(value ? pathname : null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPath(null);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={() => setOpen(!open)}
      >
        <Icon name="menu" />
      </button>

      <div
        id="menu-movil"
        className={styles.mobilePanel}
        data-open={open || undefined}
        hidden={!open}
      >
        <div className={`container ${styles.mobileInner}`} onClick={() => setOpen(false)}>
          <nav className={styles.mobileLinks} aria-label="Navegación móvil">
            {items.map(item => (
              <Link
                key={item.label}
                className={item.activeKey && active === item.activeKey ? styles.active : ""}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.mobileSections}>
            <PerfumesSections showPersonalTools={showPersonalTools} />
          </div>
        </div>
      </div>
    </>
  );
}

export function HeaderNav({ active }: { active?: "catalog" | "test" }) {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";

  const items: NavItem[] = isAdmin
    ? [{ href: "/dashboard", label: "Panel Admin", activeKey: "catalog" }]
    : filterNavItems(HEADER_NAV_ITEMS, user);
  const showPersonalTools = !isAdmin && Boolean(user);

  return (
    <>
      <nav aria-label={isAdmin ? "Navegación de administración" : "Navegación principal"}>
        {isAdmin ? (
          <>
            <Link className={active === "catalog" ? styles.active : ""} href="/dashboard">
              Panel Admin
            </Link>
            <PerfumesMegaMenu showPersonalTools={false} />
          </>
        ) : (
          <>
            <PerfumesMegaMenu showPersonalTools={showPersonalTools} />
            {items.map(item => (
              <Link
                key={item.href}
                className={item.activeKey && active === item.activeKey ? styles.active : ""}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <MobileNav items={items} active={active} showPersonalTools={showPersonalTools} />
    </>
  );
}
