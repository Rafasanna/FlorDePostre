# Etapa 2: configurar Neon de pruebas, sin ejecutar migraciones

Estado: conexión verificada y migración `001_admin_catalog.sql` aplicada en `flor-de-postre-pruebas` / `production`. Se creó la primera administradora y se importó el catálogo autorizado, con comparación exacta posterior. Google Sheets continúa como fuente pública. Este documento conserva el procedimiento inicial de preparación; no implica autorización para repetir migraciones o importaciones.

## Paso 1 · Proyecto exclusivo de pruebas

1. Abrir https://console.neon.tech e iniciar sesión en tu cuenta.
2. En Projects, elegir **New Project** (en el alta inicial puede aparecer Create project).
3. Nombre: **flor-de-postre-pruebas**. Crear un proyecto nuevo, separado de cualquier proyecto con datos reales; no importar ni clonar un proyecto existente.
4. Proveedor/región para este ensayo: **AWS US East (N. Virginia)** (`aws-us-east-1`). Es una elección de pruebas; la región definitiva se decidirá junto con la región efectiva de las funciones Vercel.
5. En Services, dejar habilitado únicamente **Postgres database**. Elegir **PostgreSQL 17**, si el formulario permite elegir versión. No necesitamos Neon Auth, Data API, Functions, almacenamiento ni AI Gateway para este backend.
6. Crear el proyecto. No añadir datos de ejemplo, ejecutar SQL, instalar integraciones con Vercel ni conectar GitHub.
7. Detenerse y confirmar en el chat solamente el nombre del proyecto y la región. No enviar contraseñas ni la cadena de conexión.

Neon llama `production` a la rama raíz creada desde su consola. Por indicación del usuario se utilizará esa rama dentro del proyecto exclusivo **flor-de-postre-pruebas**. El aislamiento lo aporta el proyecto nuevo; no se requiere una rama hija.

## Paso 2 · Confirmar el destino de pruebas

1. Abrir **flor-de-postre-pruebas**.
2. En **Branches**, seleccionar **production**, la raíz vacía del proyecto nuevo.
3. No crear admin-test. Verificar que el proyecto seleccionado sea el exclusivo de pruebas antes de copiar cualquier conexión.
4. No ejecutar SQL ni añadir los datos de ejemplo.

## Paso 3 · Obtener la conexión correcta sin compartirla

1. Dentro de **flor-de-postre-pruebas**, seleccionar **Connect**.
2. En el diálogo elegir explícitamente **Branch: production** del proyecto **flor-de-postre-pruebas**. Revisar esa selección aunque Neon muestre otra por defecto.
3. Mantener **Database: neondb** y el rol propietario predeterminado de este proyecto de pruebas (normalmente neondb_owner) para el primer diagnóstico. No es el usuario de login del administrador. Más adelante se prepararán permisos separados para la aplicación y para las migraciones.
4. Mantener **Connection pooling** activado. Seleccionar el ejemplo Connection string o Node.js correspondiente y copiar únicamente la URL `postgresql://...`, sin `psql`, comillas externas del comando ni comandos adicionales.
5. Conservar los parámetros TLS que entrega Neon, como `sslmode=require` y `channel_binding=require`. No cambiar ni publicar la contraseña.
6. El hostname es el texto entre `@` y `/neondb` (sin puerto, si aparece `:5432`); normalmente incluye `-pooler`. Se usará como segunda comprobación del destino.

Los nombres de proyecto y rama en un archivo local no demuestran por sí solos qué rama hay detrás de una URL. El vínculo proyecto → rama → hostname se verifica primero en Connect; la comprobación del código rechaza después cualquier hostname distinto del confirmado.

## Paso 4 · Guardar variables solo en el equipo local

Crear o editar **.env.development.local** en la raíz del repositorio. Si ya existe, conservar sus valores y añadir solo las claves que correspondan. No copiar encima de .env.local ni sustituir las once URLs de Sheets.

```dotenv
# Secretos: pegar solo aquí, nunca en el chat.
DATABASE_URL="PEGAR_AQUI_LA_URL_DE_PRODUCTION_DEL_PROYECTO_DE_PRUEBAS"

# Metadatos de comprobación local, no son credenciales.
NEON_TEST_PROJECT=flor-de-postre-pruebas
NEON_TEST_BRANCH=production
NEON_TEST_HOST="PEGAR_AQUI_EL_HOSTNAME_EXACTO_DE_LA_MISMA_URL"

# Mantener estas barreras cerradas.
ADMIN_ENABLED=false
ADMIN_WRITES_ENABLED=false
ADMIN_DEMO_MODE=off
VITE_CATALOG_SOURCE=sheets
CATALOG_SOURCE=sheets
CATALOG_NEON_APPROVED=false
```

No crear `VITE_DATABASE_URL` ni otras variables VITE_ con secretos. No hace falta configurar SESSION_SECRET, credenciales de administradora ni Cloudinary para este primer diagnóstico. No activar ALLOW_DATABASE_WRITES.

