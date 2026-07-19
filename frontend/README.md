# FullFragrance Frontend

Aplicación web modular construida con Next.js, React y TypeScript.

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3001`. El backend debe estar iniciado en `http://localhost:3000`.

## Rutas

- `/`: redirección al inicio de sesión.
- `/login`: inicio de sesión.
- `/registro`: creación de una cuenta nueva.
- `/dashboard`: comparación de precios y búsqueda.
- `/test`: test olfativo interactivo.
- `/recomendaciones`: resultados personalizados.
- `/favoritos`: perfumes guardados por el usuario.
- `/perfil`: cuenta y selección de ciudad.
- `/perfumes/[id]`: ficha y comparación de precios de un perfume.

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

## Conexión con el backend

Copia `.env.example` como `.env.local` si necesitas cambiar la URL de la API. Por defecto se usa `http://localhost:3000/api`. La sesión JWT se conserva en el navegador y se envía como `Bearer token` a las rutas protegidas.

## Comandos

```bash
npm run lint
npm run build
npm run start
```
