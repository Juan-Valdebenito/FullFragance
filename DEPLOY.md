# Guía de despliegue — FullFragance

**Stack de producción:**
- **Frontend** → [Vercel](https://vercel.com) (Next.js), dominio `fullfragance.cl`
- **Backend** → [Render](https://render.com) (Node.js + Express), plan gratuito
- **Base de datos** → [Supabase](https://supabase.com) (PostgreSQL)
- **Monetización** → Google AdSense

---

## Paso 1 — Supabase (Base de datos PostgreSQL)

### 1.1 Crear el proyecto

1. Ve a [supabase.com](https://supabase.com) → **Start your project** → Inicia sesión con GitHub
2. Haz clic en **New project**
3. Completa:
   - **Name**: `fullfragance`
   - **Database Password**: Elige una contraseña fuerte y **guárdala**
   - **Region**: South America (São Paulo) — más cercano a Chile
4. Espera ~2 minutos mientras se crea el proyecto

### 1.2 Obtener la URL de conexión

1. En tu proyecto Supabase, abre **Connect**.
2. Copia la URL de **Session pooler** (puerto `5432`), no la de **Direct connection**.
3. Copia la URL que tiene este formato:
   ```
   postgresql://postgres.[REF]:[TU-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   > ⚠️ Reemplaza `[TU-PASSWORD]` con la contraseña que elegiste en el paso anterior. Conserva `postgres.[REF]` como usuario: el pooler lo requiere.

   > El host directo `db.[REF].supabase.co` normalmente solo expone IPv6. En una red sin salida IPv6 el backend termina antes del healthcheck con `connect ENETUNREACH`. El Session pooler usa IPv4.

### 1.3 Poblar la base de datos

Desde tu terminal, en la carpeta `backend/`:

```bash
# Opción A: Usando la variable directamente
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres" npm run seed:supabase

# Opción B: Creando un archivo .env temporal
echo 'DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres' > .env.supabase
cp .env.supabase .env   # sobreescribe temporalmente
npm run seed:supabase
```

Deberías ver algo así:
```
✅ Seed completado en Supabase:
   📝 Notas olfativas:    22
   🧴 Productos base:     XX
   🏪 Cadenas:            X
   👤 Usuarios:           X
   💰 Productos scraping: XX
```

> **Nota:** El script usa `IF NOT EXISTS` — es idempotente, puedes ejecutarlo múltiples veces sin duplicar datos.

---

## Paso 2 — Backend en Render

### 2.1 Crear el servicio

1. En [render.com](https://render.com) → **New** → **Web Service** → conecta el repositorio `FullFragance`.
2. Configura:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/`
3. Render asigna una URL del tipo `https://<servicio>.onrender.com`. Pruébala: debe responder `{"name":"FullFragance API",...}`.

### 2.2 Variables de entorno

En el servicio → **Environment**:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL del Session pooler de Supabase (Paso 1.2) |
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `1d` |
| `GOOGLE_CLIENT_ID` | Client ID de Google Cloud Console |
| `ADMIN_EMAILS` | Correos de administradores, separados por coma |
| `FRONTEND_ORIGINS` | `https://fullfragance.cl,https://www.fullfragance.cl` |
| `TRUST_PROXY` | `true` |
| `SCRAPER_MOCK_PRICES` | `false` |

`backend/.env.production.example` tiene la lista completa.

### 2.3 Sincronización de precios

En el plan gratuito, Render duerme el servicio tras unos minutos sin tráfico, así que un cron interno no es confiable. Hoy la sincronización se ejecuta **una vez al día** a mano desde `https://fullfragance.cl/admin/sincronizacion`.

Si el servicio pasa a un plan sin suspensión, se puede activar el scheduler interno con `SCRAPER_CRON_ENABLED=true` y `SCRAPER_CRON_SCHEDULE` (cron estándar, zona `America/Santiago`). Si cambia la frecuencia, actualiza también los textos de `/sobre-nosotros` y `/como-comparamos`, que dicen "una vez al día".

### 2.4 Orden de despliegue

Cuando un cambio toca backend y frontend, despliega primero el backend: el frontend depende de endpoints como `/catalog/stats` y `/catalog/ids?minStores=2`.

---

## Paso 3 — Frontend en Vercel

### 3.1 Conectar el repositorio

1. En [vercel.com](https://vercel.com) → **Add New Project** → importa `FullFragance`.
2. **Root Directory**: `frontend`. El resto lo detecta Vercel (Next.js).

### 3.2 Variables de entorno

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://<servicio>.onrender.com/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | El mismo Client ID del backend |
| `NEXT_PUBLIC_ADSENSE_ID` | `ca-pub-7282812991745486` |
| `NEXT_PUBLIC_AD_SLOT_HOME_STRIP` | Slot del banner horizontal del footer |
| `NEXT_PUBLIC_AD_SLOT_PRODUCT_STRIP` | Slot del banner de la ficha de perfume |
| `NEXT_PUBLIC_AD_SLOT_SIDEBAR_LEFT` / `_RIGHT` | Slots verticales de las barras laterales |

No definas `DEV_API_PROXY_TARGET` en Vercel: es sólo para desarrollo local.

### 3.3 Dominio

1. **Settings → Domains**: agrega `fullfragance.cl` y `www.fullfragance.cl`.
2. En NIC Chile, apunta los DNS según indique Vercel.
3. El código ya redirige `www` al dominio principal (`next.config.ts`); también puedes marcarlo en Vercel como redirección.

---

## Paso 4 — Google OAuth

En [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials** → tu cliente OAuth 2.0 → **Authorized JavaScript origins**, agrega `https://fullfragance.cl` y `https://www.fullfragance.cl`. Los cambios tardan hasta 5 minutos.

---

## Paso 5 — Search Console y AdSense

- **Search Console**: la propiedad se verifica con los archivos `frontend/public/google*.html`. Envía `https://fullfragance.cl/sitemap.xml` y vuelve a enviarlo cuando cambien las páginas públicas.
- **AdSense**: `frontend/public/ads.txt` declara el Publisher ID. El script se carga sólo si existe `NEXT_PUBLIC_ADSENSE_ID`. Mientras el sitio no esté aprobado, los bloques quedan vacíos y se ocultan solos.
- Antes de pedir una revisión de AdSense, revisa [docs/MAPA-DEL-SITIO.md](docs/MAPA-DEL-SITIO.md): las páginas indexables deben tener contenido propio y canónica correcta.

---

## Verificación después de desplegar

```bash
# Backend
curl https://<servicio>.onrender.com/
curl https://<servicio>.onrender.com/api/catalog/stats

# Frontend
curl -sI https://www.fullfragance.cl | grep -i location     # debe redirigir al dominio principal
curl -s https://fullfragance.cl/robots.txt
curl -s https://fullfragance.cl/sitemap.xml | grep -c "<loc>"
```

En el navegador: busca un perfume, abre su ficha, revisa que los enlaces a tiendas funcionen y lee una guía.

---

## Problemas frecuentes

### "No se pudo conectar con el servidor"
- El backend de Render puede estar despertando (la primera petición tarda hasta un minuto).
- Revisa que `NEXT_PUBLIC_API_URL` termine en `/api`.

### Error de CORS
- `FRONTEND_ORIGINS` debe contener el origen exacto, sin `/` al final.
- En desarrollo local usa el proxy (`NEXT_PUBLIC_API_URL=/api-proxy` y `DEV_API_PROXY_TARGET`) en vez de llamar a Render directo.

### Google OAuth no funciona
- El dominio debe estar en **Authorized JavaScript origins**.

### Error de JWT en producción
- `JWT_SECRET` debe tener al menos 32 caracteres; el backend no parte si es débil.

---

## Costos y límites gratuitos

| Servicio | Plan | Límite relevante |
|----------|------|------------------|
| Vercel | Hobby | 100 GB de ancho de banda al mes |
| Render | Free | El servicio se duerme sin tráfico; arranque en frío de hasta un minuto |
| Supabase | Free | 500 MB de base de datos |
| NIC Chile | Pago anual | Renovación del dominio `fullfragance.cl` |
