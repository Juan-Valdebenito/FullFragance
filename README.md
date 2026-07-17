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
- Refresh token / expiración más corta de sesión.
- Favoritos de productos y notificación de bajadas de precio.
