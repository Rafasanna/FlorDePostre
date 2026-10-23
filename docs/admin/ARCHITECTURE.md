# Arquitectura y contratos

## Fronteras

- `src/App.jsx` y componentes públicos: UI, selección y pedido WhatsApp actuales. `src/services/catalog.js` delega a Sheets por defecto; solo el selector público no secreto permite optar a la API preparada. No importa módulos de servidor.
- `src/admin/`: UI privada y cliente HTTP; modo demo separado de la API. El router de raíz descarga el administrador únicamente bajo `/admin`. El CSS está acotado a clases administrativas.
- `shared/`: contrato, validación, filtros y traducción al formato español existente. Dinero entero en centavos, JSON con null explícito para importes/fechas opcionales. IDs de producto y tamaño son los actuales, no IDs reconstruidos por nombre. UUID únicamente para nuevos assets, sesiones e identidad interna de administradores.
- `api/admin.js`: función Vercel Node que delega en `server/admin-handler.js`. Rewrite conserva operación en query route; jamás depende de autorización del cliente.
- `server/`: conexión lazy a Neon, repositorio con instantánea coherente de tablas, autorización y subida firmada Cloudinary. Ninguna conexión se inicia con importación de un módulo o durante build.
- `migrations/`: SQL manual versionado. Las claves foráneas unen productos, categorías, campañas, variantes y assets. Relaciones de variantes únicas; primera imagen por orden, sin principales duplicadas. Fechas, precios, stock y jerarquías tienen validaciones. No hay hard delete de productos ni destrucción de Cloudinary.

## Sesiones y mutaciones

1. `ADMIN_ENABLED` y configuración válida son obligatorios antes de solicitar la conexión. En modo cerrado devuelve 503.
2. Login verifica origen/content-type y limita intentos en DB antes de scrypt. Fallos no revelan cuentas existentes. Éxito entrega cookie opaca HttpOnly y token CSRF asociado mediante HMAC.
3. Todas las rutas privadas consultan la sesión y el estado activo del administrador. No se guarda token de sesión en localStorage.
4. POST/PUT requieren origen exacto, JSON y CSRF; las mutaciones de contenido también `ADMIN_WRITES_ENABLED=true`.
5. Validación de servidor con allowlist de campos. La UI ayuda, pero no es autoridad. Asset nuevo debe estar registrado por importación/subida; no se acepta metadata inventada del navegador.
6. Revisión optimista global: cada guardado bloquea `catalog_state`, comprueba revisión, modifica relaciones y agrega auditoría en una misma transacción. Si existe conflicto responde 409; no sobrescribe una edición concurrente.

Hash de sesión SHA-256, 32 bytes aleatorios; CSRF derivado de token y secreto. Contraseña scrypt con salt aleatorio, N=16384/r=8/p=1, clave de 64 bytes y comparación constante. Cookie local fdp_admin; en HTTPS/Vercel __Host-fdp_admin, Secure, Path=/, sin Domain. Expira a 8 horas y no se renueva indefinidamente. Cuenta inactiva invalida acceso aunque subsista la cookie. Cualquier error se devuelve sin stack, SQL ni conexión. Auditoría básica de éxito/fallo de acceso, logout, bootstrap, productos, categorías e imágenes.

Vercel CLI establece `VERCEL=1` también al ejecutar funciones locales y expone `VERCEL_ENV=development`. En ese entorno local el origen HTTP loopback y la cookie de desarrollo están permitidos; Preview y Production siguen usando HTTPS y cookies Secure. La demo se deshabilita con Vercel presente. Para probar el login real localmente se usa `npm run dev` (API local de Vite), no `npm run dev:admin` (demo explícita).

## Rutas

Todas las respuestas privadas son `Cache-Control: private, no-store`. Sin CORS abierto. URLs desde el mismo origen:

| Método y ruta | Cuerpo / respuesta |
|---|---|
| POST /api/admin/login | `{email,password}` → `{user:{email},csrfToken}` y cookie |
| GET /api/admin/session | `{user:{email},csrfToken,writesEnabled}` |
| POST /api/admin/logout | `{}` + X-CSRF-Token → revoca sesión y cookie |
| GET /api/admin/catalog | instantánea `{revision,products,categories,sizes,campaigns,cake,rules}` |
| POST /api/admin/products | `{product,revision}` → `{ok,revision}` |
| PUT /api/admin/products/:id | mismo contrato; id y kind inmutables |
| POST /api/admin/categories | `{category,revision}` |
| PUT /api/admin/categories/:id | mismo contrato; id inmutable |
| POST /api/admin/images/upload | `{file: dataURL}` → `{id,url,publicId,alt}`; firma y upload solo servidor |
| GET /api/catalog | público solo tras habilitar Neon → `{source:'neon',revision,datasets}` |

Errores: `{error,fields?}`, 401 sesión ausente/vencida, 403 origen/CSRF, 409 revisión/duplicado, 422 campos/datos, 429 límite login, 503 integración deshabilitada/sin configurar. No hay endpoint de DELETE ni limpieza de assets. 404/405 para operación/método no contemplado.

## Modelo de producto

Campos de UI y DB: id, kind (daily/sin_tacc/postre/special), name, description, categoryId, campaignId opcional, priceCents o null en postres, offerPriceCents, previousPriceCents, active, archived, featured, reserved, campaignActive, sinTacc, limited, stock, label, offerLabel, startDate, endDate, order, variants e images. Publicación efectiva de un especial depende de campaña, `campaignActive`, disponibilidad y fechas. `active` no implica stock transaccional. Las categorías desactivadas no aceptan productos activos nuevos; no se desactivan mientras tengan productos activos dependientes.

Variantes: `{sizeId,priceCents,active}`; combinación producto/tamaño única. Tamaños globales y campañas se importan, no se inventan desde un producto. Images: `{id,url,publicId,alt}`; orden de array = presentación y primera = principal. Dimensiones/bytes/formato viven en la tabla de assets, no son aceptados desde el formulario.

`source_record` mantiene el registro normalizado importado para auditoría y campos heredados (p.ej. notas). El adaptador público sobrescribe sus campos editables con columnas canónicas: nunca reutiliza un precio o disponibilidad obsoleto del respaldo. Los IDs de Sheets se mantienen aunque se edite nombre o categoría. Las nuevas categorías sí reciben IDs permanentes.

## Lectura pública y caché

Sheets no pasa por una nueva API mientras es la fuente seleccionada; sus funciones, normalización, caché y fallback se conservan. API Neon no retorna campos de autenticación, auditoría o infraestructura, solo los once datasets públicos. Lee una instantánea en una sentencia; response no-store, frontend fetch cache:no-store. En Neon no se lee/escribe la caché histórica de Sheets ni se usa respaldo estático del catálogo. Poll de 30s y focus refrescan todos los datasets; API fallida no reactiva otra fuente. Tras guardar el panel vuelve a consultar catálogo; no depende de deploy.

Las fórmulas de tortas siguen en código versionado. `pricing_rule_versions` respalda matriz y aliases. La API compara la regla activa con la versión de aplicación y falla cerrada si divergen; la edición de reglas está deshabilitada. La activación inicial necesita completar comparación/importación y resolver cualquier pendiente comercial que altere los registros migrados.

## Fuera de esta etapa

Sin pedidos persistidos, métricas comerciales, roles adicionales, recuperación automática por correo, editores de campañas/reglas/global de tamaños ni borrado remoto de archivos. Ninguna de estas funciones se simula como integración segura. Primero se valida Preview con servicios de prueba; el corte y el despliegue necesitan autorización.
