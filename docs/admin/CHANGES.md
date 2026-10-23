# Archivos de la implementación

Rama `feature/admin-neon-cloudinary`. Cambios locales sin commit. `main` permanece en `7557dd8`. No hubo push, merge ni despliegue.

## Modificados

- `package-lock.json`
- `package.json`
- `src/App.jsx`
- `src/components/DailyMenuSection.jsx`
- `src/data/dailyProducts.js`
- `src/main.jsx`
- `vercel.json`
- `vite.config.js`

## Creados

- `.env.example`
- `.gitignore`
- `ADMIN_SETUP.md`
- `api/admin.js`
- `api/catalog.js`
- `docs/admin/ARCHITECTURE.md`
- `docs/admin/CATALOG_ANALYSIS.md`
- `docs/admin/CHANGES.md`
- `docs/admin/VERIFICATION.md`
- `docs/admin/NEON_TEST_SETUP.md`
- `migrations/001_admin_catalog.sql`
- `playwright.config.js`
- `review/admin/editor-1440.png`
- `review/admin/editor-390.png`
- `review/admin/editor-768.png`
- `review/admin/home-1440.png`
- `review/admin/home-390.png`
- `review/admin/home-768.png`
- `review/admin/login-production.png`
- `review/admin/products-1440.png`
- `review/admin/products-390.png`
- `review/admin/products-768.png`
- `scripts/catalog-import.js`
- `scripts/export-sheets.mjs`
- `scripts/check-build.mjs`
- `scripts/check-neon.mjs`
- `scripts/db-admin.mjs`
- `scripts/e2e-server.mjs`
- `scripts/import-plan.js`
- `scripts/prepare-import.mjs`
- `scripts/validate-prepared-import.mjs`
- `server/admin-handler.js`
- `server/cloudinary.js`
- `server/db.js`
- `server/neon-test-check.js`
- `server/public-handler.js`
- `server/repository.js`
- `server/security.js`
- `shared/catalog.js`
- `shared/public-catalog.js`
- `src/admin/AdminApp.jsx`
- `src/admin/admin.css`
- `src/admin/client.js`
- `src/admin/demo.js`
- `src/services/catalog.js`
- `tests/catalog.test.js`
- `tests/e2e/admin.spec.js`
- `tests/fixtures.js`
- `tests/helpers.js`
- `tests/import.test.js`
- `tests/neon-test-check.test.js`
- `tests/server.test.js`

## Conservados

- `.env.local` y las once integraciones de Sheets, sin modificación.
- Estilos públicos, imágenes de marca, configuradores y lógica comercial de tortas, sin modificación. Único ajuste público posterior: Sin TACC al final de los filtros, tanto locales como de Sheets.
- `dist` y `node_modules` históricos, restaurados después de las pruebas para no incluir archivos generados en el cambio. El lockfile nuevo es la autoridad: ejecutar `npm ci` para reproducir la instalación verificada.
- Respaldos, builds y reportes temporales bajo `.local/`, ignorados por Git.

Las capturas bajo `review/admin/` sí se incluyen como evidencia visual.

## Continuación: prueba Neon

- La conexión real del proyecto de pruebas `flor-de-postre-pruebas`, rama `production`, respondió dentro de una transacción READ ONLY; antes de migrar reportó cero tablas públicas.
- `scripts/db-admin.mjs` valida proyecto, rama, hostname, TLS y flags cerrados, y cancela si detecta tablas públicas antes del DDL. `admin:db:test` carga únicamente el archivo de entorno local ignorado.
- Con autorización explícita se aplicó `001_admin_catalog.sql` y se creó la primera administradora. `scripts/verify-neon-migration.mjs` confirmó tablas, relaciones, una administradora y catálogo vacío en READ ONLY. Google Sheets continúa como fuente pública; no se importaron productos.
- El apartado global de imágenes se eliminó: nombre, descripción, categoría, precio, variantes, estados y fotos se editan desde cada producto. El editor abre como una página completa, con información y fotos en una sola recorrida vertical y vista previa fija a la derecha en escritorio. Los IDs técnicos quedan ocultos y “Orden de presentación” se presenta como “Posición en la tienda”, con una explicación de su efecto. Categorías permanece como sección independiente.
- Las imágenes Cloudinary se entregan optimizadas también dentro del administrador: tamaños responsivos, ancho máximo según el uso, calidad automática y formato automático compatible con el navegador. Se conserva el original para reemplazos y futuros recortes sin pérdida.
- Al abrir o editar un producto y al cambiar entre las secciones principales, la página se posiciona siempre al comienzo del contenido. Todos los selectores usan una flecha uniforme con margen interior suficiente en escritorio y celular.
- Las filas de productos, los productos destacados del inicio y las tarjetas de resumen responden al puntero con un verde suave, borde y movimiento breve. Los efectos también aparecen al navegar con teclado y se desactivan cuando el sistema solicita reducir movimiento.
- El campo informativo de stock se ocultó del editor sin borrar el valor histórico de los productos ni modificar el esquema. También se retiraron del panel real los avisos técnicos de solo lectura, Neon, Sheets y estado de integraciones; Configuración queda como un espacio simple para futuras herramientas.
- Se generó un snapshot local ignorado por Git y se validó una importación simulada de 101 productos en PostgreSQL en memoria. Ningún dato fue escrito en Neon durante esa preparación.
- Con autorización posterior se importó ese snapshot de forma atómica en Neon de pruebas. La comparación devolvió `matches: true`, sin diferencias; una verificación READ ONLY confirmó 101 productos, 12 categorías, 13 campañas, 100 imágenes, 54 variantes, 4 tamaños y 27 registros de tortas.
