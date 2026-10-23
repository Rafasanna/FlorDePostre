# Administrador de Flor de Postre

Implementación en `feature/admin-neon-cloudinary`, desde `main` estable `7557dd8`. Sin push, merge, deploy ni cambios de Sheets. Se ejecutaron únicamente las operaciones de Neon de pruebas autorizadas: migración `001_admin_catalog.sql`, alta de la primera administradora e importación verificada del catálogo. El catálogo público sigue usando sus once CSV y sus reglas actuales. El cambio visual solicitado después de la primera etapa mueve el filtro Sin TACC al final, después de Bandejas.

## Etapa 2: configuración guiada de Neon de pruebas

La configuración local, la conexión, el login real y la importación del catálogo ya se completaron. Se utiliza la rama `production` del proyecto exclusivo `flor-de-postre-pruebas`, sin rama hija. Se aplicó únicamente `001_admin_catalog.sql`; las 16 tablas, 9 claves foráneas y controles quedaron verificados. Existe una administradora y Neon contiene 101 productos. Las escrituras están habilitadas solo en el entorno local autorizado. Cloudinary tiene credenciales y preset firmado validados localmente, sin una subida real de prueba. La web pública sigue en Sheets.

## Probar ahora, sin configurar servicios

Se requiere Node 22.14 o superior. Ejecutar `npm ci` para usar las versiones verificadas del lockfile; el repositorio contiene una copia histórica versionada de node_modules que no debe tomarse como autoridad. Desde la carpeta del proyecto:

```sh
npm ci
npm run dev:admin
```

Abrir `http://127.0.0.1:5173/admin` y elegir **Entrar a la demostración**. Si el puerto está ocupado, usar el que indica Vite. La demo usa ejemplos locales y precios de tamaño expresamente ficticios. Guarda los cambios solamente en ese navegador, bajo una clave distinta de las cachés públicas. Salir de la demo vuelve al login; Reiniciar borra únicamente sus ejemplos.

La demo permite productos, variantes de postres, búsqueda/filtros/orden, categorías/subcategorías, archivo/recuperación y fotos con vista previa. No es una autenticación real. Se requiere `ADMIN_DEMO_MODE=local`, `vite serve` en desarrollo y hostname loopback. Está eliminada del build de producción y prohibida en Vercel. `npm run dev` mantiene la demo apagada salvo configuración explícita.

Para probar el login real después de crear el primer usuario, usar `npm run dev` y abrir `http://127.0.0.1:5173/admin`. La capa local de Vite conecta la API con Neon usando variables privadas del servidor. Configurar `APP_ORIGIN` con ese origen exacto, `ADMIN_ENABLED=true` y `ADMIN_DEMO_MODE=off`; mantener `ADMIN_WRITES_ENABLED=false` y Sheets como fuente pública. `npm run dev:admin` abre la demostración y no sirve para probar autenticación.

Estado local autorizado el 23 de octubre de 2026: `ADMIN_WRITES_ENABLED=true` únicamente en `.env.development.local`, contra Neon de pruebas. La tienda local y pública continúa usando Sheets y `CATALOG_NEON_APPROVED=false`; habilitar el editor no cambia la fuente pública.

No sobrescribir `.env.local`: contiene las URLs públicas actuales de Sheets. Para agregar configuración local usar `.env.development.local`, sin versionarlo. `.env.example` enumera las variables sin secretos. El repositorio ya tenía `.env.local`, `dist` y `node_modules` versionados: esta rama los conserva; `.gitignore` evita nuevos archivos de ese tipo, pero no desversiona los existentes.

## Qué se construyó

