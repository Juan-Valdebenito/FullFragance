/**
 * Ícono del logo (public/logo.jpeg) en SVG: botella con etiqueta de precio.
 * Usa currentColor para la botella y --gold para la etiqueta, así sirve igual
 * sobre fondos claros y oscuros.
 */
export function BrandIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect x="16.5" y="3" width="11" height="7.5" rx="1.6" fill="currentColor" />
      <rect x="19" y="9.5" width="6" height="4.5" fill="currentColor" />
      <rect x="7" y="13" width="28" height="32" rx="5.5" fill="currentColor" />
      <path d="M25 11.5c6 0 9.5 3 10.5 7.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <g transform="rotate(20 37 29)">
        <path
          d="M32.5 22 37 17.5 41.5 22v13.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2Z"
          fill="var(--gold)"
          stroke="var(--surface)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="37" cy="22.4" r="1.4" fill="var(--surface)" />
        <path d="m34.6 29.6 1.8 1.8 3.4-3.7" fill="none" stroke="var(--surface)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
