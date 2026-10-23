let connection;
export async function database(env = process.env) {
  if (!env.DATABASE_URL)
    throw Object.assign(new Error("Servicio sin configurar."), { status: 503 });
  if (!connection) {
    const { neon } = await import("@neondatabase/serverless");
    connection = neon(env.DATABASE_URL);
  }
  return connection;
}
