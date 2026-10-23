# Verificación de esta etapa

Fecha: 2026-10-22. Rama: `feature/admin-neon-cloudinary`, base estable `7557dd8`. El estado inicial de Git estaba limpio y main coincidía con origin/main local. No se hizo fetch para cambiar esa referencia ni se alteró main.

## Resultados

| Verificación                    | Resultado                               | Alcance                                                                                                                        |
| ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Build inicial de main           | Correcto                                | Vite 7.3.3, antes de cambios                                                                                                   |
| `npm test`                      | 25/25 correctas                         | Contrato, lógica comercial, demo, SQL, API, autenticación e importación                                                        |
| `npm run test:e2e`              | 13/13 correctas                         | Chrome local, puertos 4190–4192, sin destinos externos                                                                         |
| `npm run build` final           | Correcto                                | Vite; administrador en chunk separado                                                                                          |
| Build con ADMIN_DEMO_MODE=local | Correcto, demo excluida                 | Código de entrada a demo eliminado incluso intentando habilitarla al compilar                                                  |
| `admin:check-build`             | Correcto                                | Sin conexión PostgreSQL, API secret, session secret, hashes de contraseñas, driver Neon ni entrada demo en assets de navegador |
| Revisión de dependencias        | 0 alertas tras correcciones compatibles | `npm audit fix --ignore-scripts`, sin actualizaciones forzadas de major                                                        |
| Visual QA                       | Correcto                                | Inicio/listado/editor a 320, 390, 768 y 1440 px, login de producción; sin desbordamiento horizontal                            |

Las pruebas usaron la instalación resuelta por package-lock.json. El repositorio original versiona node_modules y dist: sus archivos generados se restauraron al terminar para mantener el cambio de código revisable. **Ejecutar `npm ci` antes de reproducir pruebas o iniciar el proyecto**, para usar las versiones corregidas del lockfile; no usar la copia histórica versionada como autoridad de dependencias. Los nuevos paquetes instalados están ignorados y se regeneran con npm ci.

## Qué se verificó en modelo/servidor

- Productos de precio fijo y postres con variantes; precios positivos enteros en centavos; importes con más de dos decimales rechazados, sin redondeo silencioso.
- Claves internas únicas, incluso cuando dos tipos conservan el mismo ID público histórico; IDs y tipo inmutables; ID sintético de tortas reservado.
- Categorías/subcategorías sin ciclos, tercer nivel ni nombres duplicados dentro del mismo padre.
- Estados activo/inactivo, destacado, reservado, archivo y recuperación; ofertas y rangos de fechas.
- Matriz vigente de tortas, precios por cobertura/tamaño, overrides de extras, adicional de rellenos y +25% con redondeo al peso.
- SQL PostgreSQL completo en PGlite en memoria; migración repetible, claves/relaciones, revisión optimista y rollback al fallar una variante duplicada.
- Sesiones obligatorias en rutas privadas, tokens almacenados como hash, cookie segura, CSRF/origen, modo solo lectura, limitación persistente de login y revocación en logout.
- Falla cerrada sin configuración: ni siquiera solicita la conexión. ADMIN_DEMO_MODE no abre operaciones reales en producción.
- Validación de formato/tamaño binario de imagen, firma y almacenamiento de metadatos usando fetch simulado. Ninguna subida real.
- Importación completa de fixture de once CSV en DB local, reconstrucción pública y comparación privada sin diferencias; comparación adicional contra los normalizadores originales de Sheets, opciones inactivas conservadas en DB y excluidas de la lectura pública, cambios de un centavo detectados; reimportación sobre catálogo poblado bloqueada y atómica.
- CLI offline crea copias idénticas y manifiesto SHA-256. Las CLI de escritura sin autorización explícita terminan antes de conectarse.
- API pública habilitada artificialmente solo contra DB en memoria: conserva precios/IDs; bloquea reglas de tortas divergentes y no expone tablas privadas.

## Qué se verificó en navegador

