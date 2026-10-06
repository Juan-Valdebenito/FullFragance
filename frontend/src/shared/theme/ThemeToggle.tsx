"use client";

import { useEffect, useRef, useState } from "react";
import { Theme, useTheme } from "./ThemeContext";
import styles from "./ThemeToggle.module.css";

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
    <div ref={dropdownRef} className={styles.root}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Cambiar tema de color"
        aria-expanded={open}
        title="Cambiar tema de color"
        className={styles.trigger}
      >
        <span>{currentOption.icon}</span>
        {/* En móvil solo queda el icono: la etiqueta no cabe junto a la marca
            y el botón de menú (ver .themeToggleLabel en globals.css). */}
        <span className={`themeToggleLabel ${styles.triggerLabel}`}>
          {currentOption.label}
        </span>
      </button>

      {open && (
        <div className={styles.menu}>
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
                className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`}
              >
                <span>{opt.icon}</span>
                <span className={styles.optionLabel}>{opt.label}</span>
                {isSelected && <span>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
