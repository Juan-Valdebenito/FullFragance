# Estado actual del proyecto FullFragrance

FullFragrance es una aplicación web modular orientada al descubrimiento de perfumes, la comparación de precios por ciudad y la generación de recomendaciones personalizadas según los gustos de cada usuario.

Actualmente, el proyecto cuenta con las siguientes funcionalidades:

## Autenticación y gestión de usuarios

* Registro de usuarios mediante la ruta `/registro`.
* Inicio de sesión funcional en `/login`.
* Contraseñas protegidas con `bcrypt`.
* Autenticación mediante JWT.
* Sesión persistente.
* Protección de rutas privadas.
* Cierre de sesión.
* Perfil de usuario disponible en `/perfil`.
* Selección y almacenamiento de la ciudad del usuario.
* Estadísticas relacionadas con favoritos y notas olfativas calificadas.

## Catálogo de perfumes

* Catálogo disponible en `/dashboard`.
* Búsqueda por nombre, marca o categoría.
* Filtros combinables por:

  * Marca.
  * Categoría olfativa.
  * Género.
* Contador de filtros activos.
* Opción para limpiar todos los filtros.
* Actualización del catálogo según la ciudad seleccionada por el usuario.

Actualmente, los perfumes provienen del catálogo interno del backend y los precios se generan mediante datos estáticos y simulados.

## Comparador de precios

El comparador de precios ya se encuentra operativo y permite:

* Comparar el precio de un perfume entre distintas tiendas.
* Mostrar la disponibilidad del producto.
* Ordenar los precios de menor a mayor.
* Identificar automáticamente la tienda con el mejor precio.
* Mostrar las tiendas disponibles según la ciudad del usuario.
* Actualizar las referencias de precios según la zona seleccionada.

Por el momento, los precios son simulados de manera determinista y todavía no provienen de scraping ni de APIs comerciales reales.

## Ficha individual del perfume

Cada perfume cuenta con una página propia mediante la ruta dinámica:

`/perfumes/[id]`

La ficha incluye:

* Imagen del perfume.
* Marca y nombre.
* Tamaño o presentación.
* Género.
* Categoría olfativa.
* Notas olfativas.
* Descripción general.
* Mejor precio disponible.
* Tabla de precios por tienda.
* Disponibilidad en cada tienda.
* Botón “Ver en tienda”.
* Gestión de favoritos.
* Navegación de regreso al catálogo.

Actualmente, los botones y banners redirigen al sitio web general de la tienda y todavía no al enlace específico del perfume.

## Test olfativo

El test olfativo se encuentra disponible en `/test` y está completamente operativo.

Incluye:

* Las 22 notas olfativas registradas en el backend.
* Organización en cuatro etapas.
* Sistema de evaluación de 1 a 5 estrellas.
* Clasificación por familias olfativas.
* Descripción de cada nota.
* Indicador de progreso.
* Conservación de respuestas anteriores.
* Posibilidad de volver atrás y modificar preferencias.
* Almacenamiento de resultados en la cuenta del usuario.

Al finalizar el test, el usuario es redirigido automáticamente a la sección de recomendaciones.

## Recomendaciones personalizadas

Las recomendaciones están disponibles en `/recomendaciones`.

El sistema:

* Analiza las puntuaciones del test olfativo.
* Considera las notas preferidas por el usuario.
* Incorpora afinidad con perfumes agregados a favoritos.
* Muestra perfumes recomendados junto con el porcentaje o nivel de coincidencia.
* Explica las razones de cada recomendación.
* Recalcula los resultados cuando el usuario vuelve a completar el test.

## Gestión de favoritos

La sección de favoritos está disponible en `/favoritos`.

Permite:

* Agregar o eliminar perfumes desde el catálogo.
* Agregar o eliminar perfumes desde la ficha individual.
* Guardar los favoritos en el backend.
* Sincronizar los favoritos con la sesión del usuario.
* Mostrar precios ajustados a la ciudad seleccionada.
* Mostrar un estado vacío en cuentas nuevas.

## Mapa de tiendas físicas

FullFragrance incluye un mapa geográfico funcional desarrollado con Leaflet y OpenStreetMap.

El mapa permite:

* Visualizar calles y ubicaciones reales.
* Hacer zoom y desplazarse.
* Mostrar tiendas físicas mediante marcadores.
* Consultar sucursales reales cercanas.
* Ordenar las tiendas por distancia.
* Mostrar un máximo de 30 tiendas.
* Abrir indicaciones hacia una sucursal.
* Mostrar nombre, dirección, sitio web, teléfono y horarios cuando están disponibles.

Las tiendas son obtenidas automáticamente mediante consultas a Overpass API. Además, el sistema utiliza caché de seis horas y redundancia entre proveedores para mejorar la estabilidad.

## Tecnologías utilizadas

### Frontend

* Next.js 16.
* React 19.
* TypeScript.
* Diseño responsive para escritorio y dispositivos móviles.
* Leaflet.
* OpenStreetMap.

### Backend

* Node.js.
* Express.
* JWT para autenticación.
* `bcrypt` para protección de contraseñas.
* Persistencia local mediante archivos JSON.
* Overpass API para obtener tiendas físicas reales.
* Swagger UI disponible en `http://localhost:3000/api/docs`.