- Crear, abrir en página completa, previsualizar, guardar, buscar, desactivar, archivar y recuperar productos de demo; persistencia separada al recargar. El flujo recorre información y fotos verticalmente, mantiene la vista previa lateral en escritorio y no muestra IDs técnicos.
- Abrir un producto o cambiar de sección desde una posición desplazada lleva siempre al comienzo del contenido. Los selectores mantienen su flecha separada del borde en escritorio y celular.
- Las filas de producto y las tarjetas de resumen cambian de fondo de forma breve al recibir el puntero; la navegación por teclado conserva un estado equivalente.
- El editor no muestra stock ni IDs técnicos. Los valores históricos de stock permanecen en el modelo para compatibilidad, pero no se modifican desde el formulario.
- Errores de precio negativo, más de dos decimales, IDs duplicados y postres activos sin variantes.
- Fotos seleccionadas desde archivo, vista previa, principal, reordenado, reemplazo, texto alternativo, desvinculación y guardado. Las URLs Cloudinary de la tienda y del administrador usan tamaños responsivos, ancho limitado, calidad automática y formato automático; los originales se preservan.
- Crear subcategoría y usar el panel sin desbordamientos a tres anchos.
- Build de producción con login cerrado, sin botón de demostración.
- La web pública no descarga el chunk del administrador.
- Comparación con una copia de la versión estable generada por lectura de Git, sin checkout de main: mismo texto en inicio, postres, tortas, cómo pedir y pedido; mismas opciones iniciales de tortas, mismo carrito y enlace WhatsApp para un producto diario. No se envió ningún WhatsApp.
- CSS público compilado mantuvo el mismo hash `index-MoQ9hPAJ.css`; estilos públicos no modificados.

El navegador integrado no pudo inicializarse por falta de conexión confiable en el entorno. Se usó Chrome local mediante Playwright como alternativa. Las capturas de evidencia están en `review/admin/`. Tipografías externas y servicios de datos fueron bloqueados en estas pruebas: se revisó también la pila de respaldo existente. No se consultó Sheets para comparar datos en vivo.

## Límites explícitos

La conexión de Neon se verificó primero en modo READ ONLY. Luego se ejecutaron, con autorizaciones separadas, el DDL `001_admin_catalog.sql`, el alta de la administradora y la importación atómica del catálogo. La comparación posterior no encontró diferencias. No se escribió en Sheets, no se subió ningún archivo real a Cloudinary y no se desplegó. Cloudinary se comprobó mediante llamadas autenticadas de solo lectura.

Rewrite de Vercel, origen HTTPS, cookie __Host-, límites del plan y preset signed requieren prueba real en Preview tras configurar servicios y autorizar despliegue. La edición de reglas de tortas, campañas y tamaños globales permanece pendiente y está identificada en ADMIN_SETUP.md. Los productos especiales conservan su vínculo a campañas importadas.

## Archivos de evidencia

- `review/admin/home-{320,390,768,1440}.png`
- `review/admin/products-{320,390,768,1440}.png`
- `review/admin/editor-{320,390,768,1440}.png`
- `review/admin/login-production.png`
- Reporte y trazas regenerables en `.local/playwright-report` y `.local/playwright-results` (ignorados).

## Actualización: preparación de la segunda etapa

Se revisaron ADMIN_SETUP, inventario de archivos, migración, driver y fronteras de servidor. Luego se configuró y probó la conexión real con una transacción READ ONLY. Las indicaciones de consola se contrastaron con documentación oficial de Neon.

