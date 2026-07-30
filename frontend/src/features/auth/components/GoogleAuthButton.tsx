"use client";

import { useEffect, useRef } from "react";
import { api, ApiError } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";

declare global {
  interface Window {
    google?: { accounts: { id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      renderButton: (parent: HTMLElement, options: { type?: string; theme?: string; size?: string; text?: string; shape?: string; width?: number }) => void;
    } } };
  }
}

type GoogleAuthButtonProps = { onSuccess?: () => void; onError?: (msg: string) => void };

export function GoogleAuthButton({ onSuccess, onError }: GoogleAuthButtonProps) {
  const optionalSession = useOptionalSession();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const hasClientId = Boolean(clientId);

  useEffect(() => {
    if (!clientId) return;
    const initialize = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try {
            await api.loginWithGoogle({ credential });
            await optionalSession?.refreshUser();
            onSuccess?.();
          } catch (error) {
            onError?.(error instanceof ApiError ? error.message : "No fue posible iniciar sesión con Google.");
          }
        },
      });
      googleBtnRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleBtnRef.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: 380 });
    };
    const existingScript = document.getElementById("google-jssdk");
    if (existingScript) { if (window.google) initialize(); else existingScript.addEventListener("load", initialize, { once: true }); }
    else {
      const script = document.createElement("script");
      script.id = "google-jssdk";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", initialize, { once: true });
      document.head.appendChild(script);
    }
  }, [clientId, onSuccess, onError, optionalSession]);

  if (hasClientId) return <div style={{ display: "flex", justifyContent: "center", width: "100%" }}><div ref={googleBtnRef} /></div>;
  return <p role="status" style={{ color: "var(--on-surface-muted)", fontSize: ".82rem", textAlign: "center" }}>El acceso con Google estará disponible al configurar <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>.</p>;
}
