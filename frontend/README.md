# FullFragance — Frontend

Next.js 16 (App Router), React 19 y TypeScript.

## Desarrollo

```bash
npm install
npm run dev     # http://localhost:3001
```

Por defecto usa la API en `http://localhost:3000/api`. Para trabajar con datos de producción sin backend local, define en `.env.local`:

```env
NEXT_PUBLIC_API_URL=/api-proxy
DEV_API_PROXY_TARGET=https://<backend-en-render>   # sin /api
```

## Rutas

El listado completo, con lo que se indexa y lo que no, está en [../docs/MAPA-DEL-SITIO.md](../docs/MAPA-DEL-SITIO.md).

## Arquitectura

Organización **feature-first**:

- `src/app`: rutas, metadata, `sitemap.ts`, `robots.ts` e imagen para redes (`opengraph-image.tsx`).
- `src/features`: módulos de negocio (`admin`, `auth`, `catalog`, `guides`, `olfactory-test`, `profile`).
- `src/shared`: API, componentes compartidos, navegación, búsqueda, tema y analítica.

Los Server Components son el valor por defecto. Las páginas públicas que muestran catálogo (home, guías, fichas, "Cómo comparamos") piden los datos en el servidor y se regeneran cada hora, para que el contenido llegue en el HTML.

## SEO

- La canónica se define página por página (`alternates.canonical`); el layout no define una global.
- Los títulos llevan el sufijo `| FullFragance` desde la plantilla del layout: no repetirlo en cada página.
- El sitemap incluye páginas estáticas, guías y sólo los perfumes en 2 o más tiendas.
- Datos estructurados: `Organization` y `WebSite` en el layout, `Product` en las fichas y `Article` en las guías.

## Anuncios

`GoogleAdsense` carga el script con `NEXT_PUBLIC_ADSENSE_ID`. `AdSlot` sólo crea su `<ins>` cuando el bloque es visible, porque `adsbygoogle.push({})` llena el siguiente bloque vacío de la página. Sin AdSense configurado, `AdBanner` muestra anuncios propios de demostración.

## Comandos

```bash
npm run lint
npm run build
npm run start
```