- `/admin` separado del sitio público y cargado bajo demanda; identidad visual, escritorio y celular.
- Inicio con conteos reales del catálogo cargado, sin estadísticas de ventas.
- CRUD de productos con IDs permanentes, precios en centavos, estados independientes, fechas, ofertas, orden y variantes por tamaño. Archivo reversible sin borrado físico.
- Categorías con un nivel opcional de subcategorías. En la web actual la subcategoría se representa con su categoría principal.
- Editor integral de cada producto en una página propia: primero muestra nombre, descripción, categoría, precio o variantes, estados y posición; al bajar aparecen todas sus fotos. La vista previa permanece visible a la derecha en escritorio y se apila en celular. Los IDs técnicos se conservan internamente, pero no se muestran a la clienta. Las fotos múltiples admiten texto alternativo, principal, orden, reemplazo y biblioteca de fotos registradas. Quitar asociación nunca borra el asset.
- API Vercel con sesiones de 8 horas en base de datos, token aleatorio almacenado como hash, scrypt, cookies HttpOnly/SameSite=Strict y Secure/`__Host-` en producción, verificación de origen y CSRF. Logout revoca la sesión. Cuenta desactivada no puede continuar.
- Límites de login persistentes en PostgreSQL: 5 intentos por cuenta y 20 por IP cada 15 minutos, respuesta genérica y auditoría. Limpiar expirados al hacer login; no se registra contraseña, cookie, firma ni URL de conexión.
- SQL normalizado, restricciones, operaciones atómicas, revisión optimista del catálogo y registro de modificaciones. El panel real queda cerrado hasta configurar y habilitarlo; las escrituras tienen una segunda bandera.
- Subida firmada y realizada enteramente en servidor: ni API key ni API secret de Cloudinary llegan al navegador. Guarda el original y sus metadatos (`public_id`, URL, ancho, alto, bytes y formato) para permitir futuros recortes sin pérdida. JPG/PNG/WebP de hasta 2 MB, validación de cabecera binaria y límites del cuerpo antes de subir. Tanto la tienda como las vistas del administrador entregan versiones responsivas desde Cloudinary con ancho limitado, `q_auto` y `f_auto`; nunca descargan el original completo cuando existe una URL Cloudinary.
- Adaptador público Sheets/Neon, snapshots sin caché HTTP, revalidación de Neon al enfocar la pestaña y cada 30 segundos, y exclusión de cachés Sheets/fallbacks estáticos al usar Neon.

La auditoría completa de los once conjuntos de datos, sus gids y las diferencias de modelos está en [CATALOG_ANALYSIS.md](docs/admin/CATALOG_ANALYSIS.md). Arquitectura y contratos en [ARCHITECTURE.md](docs/admin/ARCHITECTURE.md). Evidencias y límites de pruebas en [VERIFICATION.md](docs/admin/VERIFICATION.md). Lista completa de archivos en [CHANGES.md](docs/admin/CHANGES.md).

## Lo que sigue simulado o pendiente

La conexión pooled, el esquema, la primera administradora y el catálogo del Neon de pruebas quedaron verificados. También se validaron por API las credenciales de Cloudinary y el preset firmado `ml_default`, sin subir archivos. Todavía no se verificaron los límites del plan Vercel. Las 25 pruebas de modelo/servidor/importación y las 13 pruebas de navegador pasan; las rutas y cookies de Vercel necesitan revisión en Preview.

Las tortas personalizadas **conservan su matriz y fórmulas actuales**. El panel permite consultarlas, sin editar sus importes genéricamente. SQL e importador respaldan tamaños, coberturas, rellenos, extras, alias y matriz versionada. Faltan decisiones comerciales para habilitar su edición: autoridad de Sheets frente a overrides, rellenos incluidos/adicionales y cómo tratar opciones retiradas que hoy reaparecen desde el respaldo local. Esos cambios deben implementarse juntos en configurador, resumen y revalidación del carrito. La API pública bloquea matrices que difieran del código vigente.

Campañas existentes se importan y se pueden asignar a productos especiales, con disponibilidad y habilitación separadas. La creación/edición de campañas, del catálogo global de tamaños y de reglas de tortas queda fuera de los formularios habilitados en esta etapa. No se inventan esos valores ni se reemplaza su funcionamiento existente.

