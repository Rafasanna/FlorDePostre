import test from "node:test";
import assert from "node:assert/strict";
import {
  checkTestConnection,
  validateTestTarget,
} from "../server/neon-test-check.js";
const env = {
  DATABASE_URL:
    "postgresql://test:fake@ep-test-123-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
  NEON_TEST_PROJECT: "flor-de-postre-pruebas",
  NEON_TEST_BRANCH: "production",
  NEON_TEST_HOST: "ep-test-123-pooler.us-east-1.aws.neon.tech",
  ADMIN_ENABLED: "false",
  ADMIN_WRITES_ENABLED: "false",
  VITE_CATALOG_SOURCE: "sheets",
  CATALOG_SOURCE: "sheets",
  CATALOG_NEON_APPROVED: "false",
};
test("diagnóstico Neon bloquea conexión sin autorización, destino confirmado, TLS o aislamiento", async () => {
  let connections = 0;
  const getDatabase = async () => {
    connections++;
    throw new Error("No debe conectarse");
  };
  await assert.rejects(checkTestConnection(env, getDatabase));
  for (const bad of [
    { NEON_TEST_PROJECT: "flor-de-postre-real" },
    { NEON_TEST_PROJECT: undefined },
    { NEON_TEST_BRANCH: "admin-test" },
    { NEON_TEST_HOST: "ep-other-456.us-east-1.aws.neon.tech" },
    { DATABASE_URL: env.DATABASE_URL.replace("?sslmode=require", "") },
    { ADMIN_ENABLED: "true" },
    { ADMIN_WRITES_ENABLED: "true" },
    { CATALOG_SOURCE: "neon" },
    { VITE_CATALOG_SOURCE: "neon" },
    { CATALOG_NEON_APPROVED: "true" },
    { VERCEL: "1" },
  ])
    await assert.rejects(
      checkTestConnection({ ...env, ...bad }, getDatabase, true),
    );
  assert.equal(connections, 0);
  assert.doesNotThrow(() => validateTestTarget(env));
});
test("diagnóstico solo solicita SELECT en transacción readOnly y nunca devuelve credenciales", async () => {
  const sql = (parts) => ({ statement: parts.join("") });
  sql.transaction = async (queries, options) => {
    assert.equal(options.readOnly, true);
    assert.match(queries[0].statement, /^SELECT/);
    assert.ok(
      !/INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TRUNCATE/i.test(
        queries[0].statement,
      ),
    );
    return [[{ connected: 1, read_only: "on", public_tables: 0 }]];
  };
  const result = await checkTestConnection(env, async () => sql, true);
  assert.deepEqual(result, {
    connected: true,
    readOnly: true,
    publicTables: 0,
    schemaEmpty: true,
  });
  assert.ok(!JSON.stringify(result).includes("fake"));
  sql.transaction = async () => [
    [{ connected: 1, read_only: "off", public_tables: 0 }],
  ];
  await assert.rejects(checkTestConnection(env, async () => sql, true));
});
