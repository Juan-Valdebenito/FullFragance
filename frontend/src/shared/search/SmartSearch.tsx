"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api, productImageCandidates } from "@/shared/api/client";
import type { IntentChip, SuggestProduct, SuggestResult } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import styles from "./SmartSearch.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const MIN_CHARS = 2;
const DEBOUNCE_MS = 160;
const LONG_PLACEHOLDER = "Busca un perfume, marca o “árabe hombre bajo 30 mil”";
const SHORT_PLACEHOLDER = "Busca un perfume o una marca";

type Option =
  | { kind: "correction"; id: string; text: string }
  | { kind: "brand"; id: string; name: string; count: number }
  | { kind: "product"; id: string; product: SuggestProduct }
  | { kind: "all"; id: string };

/**
 * URL del catálogo para una búsqueda: lo que el backend entendió como
 * intención ("hombre", "nicho", "bajo 30 mil") viaja como filtros normales,
 * así se ven en el catálogo y se pueden quitar.
 */
export function catalogUrl(text: string, chips: IntentChip[] = [], extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (text) params.set("q", text);
  for (const chip of chips) params.set(chip.key, chip.value);
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  const search = params.toString();
  return search ? `/dashboard?${search}` : "/dashboard";
}

export function SmartSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  // En el catálogo la barra muestra la búsqueda activa.
  const urlQuery = pathname === "/dashboard" ? searchParams.get("q") ?? "" : "";
  const [value, setValue] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setValue(urlQuery);
  }

  const [result, setResult] = useState<SuggestResult | null>(null);
  // El ejemplo de intención no cabe en un teléfono: ahí va un texto corto.
  const [placeholder, setPlaceholder] = useState(LONG_PLACEHOLDER);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px)");
    const update = () => setPlaceholder(query.matches ? SHORT_PLACEHOLDER : LONG_PLACEHOLDER);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const trimmed = value.trim();

  // Sugerencias con espera corta; cada tecla cancela la petición anterior.
  useEffect(() => {
    if (trimmed.length < MIN_CHARS) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      api.suggest(trimmed, controller.signal)
        .then(data => { setResult(data); setActive(-1); })
        .catch(() => { /* abortada o sin conexión: se deja la última respuesta */ });
    }, DEBOUNCE_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [trimmed]);

  const fresh = result && result.query === trimmed ? result : null;
  const showPanel = open && trimmed.length >= MIN_CHARS && fresh !== null;

  const options = useMemo<Option[]>(() => {
    if (!fresh) return [];
    const list: Option[] = [];
    if (fresh.correctedQuery) list.push({ kind: "correction", id: "correction", text: fresh.correctedQuery });
    for (const brand of fresh.brands) list.push({ kind: "brand", id: `brand-${brand.name}`, ...brand });
    for (const product of fresh.products) list.push({ kind: "product", id: `product-${product.id}`, product });
    if (fresh.total > 0) list.push({ kind: "all", id: "all" });
    return list;
  }, [fresh]);

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function go(url: string) {
    close();
    inputRef.current?.blur();
    router.push(url);
  }

  function choose(option: Option | undefined) {
    if (option?.kind === "product") return go(`/perfumes/${option.product.id}`);
    // Sin sugerencias aún (Enter muy rápido) se busca el texto tal cual: el
    // catálogo igual interpreta la intención.
    if (!fresh) return go(catalogUrl(trimmed));
    if (option?.kind === "brand") return go(catalogUrl("", fresh.chips, { brand: option.name }));
    go(catalogUrl(fresh.correctedQuery ?? fresh.text, fresh.chips));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!options.length) return;
      event.preventDefault();
      setOpen(true);
      // -1 es el texto escrito: al pasar por un extremo se vuelve a él.
      const last = options.length - 1;
      setActive(current => event.key === "ArrowDown"
        ? (current >= last ? -1 : current + 1)
        : (current === -1 ? last : current - 1));
    } else if (event.key === "Escape") {
      close();
    }
  }

  const activeOption = active >= 0 && active < options.length ? options[active] : undefined;
  const optionDomId = (option: Option) => `${listId}-${option.id}`;

  return (
    <form
      className={styles.search}
      role="search"
      onSubmit={event => {
        event.preventDefault();
        choose(activeOption);
      }}
    >
      <Icon name="search" size={18} />
      <label className="srOnly" htmlFor={`${listId}-input`}>Buscar perfume, marca o tipo</label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        value={value}
        onChange={event => { setValue(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={`${listId}-list`}
        aria-autocomplete="list"
        aria-activedescendant={activeOption ? optionDomId(activeOption) : undefined}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          aria-label="Borrar búsqueda"
          onMouseDown={event => event.preventDefault()}
          onClick={() => { setValue(""); setResult(null); inputRef.current?.focus(); }}
        >
          ×
        </button>
      )}
      <button className={styles.submit} aria-label="Buscar"><Icon name="search" size={18} /></button>

      {showPanel && (
        // mousedown no quita el foco del input: así el clic llega a la opción.
        <div className={styles.panel} onMouseDown={event => event.preventDefault()}>
          {fresh.chips.length > 0 && (
            <div className={styles.intent}>
              <span>Filtraremos por</span>
              {fresh.chips.map(chip => <em key={chip.key}>{chip.label}</em>)}
            </div>
          )}

          <ul className={styles.options} role="listbox" id={`${listId}-list`} aria-label="Sugerencias">
            {options.map((option, index) => {
              const common = {
                id: optionDomId(option),
                role: "option" as const,
                "aria-selected": index === active,
                className: `${styles.option} ${index === active ? styles.optionActive : ""}`,
                onMouseEnter: () => setActive(index),
                onClick: () => choose(option),
              };
              if (option.kind === "correction") {
                return (
                  <li key={option.id} {...common}>
                    <span className={styles.correction}>¿Quisiste decir <strong>{option.text}</strong>?</span>
                  </li>
                );
              }
              if (option.kind === "brand") {
                return (
                  <li key={option.id} {...common}>
                    <span className={styles.brandIcon} aria-hidden="true">{option.name.slice(0, 1)}</span>
                    <span className={styles.optionText}>
                      <strong>{option.name}</strong>
                      <small>Marca · {option.count} {option.count === 1 ? "perfume" : "perfumes"}</small>
                    </span>
                  </li>
                );
              }
              if (option.kind === "product") {
                return (
                  <li key={option.id} {...common}>
                    <SuggestionImage product={option.product} />
                    <span className={styles.optionText}>
                      <small>{option.product.brand}</small>
                      <strong>{option.product.name}</strong>
                    </span>
                    <span className={styles.optionPrice}>
                      <strong>{money.format(option.product.minPrice)}</strong>
                      {option.product.storeCount > 1 && <small>{option.product.storeCount} tiendas</small>}
                    </span>
                  </li>
                );
              }
              return (
                <li key={option.id} {...common}>
                  <span className={styles.all}>
                    Ver los {fresh.total.toLocaleString("es-CL")} resultados
                    {fresh.text ? <> de <strong>{fresh.correctedQuery ?? fresh.text}</strong></> : null}
                  </span>
                  <Icon name="arrow" size={16} />
                </li>
              );
            })}
          </ul>

          {fresh.total === 0 && (
            <p className={styles.empty}>
              No encontramos perfumes para <strong>{trimmed}</strong>. Prueba solo con la marca o el nombre.
            </p>
          )}
        </div>
      )}
    </form>
  );
}

function SuggestionImage({ product }: { product: SuggestProduct }) {
  const [failed, setFailed] = useState<string[]>([]);
  const image = productImageCandidates(product).find(url => !failed.includes(url));
  return (
    <span className={styles.thumb} aria-hidden="true">
      {image && (
        <Image src={image} alt="" fill sizes="44px" unoptimized onError={() => setFailed(current => [...current, image])} />
      )}
    </span>
  );
}

/** Mismo aspecto sin lógica, mientras carga el componente (Suspense). */
export function SmartSearchFallback() {
  return (
    <form className={styles.search} role="search" action="/dashboard">
      <Icon name="search" size={18} />
      <input name="q" placeholder={LONG_PLACEHOLDER} aria-label="Buscar perfume, marca o tipo" />
      <button className={styles.submit} aria-label="Buscar"><Icon name="search" size={18} /></button>
    </form>
  );
}
