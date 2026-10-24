"use client";

export function SkipToContent() {
  return (
    <a
      className="skipLink"
      href="#contenido-principal"
      onClick={() => {
        window.requestAnimationFrame(() => {
          const main = document.querySelector("main");
          if (!main) return;
          main.id = "contenido-principal";
          main.setAttribute("tabindex", "-1");
          main.focus({ preventScroll: true });
        });
      }}
    >
      Saltar al contenido principal
    </a>
  );
}
