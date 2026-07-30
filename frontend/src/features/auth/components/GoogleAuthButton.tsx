"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

type GoogleAuthButtonProps = {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
};

export function GoogleAuthButton({ onSuccess, onError }: GoogleAuthButtonProps) {
  const optionalSession = useOptionalSession();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [hasClientId, setHasClientId] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) {
      setHasClientId(false);
      return;
    }
    setHasClientId(true);

    const scriptId = "google-jssdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleSignIn();
      document.head.appendChild(script);
    } else if (window.google) {
      initGoogleSignIn();
    }

    function initGoogleSignIn() {
      if (!window.google || !googleBtnRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              setLoading(true);
              await api.loginWithGoogle({ credential: response.credential });
              await optionalSession?.refreshUser();
              onSuccess?.();
            } catch (err) {
              const msg = err instanceof ApiError ? err.message : "Error al iniciar sesión con Google";
              onError?.(msg);
            } finally {
              setLoading(false);
            }
          },
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: 380,
        });
      } catch (e) {
        console.error("No se pudo inicializar Google Sign-In:", e);
      }
    }
  }, [clientId, onSuccess, onError, optionalSession]);

  const handleSimulatedGoogleAuth = async () => {
    try {
      setLoading(true);
      // Simulación de Google Auth cuando no hay CLIENT_ID configurado en entorno local
      const mockEmail = `usuario.google${Math.floor(Math.random() * 1000)}@gmail.com`;
      await api.loginWithGoogle({
        email: mockEmail,
        name: "Usuario Google",
        googleId: `google-sim-${Date.now()}`,
        picture: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      });
      await optionalSession?.refreshUser();
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al autenticar con Google";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  if (hasClientId) {
    return (
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <div ref={googleBtnRef} />
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleSimulatedGoogleAuth}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        width: "100%",
        padding: "13px 18px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--outline-variant)",
        background: "var(--surface-bright)",
        color: "var(--on-surface)",
        fontSize: ".88rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background var(--transition), border-color var(--transition)",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{loading ? "Conectando con Google…" : "Continuar con Google"}</span>
    </button>
  );
}
