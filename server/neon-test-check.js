// Diagnóstico de consola local; nunca se importa desde src/ ni se expone como API.
export function validateTestTarget(env) {
  if (
    env.VERCEL ||
    env.NEON_TEST_PROJECT !== "flor-de-postre-pruebas" ||
    env.NEON_TEST_BRANCH !== "production" ||
    !env.NEON_TEST_HOST
  )
    throw new Error(
      "Confirmá el proyecto flor-de-postre-pruebas, su rama production y su hostname en el entorno local.",
    );
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("Falta una conexión Neon válida en el archivo local.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !/^ep-[a-z0-9-]+\.[a-z0-9.-]+\.neon\.tech$/.test(url.hostname) ||
    url.hostname !== env.NEON_TEST_HOST ||
    !url.username ||
    !url.password ||
    !["require", "verify-ca", "verify-full"].includes(
      url.searchParams.get("sslmode"),
    )
  )
    throw new Error(
      "La conexión no coincide con el hostname de pruebas confirmado o no exige TLS.",
    );
  if (
    env.ADMIN_ENABLED === "true" ||
    env.ADMIN_WRITES_ENABLED === "true" ||
    (env.VITE_CATALOG_SOURCE && env.VITE_CATALOG_SOURCE !== "sheets") ||
    (env.CATALOG_SOURCE && env.CATALOG_SOURCE !== "sheets") ||
    env.CATALOG_NEON_APPROVED === "true"
  )
    throw new Error(
      "Para esta comprobación, el administrador debe estar cerrado y Sheets debe seguir activa.",
    );
}
export async function checkTestConnection(
  env,
  getDatabase,
  authorized = false,
) {
  if (!authorized)
    throw new Error(
      "Falta autorización para comprobar la conexión (--execute). Sin conexión.",
    );
  validateTestTarget(env);
  const sql = await getDatabase(env);
  const [[result]] = await sql.transaction(
    [
      sql`SELECT 1::integer AS connected,
      current_setting('transaction_read_only') AS read_only,
      (SELECT count(*)::integer FROM pg_catalog.pg_tables WHERE schemaname='public') AS public_tables`,
    ],
    { readOnly: true, fetchOptions: { signal: AbortSignal.timeout(15000) } },
  );
  if (result?.connected !== 1 || result.read_only !== "on")
    throw new Error("No se pudo confirmar una transacción de solo lectura.");
  return {
    connected: true,
    readOnly: true,
    publicTables: result.public_tables,
    schemaEmpty: result.public_tables === 0,
  };
}