- Sin TACC pasó al final del filtro, después de Bandejas, en el respaldo local y en la composición desde Sheets. No se alteraron productos ni disponibilidad.
- En ese punto, `npm test`: **23/23** correctas. La verificación actual completa figura más abajo con 24/24.
- `npm run test:e2e -- --grep 'web pública|regresión contra'`: **2/2** correctas. La regresión comprueba explícitamente el nuevo orden y compara el resto del catálogo, rutas, carrito, WhatsApp y tortas con la base estable.
- Las cuatro variables locales de Cloudinary están completas. Una comprobación autenticada de solo lectura confirmó las credenciales del entorno `de8eotwy4` y el preset firmado `ml_default`; no se subieron ni eliminaron archivos reales durante esta validación.
- Build de esta revisión en `.local/neon-stage2-build`: correcto; revisión de assets sin secretos: correcta. Usó la instalación histórica Vite 7.3.3 presente en el repositorio; para instalar las versiones corregidas del lockfile se mantiene la instrucción `npm ci`.
- Diagnóstico real de Neon autorizado por el usuario: `connected: true`, `readOnly: true`, `publicTables: 0`, `schemaEmpty: true`, contra la rama production del proyecto de pruebas.
- Migración `001_admin_catalog.sql` ejecutada con autorización en el proyecto de pruebas. Antes, una nueva consulta READ ONLY confirmó cero tablas públicas. La CLI valida destino/hostname/TLS y flags; verificó esquema vacío inmediatamente antes del DDL. Luego, `admin:neon-verify` confirmó 16 tablas exactas, 9 claves foráneas validadas, índices válidos, 3 funciones, el trigger de categorías y los dos registros de control. Administradores, productos, categorías y campañas permanecen vacíos. No hubo importación.
- Las pruebas SQL PostgreSQL en memoria confirman sintaxis y atomicidad para PGlite; no sustituyen el ensayo autorizado en Neon.
- Revisión de autenticación: la CLI guarda contraseñas como scrypt con salt aleatorio; el alta del primer usuario sigue pendiente de autorización. `npm test`: 24/24, incluyendo Vercel local con `VERCEL_ENV=development` y cookie Secure en Preview.

### Destino elegido por el usuario

Se utiliza `production` dentro del proyecto exclusivo `flor-de-postre-pruebas`, sin rama hija. El diagnóstico exige ambos nombres y el hostname exacto confirmado en Connect; esas etiquetas locales no sustituyen la verificación visual del proyecto. Antes de migrar, la consulta real confirmó cero tablas públicas. La verificación posterior usó una transacción READ ONLY.

## Actualización: preparación del catálogo real

- Se exportaron en modo de solo lectura los once CSV configurados; no se modificó ninguna planilla.
- El respaldo local preparado tiene hash `578df429dd618f0eb81787ebc2e155cf0e301431d874ba42007f892d0d46bb1b` y está bajo `.local/`, ignorado por Git.
- Contiene 101 productos: 66 de menú diario, 9 Sin TACC, 23 postres y 3 especiales; además, 12 categorías, 4 tamaños, 13 campañas, 27 registros de tortas y 100 imágenes válidas.
- La importación simulada completa en PostgreSQL local coincidió con el modelo privado y con los once datasets públicos. Un segundo intento fue rechazado y no cambió la revisión.
- Ocho IDs históricos requieren una clave interna segura: tres pares repetidos entre menú y postres, más dos IDs con caracteres no admitidos por la API. El manifiesto conserva la correspondencia y la salida pública mantiene todos los IDs históricos.
- Se registraron nueve combinaciones de tamaño inactivas sin precio, dos filas especiales inactivas incompletas y una URL de foto rota. Cuatro postres sin ninguna variante activa con precio quedan inactivos hasta completar sus precios: Flan con dulce de leche y crema, Isla flotante, Mini Balcarce y Carrot Cake.
- Una verificación real posterior, en transacción READ ONLY, confirmó el proyecto `flor-de-postre-pruebas`, rama `production`, 16 tablas válidas, una administradora y cero productos, categorías, campañas o ejecuciones de importación.
- En esa preparación: `npm test` 24/24 y `npm run build` correcto; la importación real todavía no se había ejecutado.

## Actualización: importación autorizada en Neon de pruebas

- Antes de escribir se volvió a confirmar en modo READ ONLY el proyecto `flor-de-postre-pruebas`, rama `production`, base `neondb`, una administradora y catálogo vacío.
- La importación del snapshot `578df429dd618f0eb81787ebc2e155cf0e301431d874ba42007f892d0d46bb1b` se ejecutó dentro de una única transacción y terminó sin errores.
- La comparación posterior devolvió `matches: true` y `differences: []`.
- Una segunda verificación READ ONLY confirmó: 101 productos, 12 categorías, 13 campañas, 100 imágenes, 54 variantes, 4 tamaños, 27 registros de tortas, una versión de reglas y una ejecución de importación con el hash correcto.
- Con autorización posterior, `ADMIN_WRITES_ENABLED=true` quedó habilitado únicamente en `.env.development.local` y se verificó mediante login real. `VITE_CATALOG_SOURCE=sheets`, `CATALOG_SOURCE=sheets` y `CATALOG_NEON_APPROVED=false` permanecen sin cambios: la web pública continúa en Google Sheets.
