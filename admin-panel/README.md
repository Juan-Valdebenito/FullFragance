# admin-panel — Demo de separación del login

**Estado: prototipo local, no desplegado.** No está conectado a Vercel ni a
ningún dominio público. Solo corre en `localhost`.

## Por qué existe

El sitio público (`frontend/`) tiene la ruta `/login` accesible por cualquiera
que la escriba directamente, junto con el resto del catálogo. Esta app separa
el acceso administrativo en una aplicación aparte, sin ruta predecible en el
dominio público, para reducir que alguien la descubra por accidente o la
pruebe a propósito.

Usa el **mismo backend y la misma base de datos** que el sitio público — no
duplica nada, solo mueve dónde vive el formulario de login y el panel.

## Cómo se hizo

Se copió `frontend/` completo (para reutilizar todo el código ya probado:
cliente de API, sesión, componentes) y se eliminaron las rutas públicas que no
aplican a una herramienta interna (home, favoritos, test olfativo,
recomendaciones, registro, políticas, fichas de perfume, sitemap). Quedó una
sola ruta (`/`) que es login o panel según haya sesión, más un `robots.ts` que
bloquea cualquier rastreo por si alguna vez se despliega sin querer.

## Cómo correrlo en local

```bash
cd admin-panel
npm install
npm run dev
```

Abre `http://localhost:3002`. Por defecto (`.env.local`, no versionado) apunta
al backend real en Render/Supabase, así que el login usa las cuentas admin
reales del sitio en producción.

Si prefieres probar contra un backend corriendo en tu máquina en vez del de
producción, copia `.env.example` a `.env.local` y ajusta `NEXT_PUBLIC_API_URL`.

## Pendiente si se decide llevar esto a producción

- Desplegar en un subdominio propio (ej. `admin.fullfragance.cl`) o servicio
  aparte — nunca en el mismo dominio/proyecto de Vercel que el sitio público.
- Agregar el origen de ese subdominio a `FRONTEND_ORIGINS` en el backend
  (Render) y quitar el `http://localhost:3002` que se agregó solo para probar
  esta demo.
- Evaluar si además conviene sacar `/login` del sitio público (`frontend/`)
  una vez que este panel reemplace su función — **no se ha hecho todavía**,
  sigue igual en producción hasta que se decida.
