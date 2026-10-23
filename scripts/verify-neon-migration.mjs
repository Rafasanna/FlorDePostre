import { database } from "../server/db.js";
import { validateTestTarget } from "../server/neon-test-check.js";

try {
  const expectImported = process.argv.includes("--expect-imported");
  validateTestTarget(process.env);
  const sql = await database(process.env);
  const [[result]] = await sql.transaction(
    [
      sql`SELECT
        current_setting('transaction_read_only') AS read_only,
        ARRAY(SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname='public' ORDER BY tablename) AS tables,
        (SELECT count(*)::integer FROM pg_catalog.pg_tables WHERE schemaname='public') AS public_tables,
        (SELECT count(*)::integer FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND c.contype='f') AS foreign_key_count,
        (SELECT count(*)::integer FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND c.contype='f' AND NOT c.convalidated) AS unvalidated_foreign_keys,
        (SELECT COALESCE(json_agg(json_build_object('name',c.conname,'from',c.conrelid::regclass::text,'to',c.confrelid::regclass::text,'validated',c.convalidated) ORDER BY c.conname),'[]'::json) FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' AND c.contype='f') AS foreign_keys,
        (SELECT count(*)::integer FROM pg_catalog.pg_index i JOIN pg_catalog.pg_class t ON t.oid=i.indrelid JOIN pg_catalog.pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND NOT i.indisvalid) AS invalid_indexes,
        (SELECT count(*)::integer FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname = ANY(ARRAY['check_category_depth','admin_save_product','admin_save_category']::text[])) AS function_count,
        (SELECT count(*)::integer FROM pg_catalog.pg_trigger t JOIN pg_catalog.pg_class c ON c.oid=t.tgrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND t.tgname='categories_depth' AND NOT t.tgisinternal) AS category_trigger_count,
        (SELECT count(*)::integer FROM schema_migrations WHERE version='001_admin_catalog') AS migration_record_count,
        (SELECT revision FROM catalog_state WHERE id=1) AS catalog_revision,
        (SELECT count(*)::integer FROM admins) AS admin_count,
        (SELECT count(*)::integer FROM products) AS product_count,
        (SELECT count(*)::integer FROM categories) AS category_count,
        (SELECT count(*)::integer FROM campaigns) AS campaign_count,
        (SELECT count(*)::integer FROM images) AS image_count,
        (SELECT count(*)::integer FROM product_variants) AS variant_count,
        (SELECT count(*)::integer FROM postre_sizes) AS size_count,
        (SELECT count(*)::integer FROM cake_datasets) AS cake_count,
        (SELECT count(*)::integer FROM pricing_rule_versions) AS pricing_rule_count,
        (SELECT count(*)::integer FROM import_runs) AS import_count,
        (SELECT snapshot_hash FROM import_runs ORDER BY created_at DESC LIMIT 1) AS snapshot_hash`,
    ],
    { readOnly: true, fetchOptions: { signal: AbortSignal.timeout(15000) } },
  );

  const expectedTables = [
    "admin_sessions",
    "admins",
    "audit_log",
    "campaigns",
    "categories",
    "cake_datasets",
    "catalog_state",
    "images",
    "import_runs",
    "login_limits",
    "postre_sizes",
    "pricing_rule_versions",
    "product_images",
    "product_variants",
    "products",
    "schema_migrations",
  ].sort();
  const actualTables = Array.isArray(result.tables)
    ? result.tables
    : String(result.tables)
        .replace(/^\{|\}$/g, "")
        .split(",");
  const checks = {
    readOnly: result.read_only === "on",
    expectedTables:
      JSON.stringify([...actualTables].sort()) ===
      JSON.stringify(expectedTables),
    publicTables: result.public_tables === expectedTables.length,
    foreignKeys: result.foreign_key_count === 9,
    allForeignKeysValidated: result.unvalidated_foreign_keys === 0,
    indexesValid: result.invalid_indexes === 0,
    functions: result.function_count === 3,
    categoryTrigger: result.category_trigger_count === 1,
    migrationRecorded: result.migration_record_count === 1,
    oneAdmin: result.admin_count === 1,
    ...(expectImported
      ? {
          catalogRevision: result.catalog_revision === 101,
          productsImported: result.product_count === 101,
          categoriesImported: result.category_count === 12,
          campaignsImported: result.campaign_count === 13,
          imagesImported: result.image_count === 100,
          variantsImported: result.variant_count === 54,
          sizesImported: result.size_count === 4,
          cakeRecordsImported: result.cake_count === 27,
          pricingRulesImported: result.pricing_rule_count === 1,
          oneImportRun: result.import_count === 1,
          snapshotRecorded:
            result.snapshot_hash ===
            "578df429dd618f0eb81787ebc2e155cf0e301431d874ba42007f892d0d46bb1b",
        }
      : {
          initialCatalogState: result.catalog_revision === 0,
          noProductsImported: result.product_count === 0,
          noCategoriesImported: result.category_count === 0,
          noCampaignsImported: result.campaign_count === 0,
          noImportRuns: result.import_count === 0,
        }),
  };
  console.log(
    JSON.stringify(
      {
        project: process.env.NEON_TEST_PROJECT,
        branch: process.env.NEON_TEST_BRANCH,
        database: new URL(process.env.DATABASE_URL).pathname.slice(1),
        checks,
        tables: actualTables,
        foreignKeys: result.foreign_keys,
      },
      null,
      2,
    ),
  );
  if (Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
} catch {
  console.error(
    "No se pudo verificar el esquema. No se muestran errores de conexión ni credenciales.",
  );
  process.exitCode = 1;
}
