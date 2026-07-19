# FullFragrance Frontend

Aplicación web modular construida con Next.js, React y TypeScript.

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Rutas

- `/`: registro e inicio de sesión.
- `/dashboard`: comparación de precios y búsqueda.
- `/test`: test olfativo interactivo.
- `/recomendaciones`: resultados personalizados.

## Arquitectura

El proyecto usa una organización **feature-first**:

- `src/app`: composición de páginas, rutas y metadata de Next.js.
- `src/features`: módulos de negocio independientes (`auth`, `catalog`, `olfactory-test`).
- `src/shared`: componentes visuales compartidos por varias funcionalidades.

Dentro de cada funcionalidad se separan:

- `domain`: tipos y reglas del dominio.
- `data`: fuentes de datos reemplazables por una API o repositorio.
- `components`: presentación e interacción.

Los Server Components son el valor por defecto. Solo los componentes con estado o eventos (`AuthPanel`, `CatalogExplorer` y `OlfactoryQuiz`) usan `"use client"`.

## Comandos

```bash
npm run lint
npm run build
npm run start
```