## Tu intervención: orden exacto

1. **Crear un proyecto/branch de pruebas en Neon** y configurar su `DATABASE_URL` del lado servidor. No usar todavía la base definitiva. Elegir región próxima a las funciones Vercel y conexión pooled con TLS. Crear credenciales separadas para migrar y para la aplicación; no ponerlas en variables `VITE_` ni en Git.
2. **Configurar Cloudinary de pruebas**: cloud name, API key, API secret y un preset **signed**, exclusivamente imágenes JPG/PNG/WebP hasta 2 MB, sin sobrescribir assets. Evitar un preset que cambie la carpeta/public_id enviados por el servidor. Completar las cuatro variables `CLOUDINARY_*` del ejemplo. El servidor asigna un public_id único bajo `flor-de-postre/catalog/`. No activar borrado automático.
3. **Definir la cuenta inicial**: correo y contraseña de al menos 14 caracteres. Generar `SESSION_SECRET` aleatorio de al menos 32 caracteres (recomendado 32 bytes aleatorios en hexadecimal) y fijar `APP_ORIGIN` al origen exacto de la Preview o servidor local. No compartir ni pegar secretos en documentos, commits o mensajes.
4. **Preparar y autorizar la importación a la base de pruebas**. La migración del esquema ya está aplicada. Primero respaldo y preparación offline; luego ejecutar los comandos protegidos de abajo. Crear el usuario únicamente tras configurar sus credenciales y autorizar esa operación. El script nunca actualiza una contraseña existente ni importa sobre un catálogo poblado.
5. **Autorizar un despliegue de Preview y configurar Vercel** según el apartado siguiente. Probar login/logout, bloqueo, guardar/recuperar, subidas y concurrencia contra los servicios de pruebas. La web continúa con Sheets.
6. **Autorizar importar a la base definitiva y activar Neon**, únicamente tras comparación sin diferencias y resolución de los pendientes que afecten datos migrados. Congelar edición en Sheets durante el corte, importar respaldo final y repetir comparación.
7. **Autorizar el despliegue de producción** con la fuente y flags revisados. No se ejecuta automáticamente ningún paso de esta lista.

## Vercel y variables

Mantener proyecto Vite, Node 22.x, comando `npm run build` y salida `dist`. `api/admin.js` y `api/catalog.js` son funciones Node; `vercel.json` reserva `/api/*` y deja las rutas públicas en la SPA. No hay postinstall, build hook ni cron que ejecute migraciones.

Configurar primero **solo Preview**, con credenciales de pruebas y un `APP_ORIGIN=https://origen-exacto-de-preview` estable. No usar comodines. Replicar a Production solo con autorización.

| Variable                                                     | Inicio seguro | Etapa habilitada                          |
| ------------------------------------------------------------ | ------------- | ----------------------------------------- |
| ADMIN_ENABLED                                                | false         | true después de migrar y crear usuario    |
| ADMIN_WRITES_ENABLED                                         | false         | true tras autorizar modificaciones reales |
| DATABASE_URL                                                 | vacía         | conexión Neon exclusiva de ese entorno    |
| SESSION_SECRET                                               | vacía         | secreto aleatorio, solo servidor          |
| APP_ORIGIN                                                   | origen local  | origen HTTPS exacto del panel             |
| CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET / UPLOAD_PRESET | vacías        | valores solo servidor                     |
| VITE_CATALOG_SOURCE                                          | sheets        | neon solo al autorizar corte              |
| CATALOG_SOURCE                                               | sheets        | neon solo al autorizar corte              |
| CATALOG_NEON_APPROVED                                        | false         | true solo al autorizar corte              |
| ADMIN_DEMO_MODE                                              | off           | jamás habilitar en Vercel                 |

