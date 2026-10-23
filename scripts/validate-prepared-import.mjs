import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { definitions, normalizeSnapshot } from "./catalog-import.js";
import {
  compareCatalog,
  compareLegacyDatasets,
  importQueries,
} from "./import-plan.js";
import { readCatalog } from "../server/repository.js";
import { publicDatasets } from "../shared/public-catalog.js";

const [folder] = process.argv.slice(2);
if (!folder) {
  console.error("Uso: npm run admin:validate-import -- carpeta-preparada");
  process.exit(1);
}

const root = resolve(folder);
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const files = {};
for (const name of Object.keys(definitions)) {
  const data = await readFile(`${root}/backup/${name}.csv`);
  const hash = createHash("sha256").update(data).digest("hex");
  if (hash !== manifest.files[name]?.sha256)
    throw new Error(`Respaldo alterado: ${name}`);
  files[name] = data.toString("utf8");
}
const snapshotHash = createHash("sha256")
  .update(JSON.stringify(manifest.files))
  .digest("hex");
if (snapshotHash !== manifest.snapshotHash)
  throw new Error("El hash del respaldo no coincide con el manifiesto.");

const normalized = normalizeSnapshot(files);
if (
  JSON.stringify(normalized.identities) !==
  JSON.stringify(manifest.identityMappings || [])
)
  throw new Error("Las correspondencias de identidad no coinciden.");
if (JSON.stringify(normalized.omissions) !== JSON.stringify(manifest.omissions))
  throw new Error("Las omisiones documentadas no coinciden.");
const prepared = { ...normalized, manifest };

const db = new PGlite();
const query = (text, params = []) => {
  let promise;
  return {
    text,
    params,
    then(resolvePromise, rejectPromise) {
      promise ||= db.query(text, params).then((result) => result.rows);
      return promise.then(resolvePromise, rejectPromise);
    },
  };
};
const sql = (parts, ...values) =>
  query(
    parts.reduce(
      (statement, part, index) => statement + (index ? `$${index}` : "") + part,
      "",
    ),
    values,
  );
sql.query = query;
sql.transaction = (items) =>
  db.transaction(async (transaction) => {
    const results = [];
    for (const item of items)
      results.push((await transaction.query(item.text, item.params)).rows);
    return results;
  });

try {
  await db.exec(
    await readFile(
      new URL("../migrations/001_admin_catalog.sql", import.meta.url),
      "utf8",
    ),
  );
  await sql.transaction(importQueries(sql, prepared));
  const actual = await readCatalog(sql);
  const differences = [
    ...compareCatalog(prepared.catalog, actual),
    ...compareLegacyDatasets(prepared.datasets, publicDatasets(actual)),
  ];
  if (differences.length)
    throw new Error(`La comparación falló: ${differences.join(", ")}`);

  const revision = actual.revision;
  let secondImportBlocked = false;
  try {
    await sql.transaction(importQueries(sql, prepared));
  } catch {
    secondImportBlocked = true;
  }
  if (!secondImportBlocked || (await readCatalog(sql)).revision !== revision)
    throw new Error("La protección contra una segunda importación falló.");

  console.log(
    JSON.stringify(
      {
        status: "Importación simulada local completa; sin conexiones externas.",
        matches: true,
        secondImportBlocked,
        snapshotHash,
        products: actual.products.length,
        categories: actual.categories.length,
        images: actual.assets.length,
        campaigns: actual.campaigns.length,
        cakeRecords: actual.cake.length,
      },
      null,
      2,
    ),
  );
} finally {
  await db.close();
}
