import { publicDatasets } from "../shared/public-catalog.js";
import {
  importQueries,
  compareCatalog,
  compareLegacyDatasets,
} from "./import-plan.js";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { database } from "../server/db.js";
import { validateTestTarget } from "../server/neon-test-check.js";
import { readCatalog } from "../server/repository.js";
import { passwordHash } from "../server/security.js";
import { splitSQL, definitions, normalizeSnapshot } from "./catalog-import.js";
const [command, file] = process.argv.slice(2);
const write = ["migrate", "import", "create-admin"].includes(command);
if (!["migrate", "import", "compare", "create-admin"].includes(command)) {
  console.error(
    "Comandos: migrate | import carpeta-preparada | compare carpeta-preparada | create-admin",
  );
  process.exit(1);
}
if (
  write &&
  (process.env.ALLOW_DATABASE_WRITES !== "I_HAVE_APPROVAL" ||
    !process.argv.includes("--execute"))
) {
  console.error(
    "Bloqueado. Requiere autorización explícita, ALLOW_DATABASE_WRITES=I_HAVE_APPROVAL y --execute. Sin conexión.",
  );
  process.exit(1);
}
try {
  // Every CLI operation is deliberately confined to the confirmed test project.
  // Production migration/imports will require a separate, explicit implementation.
  validateTestTarget(process.env);
  let prepared;
  if (["import", "compare"].includes(command)) {
    if (!file) throw new Error("Indicá la carpeta preparada.");
    const stored = JSON.parse(
      await readFile(resolve(file, "catalog.json"), "utf8"),
    );
    const manifest = JSON.parse(
      await readFile(resolve(file, "manifest.json"), "utf8"),
    );
    const files = {};
    for (const name of Object.keys(definitions)) {
      const bytes = await readFile(resolve(file, "backup", `${name}.csv`));
      if (
        createHash("sha256").update(bytes).digest("hex") !==
        manifest.files[name]?.sha256
      )
        throw new Error(`Respaldo alterado: ${name}`);
      files[name] = bytes.toString("utf8");
    }
    const hash = createHash("sha256")
      .update(JSON.stringify(manifest.files))
      .digest("hex");
    if (hash !== manifest.snapshotHash || hash !== stored.manifest.snapshotHash)
      throw new Error("Manifiesto alterado.");
    const normalized = normalizeSnapshot(files);
    if (
      JSON.stringify(normalized.identities) !==
      JSON.stringify(manifest.identityMappings || [])
    )
      throw new Error("Correspondencias de identidad alteradas.");
    prepared = { ...normalized, manifest };
  }
  if (command === "create-admin") {
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.ADMIN_EMAIL || "") ||
      (process.env.ADMIN_PASSWORD || "").length < 14 ||
      process.env.ADMIN_PASSWORD.length > 256
    )
      throw new Error(
        "Definí ADMIN_EMAIL y ADMIN_PASSWORD (14 a 256 caracteres) por entorno temporal, nunca en el comando ni VITE_.",
      );
  }
  const sql = await database();
  if (command === "migrate") {
    const [[target]] = await sql.transaction(
      [
        sql`SELECT count(*)::integer AS public_tables
        FROM pg_catalog.pg_tables WHERE schemaname = 'public'`,
      ],
      { readOnly: true },
    );
    if (target.public_tables !== 0)
      throw new Error(
        "La base de pruebas ya tiene tablas públicas; se cancela la migración para revisar su contenido.",
      );
    const paths = (await readdir(new URL("../migrations/", import.meta.url)))
      .filter((x) => /^\d+.*\.sql$/.test(x))
      .sort();
    for (const path of paths) {
      const source = await readFile(
        new URL(`../migrations/${path}`, import.meta.url),
        "utf8",
      );
      await sql.transaction(
        splitSQL(source).map((statement) => sql.query(statement)),
      );
      console.log(`Migración aplicada: ${path}`);
    }
  }
  if (command === "create-admin") {
    const id = randomUUID(),
      email = process.env.ADMIN_EMAIL.toLowerCase().trim(),
      hash = await passwordHash(process.env.ADMIN_PASSWORD);
    await sql.transaction([
      sql`INSERT INTO admins(id,email,password_hash) VALUES(${id},${email},${hash})`,
      sql`INSERT INTO audit_log(admin_id,action) VALUES(${id},'admin.bootstrap')`,
    ]);
    console.log("Administrador creado. No se muestran credenciales.");
  }
  if (command === "import") {
    const queries = importQueries(sql, prepared);
    await sql.transaction(queries);
    console.log(
      "Importación atómica completa. Ejecutá compare antes de habilitar la fuente pública.",
    );
  }
  if (command === "compare") {
    const actual = await readCatalog(sql),
      expected = prepared.catalog;
    const differences = [
      ...compareCatalog(expected, actual),
      ...compareLegacyDatasets(prepared.datasets, publicDatasets(actual)),
    ];
    console.log(
      JSON.stringify(
        {
          matches: !differences.length,
          differences,
          snapshotHash: prepared.manifest.snapshotHash,
        },
        null,
        2,
      ),
    );
    if (differences.length) process.exitCode = 1;
  }
} catch (e) {
  console.error(
    "Operación fallida. Revisá configuración y respaldo; no se imprimen errores de conexión que puedan contener credenciales.",
  );
  if (!e.code && !/postgres|password|connection|https?:\/\//i.test(e.message))
    console.error(e.message);
  process.exitCode = 1;
}
