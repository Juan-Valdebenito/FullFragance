"use client";

import { useEffect, useRef, useState } from "react";
import { Theme, useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { id: Theme; label: string; icon: string; title: string }[] = [
    { id: "light", label: "Claro", icon: "☀️", title: "Tema claro clásico" },
    { id: "dark", label: "Oscuro Cálido", icon: "🌙", title: "Cálido tono café y dorado" },
    { id: "pitch-black", label: "Negro Noche", icon: "🌑", title: "Negro absoluto OLED" },
  ];

  const currentOption = options.find((o) => o.id === theme) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Cambiar tema de color"
        title="Cambiar tema de color"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 12px",
          borderRadius: "99px",
          border: "1px solid var(--outline-variant)",
          background: "var(--surface-bright)",
          color: "var(--on-surface)",
          fontSize: ".75rem",
          fontWeight: 600,
          cursor: "pointer",
          transition: "border-color .2s, background .2s",
        }}
      >
        <span>{currentOption.icon}</span>
        <span style={{ fontSize: ".72rem" }}>{currentOption.label}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 50,
            minWidth: "160px",
            padding: "6px",
            borderRadius: "12px",
            border: "1px solid var(--outline-variant)",
            background: "var(--surface-bright)",
            boxShadow: "var(--shadow-md)",
            display: "grid",
            gap: "2px",
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.id === theme;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
                title={opt.title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: "none",
                  background: isSelected ? "var(--gold-light)" : "transparent",
                  color: isSelected ? "var(--gold-dark)" : "var(--on-surface)",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: ".78rem",
                  textAlign: "left",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <span>{opt.icon}</span>
                <span style={{ flex: 1 }}>{opt.label}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