El archivo está ignorado por Git. Vite carga esta configuración del lado del servidor; únicamente las variables con prefijo VITE_ llegan al navegador. El comando de diagnóstico usa Node con --env-file para leer el mismo archivo; no publica un endpoint ni imprime credenciales.

**Vercel no se modifica en esta etapa.** En un paso futuro, tras autorización, DATABASE_URL y secretos se cargarán solo en Preview, con una conexión a la rama de pruebas. No asignarlos a Production ni usar una integración automática que cambie entornos.

## Paso 5 · Primera conexión, exclusivamente de lectura — completado

Después de confirmar el proyecto, rama y archivo local, el usuario autoriza explícitamente **solo la prueba de conexión de lectura**. Hasta entonces no ejecutar el comando siguiente:

```sh
npm run admin:neon-check -- --execute
```

El comando utiliza server/db.js y el driver Neon del servidor; exige confirmar el proyecto flor-de-postre-pruebas y su rama production, el hostname exacto, TLS, administrador cerrado y Sheets activa. Ejecuta únicamente SELECT de comprobación y metadatos dentro de una transacción PostgreSQL **READ ONLY**, con timeout de 15 segundos. Confirma que transaction_read_only sea on. No requiere tablas de la aplicación ni crea ninguna. Devuelve connected, readOnly, publicTables y schemaEmpty, nunca la URL ni la contraseña.

Si publicTables es distinto de cero, detenerse a revisar qué contiene el destino antes de autorizar migraciones. El diagnóstico no borra ni corrige tablas. No se puede deducir del resultado qué proyecto del panel corresponde al hostname; esa parte requiere la confirmación visual anterior.

Resultado real del 2026-10-22: `connected: true`, `readOnly: true`, `publicTables: 0`, `schemaEmpty: true`. La conexión pooled/TLS funciona contra el destino confirmado. Si el comando falla en una repetición, revisar localmente los valores. Los errores del driver se ocultan para evitar que una URL o contraseña termine en la salida. No pegar el contenido completo del archivo o una captura de Connect en el chat.

## Revisión de la migración antes de pedir autorización

- Solo existe **001_admin_catalog.sql**. Usa tablas, índices, restricciones y funciones compatibles con PostgreSQL; no necesita extensiones ni claves de proveedores.
- No se ejecuta al iniciar Vite, importar server/db.js, hacer build o comprobar la conexión.
- El SQL crea el esquema de la aplicación y dos registros de control (catalog_state/schema_migrations): eso sí es una escritura y requiere autorización separada.
- No contiene DROP TABLE, TRUNCATE ni importación automática. Sí reemplaza sus funciones y recrea el trigger categories_depth. Los DELETE de variantes/imágenes/sesiones pertenecen a funciones operativas o al backend; no se invocan al aplicar el esquema.
- La CLI de migración ejecuta las sentencias en una transacción. Sin ALLOW_DATABASE_WRITES=I_HAVE_APPROVAL **y** --execute termina antes de solicitar la conexión.
- El SQL se volvió a ejecutar en PostgreSQL en memoria y pasó la prueba de repetición. IF NOT EXISTS no valida ni corrige estructuras incompatibles preexistentes: por eso el primer ensayo exige una base vacía verificada y revisión del destino.
- La migración ahora valida localmente proyecto y rama esperados, hostname exacto, TLS, ausencia de Vercel, administrador cerrado y Sheets activa antes de obtener el cliente SQL. Inmediatamente antes del DDL hace otra consulta READ ONLY y cancela si encuentra una sola tabla pública. Esto complementa la confirmación visual de Neon; no puede inferir el nombre del proyecto solo desde PostgreSQL.
- La CLI `admin:db:test` carga `.env.development.local`. `admin:db` queda disponible para herramientas futuras, pero no elude la validación de destino. Las escrituras siguen requiriendo autorización por separado, `ALLOW_DATABASE_WRITES=I_HAVE_APPROVAL` y `--execute`.
- Autorización del usuario: aplicada únicamente `001_admin_catalog.sql` a `flor-de-postre-pruebas` / `production`; la CLI reportó éxito. `admin:neon-verify` confirmó en READ ONLY las 16 tablas, nueve claves foráneas validadas, índices válidos, funciones, trigger y registros de control. No encontró productos, categorías, campañas ni administradores.

Una conexión correcta no autoriza migrar. Una migración autorizada no autoriza importar, crear usuarios, abrir escrituras del panel, cambiar la fuente pública ni desplegar. Cada etapa se confirma por separado.

## Referencias oficiales revisadas

- [Crear proyectos](https://neon.com/docs/manage/projects)
- [Ramas y aislamiento](https://neon.com/docs/manage/branches)
- [Conexión, pooling y TLS](https://neon.com/docs/connect/connect-from-any-app)
- [Regiones](https://neon.com/docs/introduction/regions)
- [Driver y transacciones READ ONLY](https://neon.com/docs/serverless/serverless-driver)