## Arquitectura del proyecto

El frontend utiliza una estructura basada en funcionalidades, conocida como arquitectura `feature-first`.

```text
src/
├── app/                 
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── olfactory-test/
│   ├── profile/
│   └── stores/
└── shared/
    ├── api/
    ├── auth/
    └── components/
```

La arquitectura separa claramente:

* Modelos del dominio.
* Fuentes de datos.
* Componentes visuales.
* Cliente HTTP.
* Estado compartido de sesión.
* Tokens globales de diseño.

## Puesta en marcha: PostgreSQL y Google Sign-In

### 1. Preparar PostgreSQL sin perder datos

La aplicación conserva los archivos legados como fuente de respaldo durante la migración. No elimines `backend/src/data/db.json` ni `backend/data/catalog.sqlite` hasta completar la verificación posterior.

1. Crea una base de datos PostgreSQL vacía llamada `fullfragance` (o usa el nombre que prefieras).
2. Copia `backend/.env.example` a `backend/.env` y completa `DATABASE_URL` —recomendado— o las variables `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER` y `PGPASSWORD`.
3. Desde la carpeta `backend`, ejecuta la migración:

   ```bash
   npm run migrate:postgres
   ```

   El proceso crea las tablas, importa usuarios, favoritos, preferencias, notas, productos, cadenas y el catálogo scraping disponible. Es idempotente: puede ejecutarse otra vez sin borrar ni duplicar la información ya migrada.

4. Revisa los conteos que imprime el comando y valida la aplicación con una copia de seguridad de PostgreSQL antes de archivar los archivos legados. La migración también añade automáticamente la versión de sesión que permite revocar tokens al cambiar la contraseña.
5. Inicia el servidor:

   ```bash
   npm start
   ```

El servidor exige PostgreSQL al iniciar. El modo en memoria sólo está disponible si se define explícitamente `ALLOW_MEMORY_FALLBACK=true` para pruebas locales; no debe utilizarse en producción.

### 2. Activar autenticación con Google

1. En Google Cloud Console crea un cliente OAuth 2.0 de tipo **Aplicación web**.
2. Agrega los orígenes JavaScript autorizados para cada entorno, por ejemplo `http://localhost:3001` en desarrollo y el dominio HTTPS real en producción.
3. Configura el Client ID generado en ambos lados:

   ```env
   # backend/.env
   GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com

   # frontend/.env.local
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
   ```

4. Copia `frontend/.env.example` como `frontend/.env.local` si aún no existe y reinicia frontend y backend.

El backend valida la firma, la audiencia y que el correo de Google esté verificado antes de emitir el JWT de FullFragrance. No acepta correos ni perfiles enviados directamente por el navegador.

### 3. Tema visual

El selector de tema está disponible en el encabezado. Incluye los modos claro, oscuro cálido (recomendado como modo nocturno principal) y negro OLED. La preferencia se guarda localmente en el navegador.

## Rutas disponibles

```text
/
├── /login
├── /registro
├── /dashboard
├── /perfumes/[id]
├── /test
├── /recomendaciones
├── /favoritos
└── /perfil
```

## Seguridad y configuración de despliegue

En desarrollo, la configuración por defecto permite iniciar la aplicación localmente. Antes de desplegar, configura explícitamente:

```env
NODE_ENV=production
JWT_SECRET=un-secreto-unico-de-al-menos-32-caracteres
JWT_EXPIRES_IN=1d
ADMIN_EMAILS=cuenta-administradora@tu-dominio.cl
FRONTEND_ORIGINS=https://app.tu-dominio.cl
TRUST_PROXY=true
```

`JWT_SECRET` es obligatorio en producción y el backend no parte si es débil o falta. Los roles de administrador sólo se asignan a correos definidos en `ADMIN_EMAILS`; no existen credenciales administrativas por defecto.

La API limita el volumen de solicitudes, con límites más estrictos para registro e inicio de sesión. Estos límites viven en memoria y funcionan para desarrollo o una instancia. Si se despliega más de una instancia, deben trasladarse a un almacenamiento compartido como Redis.

## Documentación de la API (desarrollo)

El backend expone la interfaz Swagger sólo fuera de producción en:

`http://localhost:3000/api/docs`

La especificación OpenAPI también está disponible como JSON sólo fuera de producción en:

`http://localhost:3000/api/openapi.json`

Para probar rutas protegidas desde Swagger, inicia sesión en `/api/auth/login`, copia el token JWT de la respuesta y pégalo en el botón `Authorize` como Bearer token.

## Resumen del avance

FullFragrance ya cuenta con una base funcional sólida. El sistema permite registrar usuarios, iniciar sesión, realizar un test olfativo, recibir recomendaciones personalizadas, explorar un catálogo de perfumes, gestionar favoritos, consultar tiendas físicas cercanas y comparar precios entre distintas tiendas.

La principal funcionalidad pendiente para convertir el proyecto en una plataforma comercial es reemplazar los precios simulados por precios reales obtenidos desde tiendas externas, ya sea mediante scraping, APIs o acuerdos con comercios. También será necesario enlazar cada botón directamente al producto correspondiente dentro de cada tienda.
