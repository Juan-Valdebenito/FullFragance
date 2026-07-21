# Ferio — comparador de precios por ciudad

Prototipo funcional con backend real (Node.js + Express) y frontend estático
(HTML/CSS/JS + Leaflet) que muestra el flujo completo: registro/login → elegir
ciudad con mapa → comparar precios de productos entre tiendas de esa ciudad.

## Cómo correrlo

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Abre **http://localhost:3000** — el mismo backend sirve el frontend, así que no
hay problemas de CORS ni de puertos distintos.

## Arquitectura

```
price-compare/
├── backend/                  Node.js + Express, arquitectura en capas
│   └── src/
│       ├── server.js         Arranca el servidor HTTP
│       ├── app.js            Configura middlewares, rutas y estáticos
│       ├── config/           Variables de entorno
│       ├── routes/           Define los endpoints (capa HTTP)
│       ├── controllers/      Valida input y arma la respuesta HTTP
│       ├── models/           Repositorios y lógica de negocio
│       │   ├── userRepository.js      CRUD de usuarios
│       │   ├── catalogRepository.js   Productos y cadenas
│       │   ├── storeService.js        Genera sucursales por ciudad
│       │   └── priceService.js        Genera/compara precios
│       ├── middleware/       Auth (JWT) y manejo de errores
│       ├── utils/            JWT y utilidades geográficas
│       └── data/
│           ├── database.js   Persistencia en archivo JSON (db.json)
│           └── db.json       Se crea solo la primera vez que corres el server
│
└── frontend/                 HTML/CSS/JS plano (sin build step)
    ├── index.html
    ├── css/styles.css
    └── js/
        ├── api.js            Cliente HTTP hacia el backend
        ├── map.js             Nominatim (autocompletado) + Leaflet (mapas reales)
        ├── auth.js           Registro, login, modal de ciudad
        ├── dashboard.js      Carga tiendas/precios y los pinta
        └── main.js           Restaura la sesión al recargar la página
```

La separación **routes → controllers → models (repositories/services)** es a
propósito: si mañana cambias el archivo JSON por Postgres/MySQL, solo tocas
`models/`, nada del resto del backend se entera.

## Qué es real y qué es simulado

**Real y funcionando de punta a punta:**
- Registro y login con contraseña hasheada (bcrypt) y sesión con JWT.
- Guardado de la ciudad del usuario en el backend (persiste en `db.json`).
- Autocompletado de ciudad con datos reales de OpenStreetMap (Nominatim).
- Mapa interactivo real (Leaflet + tiles de OpenStreetMap) tanto para elegir
  la ciudad como para mostrar las sucursales en el dashboard — se puede hacer
  zoom, arrastrar y hacer clic en cada tienda para centrar el mapa en ella.
- Comparación de precios traída desde el backend vía API, con barra visual
  proporcional al precio y "sello" de mejor precio por producto.

**Simulado (a propósito, para tener algo que mostrar mientras se conecta una
fuente real):**
- Las sucursales de cada tienda se generan con coordenadas cercanas a la
  ciudad elegida (no son direcciones reales).
- Los precios se generan con un algoritmo determinista (misma ciudad +
  tienda + producto = siempre el mismo precio), no vienen de una tienda real.

El punto exacto de reemplazo cuando tengas datos reales es
`backend/src/models/storeService.js` (sucursales reales) y
`backend/src/models/priceService.js` (precios reales, por ejemplo desde un
scraper o una API de cada cadena).

## Próximos pasos sugeridos
- Reemplazar `database.js` (JSON) por una base real (Postgres/SQLite) sin
  tocar controllers ni rutas.
- Cargar sucursales y precios reales por ciudad.

## Catálogo de Falabella

El backend incorpora productos desde URLs públicas de Falabella Chile. Extrae el bloque `Product` JSON-LD de cada página y persiste SKU, marca, nombre, precio, presentación, disponibilidad, URL y fechas de observación en SQLite.

Configura las variables nuevas de `backend/.env.example`, usando un `FALABELLA_USER_AGENT` con contacto real y, en producción, un `SCRAPER_API_KEY`. La sincronización es secuencial, espera un intervalo aleatorio configurable entre solicitudes y respeta `Retry-After` ante HTTP 429. No intenta evitar CAPTCHA ni otros controles del sitio.

```http
POST /api/scrapers/falabella/sync
Authorization: Bearer <token>
X-Scraper-Key: <SCRAPER_API_KEY>  # sólo si se configuró
Content-Type: application/json

{ "productUrls": ["https://www.falabella.com/falabella-cl/product/..." ] }

GET /api/scrapers/falabella/products
Authorization: Bearer <token>
```

SQLite es apropiado para desarrollo o una sola instancia. Para producción con varios procesos, migra la tabla a PostgreSQL y ejecuta la sincronización desde un job/cola; la persistencia está centralizada en `backend/src/data/catalogDatabase.js` para facilitarlo.
- Refresh token / expiración más corta de sesión.
- Favoritos de productos y notificación de bajadas de precio.