No configurar `ADMIN_PASSWORD`, `ADMIN_EMAIL` ni `ALLOW_DATABASE_WRITES` en Vercel; son variables temporales de la consola del operador. Las URLs `VITE_SHEET_*` existentes se conservan hasta terminar la transición. No hay doble escritura.

El selector público `VITE_CATALOG_SOURCE` es una opción no secreta compilada: cambiar de fuente requiere un deploy autorizado. Los cambios posteriores de productos **no requieren deploy**; la API consulta Neon y el cliente revalida al volver a la pestaña y en un máximo normal de 30 segundos. Una API Neon fallida vacía el catálogo en vez de volver silenciosamente a Sheets o a precios estáticos.

## Preparar respaldo e importación

Los once CSV completos, incluyendo inactivos y reservados, pueden exportarse en modo de solo lectura desde las URLs ya configuradas de Sheets:

```sh
npm run admin:export-sheets -- .local/sheets-snapshot-2026-10-22
```

También pueden exportarse manualmente. Deben guardarse fuera de Git con estos nombres exactos:

```text
menuDiario.csv              sinTacc.csv
postres.csv                 postresTamanos.csv
postresConfig.csv           campaigns.csv
specialProducts.csv         tortaTamanos.csv
tortaCoberturas.csv          tortaRellenos.csv
tortaExtras.csv
```

Preparar sin red y sin credenciales:

```sh
npm run admin:prepare-import -- /ruta/csv .local/prepared-2026-10-22
```

Crea una carpeta nueva con copia byte a byte de CSV, hashes SHA-256, manifiesto con conteos, datasets normalizados y catálogo. No sobreescribe un respaldo. Rechaza filas no válidas, IDs vacíos o repetidos dentro de un mismo origen, categorías colisionadas, relaciones sin padre, ofertas inconsistentes y precios que exijan redondeo. Si el mismo ID histórico aparece en tipos distintos, genera claves internas únicas y registra la correspondencia; la salida pública conserva el ID histórico. Las omisiones justificadas, como URLs rotas o combinaciones inactivas sin precio, quedan registradas y el CSV original permanece intacto.

Validar todo el respaldo contra PostgreSQL local en memoria antes de conectarse a Neon:

```sh
npm run admin:validate-import -- .local/prepared-sheets-2026-10-22
```

Esta prueba ejecuta la migración e importación completas, compara el modelo privado y los once datasets públicos y confirma que una segunda importación queda bloqueada. No usa red ni credenciales.

Antes de cualquier escritura hacer además respaldo de Neon con herramientas del proveedor o `pg_dump` usando la conexión autorizada, verificar que se pueda restaurar y anotar el branch exacto. Mantener copia de variables y deployment vigente de Vercel de forma privada.

## Comandos reales: ejecutar solamente con autorización

La CLI `admin:db:test` carga únicamente `.env.development.local` y solo acepta el proyecto `flor-de-postre-pruebas`, rama `production`, hostname confirmado, TLS obligatorio, administrador cerrado y Sheets activa. Nunca se debe pasar una URL de producción a estos comandos. Además, los comandos de escritura exigen dos condiciones: `ALLOW_DATABASE_WRITES=I_HAVE_APPROVAL` y `--execute`. Sin ambas terminan antes de conectarse. La migración consulta primero, en modo de solo lectura, que no haya tablas públicas y se cancela si encuentra alguna.

```sh
# La migración 001_admin_catalog.sql ya se aplicó en el Neon de pruebas.
# Después de configurar credenciales y obtener autorización para cada etapa:
ALLOW_DATABASE_WRITES=I_HAVE_APPROVAL npm run admin:db:test -- create-admin --execute
ALLOW_DATABASE_WRITES=I_HAVE_APPROVAL npm run admin:db:test -- import .local/prepared-sheets-2026-10-22 --execute
npm run admin:db:test -- compare .local/prepared-sheets-2026-10-22
```

