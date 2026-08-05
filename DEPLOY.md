# Guía de Deploy — FullFragrance

**Stack de producción (100% gratuito):**
- 🎨 **Frontend** → [Vercel](https://vercel.com) (Next.js)
- ⚙️ **Backend** → [Railway](https://railway.app) (Node.js + Express)
- 🗄️ **Base de datos** → [Supabase](https://supabase.com) (PostgreSQL)
- 💰 **Monetización** → Google AdSense (se activa con Publisher ID)

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

1. En tu proyecto Supabase → **Settings** (ícono de engranaje) → **Database**
2. Baja hasta **Connection string** → selecciona la pestaña **URI**
3. Copia la URL que tiene este formato:
   ```
   postgresql://postgres:[TU-PASSWORD]@db.[REF].supabase.co:5432/postgres
   ```
   > ⚠️ Reemplaza `[TU-PASSWORD]` con la contraseña que elegiste en el paso anterior.

### 1.3 Poblar la base de datos

Desde tu terminal, en la carpeta `backend/`:

```bash
# Opción A: Usando la variable directamente
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" npm run seed:supabase

# Opción B: Creando un archivo .env temporal
echo 'DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres' > .env.supabase
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

## Paso 2 — Backend en Railway

### 2.1 Crear la cuenta y conectar el repo

1. Ve a [railway.app](https://railway.app) → **Login with GitHub**
2. Haz clic en **New Project** → **Deploy from GitHub repo**
3. Selecciona el repositorio `FullFragance`
4. Railway detecta la carpeta raíz. Como el backend está en `/backend`, haz clic en **Configure** → establece:
   - **Root Directory**: `backend`
   - **Start Command**: `npm start`

### 2.2 Configurar variables de entorno

En Railway → tu servicio → pestaña **Variables** → agrega una por una:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | URL de Supabase del Paso 1.2 |
| `JWT_SECRET` | Genera uno: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `1d` |
| `GOOGLE_CLIENT_ID` | Tu Client ID de Google Cloud Console |
| `ADMIN_EMAILS` | `fullfragance@gmail.com` |
| `FRONTEND_ORIGINS` | `https://full-fragance.vercel.app` *(actualiza después de deployar el frontend)* |
| `TRUST_PROXY` | `true` |
| `SCRAPER_MOCK_PRICES` | `false` |

> **Puedes agregar todas de una vez** copiando el contenido de `backend/.env.production.example` y usando la función **Raw Editor** de Railway.

### 2.3 Deploy y obtener URL

1. Railway hará el primer deploy automáticamente
2. Ve a **Settings** → **Networking** → **Generate Domain** para obtener tu URL pública
3. Guarda la URL: `https://tu-app.up.railway.app`
4. Prueba que funciona: `https://tu-app.up.railway.app/`
   - Debe responder: `{"name":"FullFragrance API","frontend":"..."}`

---

## Paso 3 — Frontend en Vercel

### 3.1 Conectar el repositorio

1. Ve a [vercel.com](https://vercel.com) → **Add New Project**
2. Importa el repositorio `FullFragance`
3. En la configuración del proyecto:
   - **Framework Preset**: Next.js *(se detecta automáticamente)*
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` *(default)*
   - **Output Directory**: `.next` *(default)*

### 3.2 Variables de entorno en Vercel

Antes de hacer deploy, agrega estas variables en **Environment Variables** (selecciona **Production**):

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://tu-app.up.railway.app/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Tu Client ID de Google (mismo que backend) |
| `NEXT_PUBLIC_ADSENSE_ID` | *(dejar vacío por ahora, se agrega después)* |

### 3.3 Deploy

1. Haz clic en **Deploy**
2. Espera el build (~2-3 minutos)
3. Obtendrás una URL como: `https://full-fragance.vercel.app`

### 3.4 Actualizar CORS del backend

Ahora que tienes la URL del frontend, actualiza en Railway:
- `FRONTEND_ORIGINS` = `https://full-fragance.vercel.app`

Railway redesplegará automáticamente.

---

## Paso 4 — Google OAuth (Actualizar dominios)

1. Ve a [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Haz clic en tu cliente OAuth 2.0
3. En **Authorized JavaScript origins** agrega:
   ```
   https://full-fragance.vercel.app
   ```
4. En **Authorized redirect URIs** (si usas Google Sign-In popup, no es necesario)
5. Guarda los cambios

> ⏱️ Los cambios de Google Cloud Console pueden tardar hasta 5 minutos en propagarse.

---

## Paso 5 — Google AdSense

### 5.1 Solicitar la cuenta AdSense

1. Ve a [adsense.google.com](https://adsense.google.com)
2. Crea tu cuenta y agrega tu sitio: `https://full-fragance.vercel.app`
3. Google te pedirá que agregues un snippet de verificación al `<head>` de tu sitio
   - El componente `GoogleAdsense` ya está integrado en el `layout.tsx`
   - Solo necesitas configurar `NEXT_PUBLIC_ADSENSE_ID` con tu Publisher ID

### 5.2 Activar los anuncios (después de aprobación, 1-3 días)

Una vez aprobado, en Vercel → **Settings** → **Environment Variables**:

1. `NEXT_PUBLIC_ADSENSE_ID` = `ca-pub-XXXXXXXXXXXXXXXX`
2. En AdSense → **Anuncios** → **Por bloque de anuncios** → crea 3 bloques:
   - **Sidebar izquierdo** (Vertical) → copia el Slot ID
   - **Sidebar derecho** (Vertical) → copia el Slot ID
   - **Banner Home** (Horizontal) → copia el Slot ID
3. Agrega los Slot IDs en Vercel:
   - `NEXT_PUBLIC_AD_SLOT_SIDEBAR_LEFT` = `XXXXXXXXXX`
   - `NEXT_PUBLIC_AD_SLOT_SIDEBAR_RIGHT` = `XXXXXXXXXX`
   - `NEXT_PUBLIC_AD_SLOT_HOME_STRIP` = `XXXXXXXXXX`
4. Redeploy: Vercel → **Deployments** → **Redeploy**

Los anuncios de AdSense reemplazarán automáticamente los anuncios demo del catálogo.

---

## Verificación final

Prueba estas URLs para confirmar que todo funciona:

```bash
# Backend responde
curl https://tu-app.up.railway.app/

# API de catálogo disponible
curl https://tu-app.up.railway.app/api/catalog/notes

# Frontend carga
# Abre en el navegador: https://full-fragance.vercel.app

# Flujo completo
# 1. Registrar cuenta nueva
# 2. Iniciar sesión
# 3. Seleccionar ciudad
# 4. Ver catálogo de perfumes
# 5. Hacer el test olfativo
# 6. Ver recomendaciones
# 7. Agregar favoritos
# 8. Ver mapa de tiendas
```

---

## Troubleshooting

### ❌ "CORS policy" en el frontend
- Verifica que `FRONTEND_ORIGINS` en Railway sea la URL exacta de Vercel (sin `/` al final)
- Verifica que `NEXT_PUBLIC_API_URL` en Vercel termine en `/api`

### ❌ "No se pudo conectar con el servidor"
- Revisa que el backend de Railway esté corriendo (no en sleep)
- Railway plan gratuito: 500h/mes — puede estar pausado

### ❌ Google OAuth no funciona
- Verifica que la URL de Vercel esté en **Authorized JavaScript origins** de Google Cloud
- Espera 5 minutos después de guardar los cambios

### ❌ AdSense no muestra anuncios reales
- Verifica que `NEXT_PUBLIC_ADSENSE_ID` tenga el formato `ca-pub-XXXXXXXXXXXXXXXX`
- El sitio debe estar aprobado por Google (1-3 días hábiles)
- Durante la revisión, los anuncios demo del sitio seguirán apareciendo normalmente

### ❌ Error de JWT en producción
- Verifica que `JWT_SECRET` tenga al menos 32 caracteres
- El backend lanza error si `JWT_SECRET` es débil en `NODE_ENV=production`

---

## Costos y límites gratuitos

| Servicio | Plan | Límite |
|----------|------|--------|
| **Vercel** | Hobby (gratis) | 100GB ancho de banda/mes, builds ilimitados |
| **Railway** | Trial (gratis) | $5 de crédito/mes (~500h de servidor) |
| **Supabase** | Free | 500MB storage, 2 proyectos, 50MB transferencia/mes |
| **Google Cloud** | Gratis | OAuth gratis para uso normal |
| **Google AdSense** | Gratis | Tú recibes pagos por impresiones |

> 💡 **Tip**: Si el tráfico crece y Railway queda corto, considera **Render** (gratis con sleep de 15min) o el plan de $5/mes de Railway que incluye $5 de crédito y sin límite de horas.
