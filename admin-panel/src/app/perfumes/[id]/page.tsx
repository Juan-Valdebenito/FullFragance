"use client";

import { use } from "react";
import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { ProductDetail } from "@/features/catalog/components/ProductDetail";
import styles from "../../panel.module.css";

export default function AdminPerfumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = use(params);
  const { back } = use(searchParams);
  const optionalSession = useOptionalSession();
  const user = optionalSession?.user ?? null;

  if (!user || user.role !== "admin") {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <p className="eyebrow">FullFragrance</p>
            <h1 className="display">Sesión requerida</h1>
            <p className={styles.subtitle}>Debes iniciar sesión como administrador para ver esta ficha.</p>
          </div>
          <Link className={styles.logoutButton} href="/">Volver al panel</Link>
        </div>
      </div>
    );
  }

  // Solo rutas relativas (evita open redirect con un "back" externo).
  let backHref = "/";
  if (back) {
    try {
      const decoded = decodeURIComponent(back);
      if (decoded.startsWith("/")) backHref = decoded;
    } catch {
      // Si el decode falla, usar el default.
    }
  }

  return (
    <main className="container" style={{ paddingBlock: "24px" }}>
      <ProductDetail productId={id} backHref={backHref} />
    </main>
  );
}
