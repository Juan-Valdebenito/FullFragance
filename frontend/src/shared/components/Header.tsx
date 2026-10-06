import { Brand } from "./Brand";
import { HeaderNav } from "./HeaderNav";
import { HeaderActions } from "./HeaderActions";
import { Suspense } from "react";
import { SmartSearch, SmartSearchFallback } from "@/shared/search/SmartSearch";
import styles from "./shared.module.css";

export function Header({ active, search = true }: { active?: "catalog" | "test"; search?: boolean }) {
  return (
    <header className={styles.topbar}>
      {/* Una sola grilla: en escritorio marca · buscador · cuenta y abajo las
          categorías; en móvil el buscador baja a su propia fila. */}
      <div className={`container ${styles.headerGrid}`}>
        <Brand />
        {/* Una sola barra para todo el sitio. Suspense: lee la URL (useSearchParams)
            y sin él las páginas estáticas no podrían prerenderizarse. */}
        {search && (
          <Suspense fallback={<SmartSearchFallback />}>
            <SmartSearch />
          </Suspense>
        )}
        <HeaderActions />
        <HeaderNav active={active} />
      </div>
    </header>
  );
}
