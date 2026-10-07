# Mapa del sitio

Rutas de https://fullfragance.cl, para qué sirven y cómo las trata Google. Si agregas una página pública, súmala aquí, en `frontend/src/app/sitemap.ts` y con su `alternates.canonical`.

## Páginas públicas indexables

| Ruta | Contenido | Sitemap | Datos estructurados |
|------|-----------|---------|---------------------|
| `/` | Home: buscador, ofertas del día, categorías y cifras del catálogo en vivo | Sí | `Organization`, `WebSite` (todas las páginas) |
| `/dashboard` | Catálogo y comparador con filtros. Las variantes con `?q=`, `?brand=`, etc. apuntan su canónica a `/dashboard` | Sí | — |
| `/perfumes/[id]` | Ficha de un perfume con precios por tienda | Sólo si está en 2+ tiendas | `Product`, `BreadcrumbList` |
| `/guias` | Índice de guías | Sí | — |
| `/guias/[slug]` | Guía editorial con perfumes en vivo | Sí | `Article`, `BreadcrumbList` |
| `/como-comparamos` | Metodología: tiendas, agrupación, orden | Sí | — |
| `/sobre-nosotros` | Equipo, historia, financiamiento y contacto | Sí | — |
| `/politica-de-datos` | Privacidad y cookies publicitarias (AdSense) | Sí | — |
| `/politica-de-uso` | Condiciones de uso | Sí | — |

Las fichas de perfume que hoy están en una sola tienda responden con `noindex, follow`: siguen enlazadas pero no se indexan, porque no comparan nada. Un id que ya no existe responde 404.

## Páginas de cuenta (no se indexan)

Bloqueadas en `robots.txt`:

| Ruta | Contenido |
|------|-----------|
| `/login`, `/registro` | Acceso y creación de cuenta |
| `/perfil` | Datos de la cuenta y contraseña |
| `/favoritos` | Perfumes guardados |
| `/test` | Test olfativo |
| `/recomendaciones` | Recomendaciones según el test y los favoritos |

## Administración (no se indexa)

Bloqueado en `robots.txt` y protegido por rol de administrador:

| Ruta | Contenido |
|------|-----------|
| `/admin` | Resumen |
| `/admin/catalogo` | Revisión del catálogo |
| `/admin/sincronizacion` | Ejecutar la sincronización de tiendas |
| `/admin/monitoreo` | Métricas e ingresos |
| `/admin/login` | Acceso del administrador |

## Archivos generados

| Ruta | Origen |
|------|--------|
| `/sitemap.xml` | `frontend/src/app/sitemap.ts` (se regenera cada hora) |
| `/robots.txt` | `frontend/src/app/robots.ts` |
| `/opengraph-image`, `/twitter-image` | Imagen por defecto al compartir en redes |
| `/ads.txt` | `frontend/public/ads.txt` (AdSense) |
| `/google*.html` | Verificación de Search Console |

## Dominios

- `fullfragance.cl` es el dominio principal.
- `www.fullfragance.cl` redirige con 308 al principal (`frontend/next.config.ts`).
- La URL `*.vercel.app` sigue respondiendo, pero todas las canónicas apuntan a `fullfragance.cl`.
