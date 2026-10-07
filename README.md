# FullFragance

Comparador de precios de perfumes originales en Chile. Reúne el mismo perfume publicado por distintas tiendas, lo ordena de más barato a más caro y enlaza a la página de cada tienda para comprar allí.

- Sitio: https://fullfragance.cl
- Creado por Benjamín Cantero y Juan Pablo Valdebenito (Temuco, desde julio de 2026).

## Qué hace

- **Catálogo y comparador** (`/dashboard`): búsqueda con corrección de tipeo, filtros por marca, género, segmento (diseñador, nicho, árabe), tienda, precio y presentación.
- **Ficha de perfume** (`/perfumes/[id]`): precios por tienda (con stock primero), datos del perfume y enlace directo a cada tienda. Las fichas de una sola tienda llevan `noindex`.
- **Guías** (`/guias`): artículos propios con filas de perfumes cargadas en vivo desde el catálogo. Se agregan en `frontend/src/features/guides/guides.ts`.
- **Páginas institucionales**: `/sobre-nosotros`, `/como-comparamos`, `/politica-de-datos`, `/politica-de-uso`.
- **Cuentas** (opcionales): registro, login con Google, favoritos, test olfativo y recomendaciones.
- **Panel de administración** (`/admin`): sincronización de tiendas, revisión del catálogo y métricas.

El mapa completo de rutas, con qué se indexa y qué no, está en [docs/MAPA-DEL-SITIO.md](docs/MAPA-DEL-SITIO.md).

## Cómo se obtienen los precios

El backend tiene un scraper por tienda (`backend/src/services/*Scraper.js`) que lee las páginas públicas de perfumería. Hoy se ejecuta **una vez al día** desde el panel de administración (`/admin/sincronizacion`). También existe un scheduler (`node-cron`) que se activa con `SCRAPER_CRON_ENABLED=true`, pero en el plan gratuito de Render el servicio se duerme y no es confiable.

Después de cada sincronización, `catalogRepository.mergeScrapedProducts` agrupa las publicaciones que son el mismo perfume:

- Normaliza la marca: decodifica entidades HTML, descarta textos que no son marcas ("Despacho Gratis RM", "Tester"…) y unifica variantes mal escritas (`BRAND_ALIASES` en `productMatcher.js`).
- Sólo agrupa productos con la misma marca, volumen, concentración, presentación (set, tester, recarga) y modificadores (Intense, Elixir…).
- Descarta una oferta que cuesta menos del 35 % de la mediana de las otras tiendas (errores de publicación).

No se generan datos: no hay historial de precios simulado, ni descripciones o notas olfativas de plantilla en la ficha. Las notas deducidas del nombre (`notesInferred`) sólo se usan internamente para las recomendaciones.

## Estructura

```text
backend/                 API Node.js + Express
├── src/controllers/     Controladores HTTP
├── src/models/          Catálogo, búsqueda, matching, precios, usuarios
├── src/services/        Scrapers por tienda y jobs de sincronización
├── src/routes/          Rutas /api/*
└── test/                Pruebas (node --test)

frontend/                Next.js 16 (App Router) + React 19 + TypeScript
├── src/app/             Rutas, metadata, sitemap, robots, imagen para redes
├── src/features/        Módulos: admin, auth, catalog, guides, olfactory-test, profile
└── src/shared/          API, componentes, navegación, búsqueda, tema, analítica

docs/                    Documentación adicional
```

## Desarrollo local

Requisitos: Node.js 20+ y una base PostgreSQL (o el Session pooler de Supabase).

```bash
# Backend (puerto 3000)
cd backend
cp .env.example .env        # completar DATABASE_URL y JWT_SECRET
npm install
npm run dev

# Frontend (puerto 3001)
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Para ver datos reales sin base local, el frontend puede usar la API de producción mediante el proxy de desarrollo: en `frontend/.env.local` define `NEXT_PUBLIC_API_URL=/api-proxy` y `DEV_API_PROXY_TARGET=<URL del backend en Render>` (sin `/api`). La ruta `src/app/api-proxy` responde 404 si esa variable no existe.

### Pruebas y verificación

```bash
cd backend && npm test
cd frontend && npm run lint && npm run build
```

## Configuración

Variables principales del backend (ver `backend/.env.example`):

| Variable | Uso |
|----------|-----|
| `DATABASE_URL` | Conexión PostgreSQL (Supabase, Session pooler) |
| `JWT_SECRET` | Obligatorio en producción, 32+ caracteres |
| `ADMIN_EMAILS` | Correos con rol de administrador |
| `FRONTEND_ORIGINS` | Orígenes permitidos por CORS |
| `GOOGLE_CLIENT_ID` | Login con Google |
| `SCRAPER_CRON_ENABLED` | Scheduler interno (por defecto desactivado) |

Variables del frontend (ver `frontend/.env.example`): `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_ADSENSE_ID` y los `NEXT_PUBLIC_AD_SLOT_*`.

## Documentación de la API

Fuera de producción, el backend expone Swagger en `http://localhost:3000/api/docs` y la especificación en `http://localhost:3000/api/openapi.json`. Endpoints públicos útiles:

- `GET /api/catalog/search`: búsqueda paginada con filtros.
- `GET /api/catalog/stats`: perfumes, comparables y tiendas del catálogo vigente.
- `GET /api/catalog/ids?minStores=2`: ids para el sitemap.
- `GET /api/prices/:productId`: precios de un perfume.

## Despliegue

Frontend en Vercel, backend en Render y base de datos en Supabase. Paso a paso en [DEPLOY.md](DEPLOY.md).