Para `create-admin`, inyectar temporalmente `ADMIN_EMAIL` y `ADMIN_PASSWORD` por el gestor de secretos, sin escribir la contraseña en el comando/historial. Se almacena únicamente scrypt + salt. Borrar esas variables al terminar. Si ya existe el correo, falla sin sobrescribirlo.

Import exige catálogo vacío, bloquea tablas durante la transacción, registra hash del respaldo e import_run. Si una fila falla, se revierte toda la importación; no hace upsert de productos existentes. No reejecutar import sobre un catálogo en uso. `compare` es de lectura: reconstruye los CSV desde backup, verifica hashes y compara también con los normalizados originales de Sheets (respetando las opciones inactivas) y revisa todos los datasets públicos y campos privados (precios, variantes, flags, imágenes, categorías, orden y reglas), no solo conteos. Debe dar `matches: true` antes del corte. La columna source_record conserva los datos originales normalizados y sus notas.

Revisar el informe junto con menú, Sin TACC, cada postre/tamaño, campañas y ejemplos de tortas/pedidos completos. Mantener el snapshot final como evidencia, sin versionar datos de clienta.

## Activación progresiva

1. Demo local → pruebas actuales sin servicios.
2. Branch Neon de pruebas → migración y usuario → import de respaldo revisado.
3. Preview con Sheets pública → validar panel real y fotos sin cambiar la tienda.
4. Preview con Neon → comparación inicial antes de editar; luego cambios de prueba, caché, categorías, variantes y WhatsApp. Revisar autorización/origen/cookies en HTTPS.
5. Base definitiva → respaldo, pausa de edición Sheets, snapshot final y comparación. Evitar editar Neon entre comparación y corte.
6. Despliegue autorizado con las tres banderas de Neon. Sheets queda conservada como respaldo histórico, sin escrituras. Neon pasa a ser fuente única de los datasets migrados. Las fórmulas de tortas siguen siendo lógica de aplicación versionada.

## Rollback

Antes del corte: apagar `ADMIN_WRITES_ENABLED`, conservar auditoría/backups y seguir con Sheets; no hay efecto público.

Después del corte: congelar las ediciones administrativas, respaldar Neon y guardar las diferencias posteriores al snapshot. Solo con autorización, restaurar el deployment anterior o cambiar los tres selectores a Sheets y desplegar. **Sheets estará desactualizada si hubo cambios en Neon**: conciliar manualmente esos cambios con una copia revisada antes de publicar precios viejos. No escribir automáticamente a Sheets, no revertir SQL borrando productos y no eliminar imágenes. La demo no participa del rollback.

Para restauración de base usar un branch/restore del proveedor primero en pruebas. Cambiar solo la conexión tras comprobar datos e IDs. Revocar sesiones (`admin_sessions`) si se sospecha acceso indebido y rotar secretos desde el servidor; no resetear credenciales desde el frontend.

## Verificaciones reproducibles

```sh
npm test
ADMIN_DEMO_MODE=local ADMIN_BUILD_DIR=.local/production-test npm run build
npm run admin:check-build -- .local/production-test
npm run test:e2e
```

El build con `ADMIN_DEMO_MODE=local` comprueba intencionalmente que la demo se excluye igual. Las pruebas SQL usan PostgreSQL WASM en memoria (PGlite), nunca Neon. Las pruebas automatizadas de Cloudinary usan respuestas simuladas; adicionalmente se validaron credenciales y preset reales mediante consultas autenticadas de solo lectura, sin subir archivos. Las pruebas de navegador bloquean destinos externos. Por defecto E2E usa Chrome instalado en macOS; para otro entorno indicar `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` a un Chromium instalado.

Referencias técnicas: [driver Neon](https://neon.com/docs/serverless/serverless-driver), [subidas firmadas Cloudinary](https://cloudinary.com/documentation/upload_images#generating_authentication_signatures), [funciones Node en Vercel](https://vercel.com/docs/functions/runtimes/node-js).
