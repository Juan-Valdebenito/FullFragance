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

## Resumen del avance

FullFragrance ya cuenta con una base funcional sólida. El sistema permite registrar usuarios, iniciar sesión, realizar un test olfativo, recibir recomendaciones personalizadas, explorar un catálogo de perfumes, gestionar favoritos, consultar tiendas físicas cercanas y comparar precios entre distintas tiendas.

La principal funcionalidad pendiente para convertir el proyecto en una plataforma comercial es reemplazar los precios simulados por precios reales obtenidos desde tiendas externas, ya sea mediante scraping, APIs o acuerdos con comercios. También será necesario enlazar cada botón directamente al producto correspondiente dentro de cada tienda.
