"use client";

import { useEffect } from "react";
import { session } from "@/shared/api/client";
import { SessionProvider } from "@/shared/auth/SessionContext";

/**
 * A diferencia del sitio publico, este panel NO restaura sesiones guardadas:
 * cada vez que se abre o recarga la pagina exige ingresar el correo y
 * contraseña de nuevo. Es una herramienta administrativa; que el navegador
 * "recuerde" el login solo es justo lo que no queremos aca (cualquiera que
 * use ese mismo navegador despues entraria directo, sin credenciales).
 */
export function OptionalSessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    session.clear();
  }, []);

  return (
    <SessionProvider key="guest" initialUser={null}>
      {children}
    </SessionProvider>
  );
}
