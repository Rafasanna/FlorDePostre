import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { localDatabase, request } from "./helpers.js";
import { csvFixtures } from "./fixtures.js";
import { normalizeSnapshot } from "../scripts/catalog-import.js";
import {
  importQueries,
  compareCatalog,
  compareLegacyDatasets,
} from "../scripts/import-plan.js";
import { readCatalog } from "../server/repository.js";
import { createPublicHandler } from "../server/public-handler.js";
test("importación completa y comparación exacta en PostgreSQL local; no reimporta ni cambia parcialmente", async () => {
  const { db, sql } = await localDatabase();
  try {
    const files = csvFixtures();
    files.tortaExtras += "\nretirado,Decoración retirada,-0,No";
    files.tortaExtras = files.tortaExtras.replace(
      "Extra,Precio",
      "Extra,Precio,Disponible",
    );
    const prepared = {
      ...normalizeSnapshot(files),
      manifest: { snapshotHash: "test-hash", version: 1 },
    };
    await sql.transaction(importQueries(sql, prepared));
    const actual = await readCatalog(sql);
    assert.deepEqual(compareCatalog(prepared.catalog, actual), []);
    assert.ok(
      compareCatalog(prepared.catalog, {
        ...actual,
        products: actual.products.map((p, i) =>
          i ? p : { ...p, priceCents: p.priceCents + 1 },
        ),
      }).length,
    );
    const rev = actual.revision;
    await assert.rejects(sql.transaction(importQueries(sql, prepared)));
    assert.equal((await readCatalog(sql)).revision, rev);
    const publicAPI = createPublicHandler({
      env: { CATALOG_SOURCE: "neon", CATALOG_NEON_APPROVED: "true" },
      getDatabase: async () => sql,
    });
    const result = await request(publicAPI, { url: "/api/catalog" });
    assert.equal(result.statusCode, 200);
    assert.deepEqual(
      compareLegacyDatasets(prepared.datasets, result.body.datasets),
      [],
    );
    assert.equal(
      result.body.datasets.tortaExtras.some((e) => e.id === "retirado"),
      false,
    );
    assert.ok(actual.cake.some((e) => e.id === "retirado"));
    assert.equal(result.body.datasets.menuDiario[0].precio, 4500.5);
    assert.equal(result.body.datasets.postresConfig[0].sizeId, "size-18");
    const serialized = JSON.stringify(result.body);
    for (const field of [
      "password_hash",
      "token_hash",
      "source_record",
      "DATABASE_URL",
      "admin_id",
    ])
      assert.ok(!serialized.includes(field));
    await sql`UPDATE pricing_rule_versions SET rules='{}'::jsonb WHERE active`;
    assert.equal(
      (await request(publicAPI, { url: "/api/catalog" })).statusCode,
      503,
    );
  } finally {
    await db.close();
  }
});
test("preparación CLI guarda respaldos idénticos y hashes sin conectar servicios; escritura CLI bloqueada por defecto", async () => {
  const root = await mkdtemp(join(tmpdir(), "flor-admin-import-")),
    input = join(root, "csv"),
    output = join(root, "prepared");
  await mkdir(input);
  for (const [name, csv] of Object.entries(csvFixtures()))
    await writeFile(join(input, `${name}.csv`), csv);
  const p = spawnSync(
    process.execPath,
    ["scripts/prepare-import.mjs", input, output],
    { encoding: "utf8" },
  );
  assert.equal(p.status, 0, p.stderr);
  const manifest = JSON.parse(
    await readFile(join(output, "manifest.json"), "utf8"),
  );
  assert.equal(Object.keys(manifest.files).length, 11);
  assert.equal(
    await readFile(join(output, "backup", "menuDiario.csv"), "utf8"),
    csvFixtures().menuDiario,
  );
  const repeat = spawnSync(
    process.execPath,
    ["scripts/prepare-import.mjs", input, output],
    { encoding: "utf8" },
  );
  assert.notEqual(repeat.status, 0);
  for (const command of ["migrate", "import", "create-admin"]) {
    const blocked = spawnSync(
      process.execPath,
      ["scripts/db-admin.mjs", command, "--execute"],
      {
        encoding: "utf8",
        env: {
          ...process.env,
          ALLOW_DATABASE_WRITES: "",
          DATABASE_URL: "postgresql://never-connect.invalid/test",
        },
      },
    );
    assert.notEqual(blocked.status, 0);
    assert.match(blocked.stderr, /Sin conexión/);
  }
  const wrongTarget = spawnSync(
    process.execPath,
    ["scripts/db-admin.mjs", "migrate", "--execute"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        ALLOW_DATABASE_WRITES: "I_HAVE_APPROVAL",
        DATABASE_URL:
          "postgresql://test:test@ep-invalid.neon.tech/neondb?sslmode=require",
        NEON_TEST_PROJECT: "flor-de-postre-production",
        NEON_TEST_BRANCH: "production",
        NEON_TEST_HOST: "ep-invalid.neon.tech",
        ADMIN_ENABLED: "false",
        ADMIN_WRITES_ENABLED: "false",
        CATALOG_SOURCE: "sheets",
        VITE_CATALOG_SOURCE: "sheets",
        CATALOG_NEON_APPROVED: "false",
      },
    },
  );
  assert.notEqual(wrongTarget.status, 0);
  assert.match(wrongTarget.stderr, /Confirmá el proyecto flor-de-postre-pruebas/);
});
