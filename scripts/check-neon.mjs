import { database } from "../server/db.js";
import { checkTestConnection } from "../server/neon-test-check.js";
try {
  const result = await checkTestConnection(
    process.env,
    database,
    process.argv.includes("--execute"),
  );
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  // Nunca imprimir el error del driver: puede contener información de conexión.
  console.error(
    "Comprobación no completada. No se ejecutaron migraciones ni importaciones.",
  );
  if (
    error.message ===
    "Falta autorización para comprobar la conexión (--execute). Sin conexión."
  )
    console.error(error.message);
  else
    console.error(
      "Revisá el destino de pruebas, TLS, los flags cerrados y la configuración local. No compartas la cadena de conexión.",
    );
  process.exitCode = 1;
}
