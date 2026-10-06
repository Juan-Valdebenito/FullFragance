"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api, session } from "@/shared/api/client";
import type { User } from "@/shared/api/types";
import { SessionProvider } from "@/shared/auth/SessionContext";
import { ThemeToggle } from "@/shared/theme/ThemeToggle";
import { AdminProvider, useAdmin } from "../AdminContext";
import { AdminIcon } from "./AdminIcon";
import styles from "./admin.module.css";

type Access = { status: "checking" } | { status: "granted"; user: User };

// /admin no hereda la sesión opcional del sitio: valida el token antes de
// montar el panel y saca a quien no sea admin.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [access, setAccess] = useState<Access>({ status: "checking" });

  useEffect(() => {
    let cancelled = false;
    if (!session.hasToken()) {
      router.replace("/login?next=/admin");
      return;
    }
    api.me()
      .then((user) => {
        if (cancelled) return;
        if (user.role === "admin") setAccess({ status: "granted", user });
        else router.replace("/dashboard");
      })
      .catch(() => {
        session.clear();
        if (!cancelled) router.replace("/login?next=/admin");
      });
    return () => { cancelled = true; };
  }, [router]);

  if (access.status === "checking") {
    return <div className={styles.gate} role="status">Verificando acceso…</div>;
  }

  return (
    <SessionProvider initialUser={access.user}>
      <AdminProvider>
        <AdminFrame user={access.user}>{children}</AdminFrame>
      </AdminProvider>
    </SessionProvider>
  );
}

const NAV = [
  { href: "/admin", label: "Resumen", icon: "overview" },
  { href: "/admin/monitoreo", label: "Monitoreo", icon: "activity" },
  { href: "/admin/sincronizacion", label: "Sincronización", icon: "sync" },
  { href: "/admin/catalogo", label: "Catálogo", icon: "catalog" },
] as const;

function AdminFrame({ user, children }: { user: User; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { items, reload, loadingCatalog, loadingMetrics, anySyncRunning } = useAdmin();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/admin/catalogo?q=${encodeURIComponent(q)}` : "/admin/catalogo");
    setMenuOpen(false);
  }

  function logout() {
    session.clear();
    router.push("/login");
  }

  const displayName = user.name?.trim() || user.email;

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-label="Navegación del panel">
        <div className={styles.sidebarHead}>
          <Link href="/admin" className={styles.brand} onClick={() => setMenuOpen(false)}>
            FullFragrance <span>Admin</span>
          </Link>
          <button type="button" className={styles.iconButton} onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
            <AdminIcon name="close" />
          </button>
        </div>

        <nav className={styles.nav}>
          <p className={styles.navLabel}>Panel</p>
          {NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <AdminIcon name={item.icon} />
                <span>{item.label}</span>
                {item.icon === "sync" && anySyncRunning && <span className={styles.navPulse} aria-label="Sincronización en curso" />}
                {item.icon === "catalog" && !loadingCatalog && <span className={styles.navCount}>{items.length.toLocaleString("es-CL")}</span>}
              </Link>
            );
          })}
        </nav>

        <nav className={styles.nav}>
          <p className={styles.navLabel}>Sitio</p>
          <Link href="/dashboard" className={styles.navItem}>
            <AdminIcon name="external" />
            <span>Ver sitio</span>
          </Link>
          <button type="button" className={styles.navItem} onClick={logout}>
            <AdminIcon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </aside>

      {menuOpen && <div className={styles.scrim} onClick={() => setMenuOpen(false)} aria-hidden="true" />}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={`${styles.iconButton} ${styles.menuButton}`} onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
            <AdminIcon name="menu" />
          </button>

          <form className={styles.search} onSubmit={search} role="search">
            <AdminIcon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar en el catálogo…"
              aria-label="Buscar en el catálogo"
            />
          </form>

          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => void reload()}
              disabled={loadingCatalog || loadingMetrics}
            >
              <AdminIcon name="sync" size={16} />
              <span className={styles.hideMobile}>{loadingCatalog || loadingMetrics ? "Cargando…" : "Recargar"}</span>
            </button>
            <ThemeToggle />
            <div className={styles.userChip} title={user.email}>
              <span className={styles.avatar}>{displayName.charAt(0).toUpperCase()}</span>
              <span className={styles.hideMobile}>
                <strong>{displayName}</strong>
                <small>Administrador</small>
              </span>
            </div>
          </div>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
