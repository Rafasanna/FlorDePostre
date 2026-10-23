import { randomUUID } from "node:crypto";
import { publicDatasets } from "../shared/public-catalog.js";
import { definitions } from "./catalog-import.js";
export function importQueries(sql, prepared) {
  const c = prepared.catalog,
    snapshotHash = prepared.manifest.snapshotHash;
  const queries = [
    sql`LOCK TABLE products,categories,postre_sizes,campaigns,cake_datasets,catalog_state IN EXCLUSIVE MODE`,
    sql`DO $$ BEGIN IF EXISTS(SELECT 1 FROM products) OR EXISTS(SELECT 1 FROM categories) OR EXISTS(SELECT 1 FROM import_runs) THEN RAISE EXCEPTION 'Import requires an empty target'; END IF; END $$`,
  ];
  for (const cat of c.categories)
    queries.push(
      sql`INSERT INTO categories(id,name,parent_id,display_order,active) VALUES(${cat.id},${cat.name},${cat.parentId},${cat.order},${cat.active})`,
    );
  for (const [i, size] of c.sizes.entries())
    queries.push(
      sql`INSERT INTO postre_sizes(id,name,portions,active,estimated_price_cents,notes,display_order) VALUES(${size.id},${size.name},${size.portions},${size.active},${size.estimatedPriceCents},${size.notes},${i})`,
    );
  for (const [i, cam] of c.campaigns.entries())
    queries.push(
      sql`INSERT INTO campaigns(id,name,data,display_order) VALUES(${cam.id},${cam.evento},${JSON.stringify(cam)}::jsonb,${i})`,
    );
  const images = new Map(
    c.products.flatMap((p) => p.images).map((i) => [i.id, i]),
  );
  for (const img of images.values())
    queries.push(
      sql`INSERT INTO images(id,public_id,url) VALUES(${img.id},${img.publicId},${img.url})`,
    );
  for (const [i, p] of c.products.entries()) {
    queries.push(
      sql`SELECT admin_save_product(${JSON.stringify(p)}::jsonb,${i},true,null)`,
    );
    queries.push(
      sql`UPDATE products SET source_record=${JSON.stringify(p.sourceRecord)}::jsonb WHERE id=${p.id}`,
    );
  }
  for (const [i, d] of c.cake.entries())
    queries.push(
      sql`INSERT INTO cake_datasets(dataset,id,data,display_order) VALUES(${d.dataset},${d.id},${JSON.stringify(d.data)}::jsonb,${i})`,
    );
  queries.push(
    sql`INSERT INTO pricing_rule_versions(id,rules,active) VALUES('legacy-v1',${JSON.stringify(c.rules)}::jsonb,true)`,
  );
  queries.push(
    sql`INSERT INTO import_runs(id,snapshot_hash,manifest) VALUES(${randomUUID()},${snapshotHash},${JSON.stringify(prepared.manifest)}::jsonb)`,
  );

  return queries;
}

export function compareCatalog(expected, actual) {
  const stable = (o) =>
    JSON.stringify(o, (_k, v) =>
      v && !Array.isArray(v) && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
          )
        : v,
    );
  const expectedData = publicDatasets(expected),
    actualData = publicDatasets(actual);
  const differences = Object.keys(definitions).filter(
    (key) => stable(expectedData[key]) !== stable(actualData[key]),
  );
  const privateCompare = (c) => ({
    ...c,
    revision: 0,
    assets: undefined,
    products: c.products.map((p) => ({ ...p, sourceRecord: undefined })),
    cake: c.cake.map((d) => ({ dataset: d.dataset, id: d.id, data: d.data })),
  });
  if (stable(privateCompare(expected)) !== stable(privateCompare(actual)))
    differences.push("modelo privado (estados, orden, relaciones o reglas)");

  return differences;
}

// Compara también contra los normalizados originales, sin derivarlos del nuevo modelo.
export function compareLegacyDatasets(original, actual) {
  const filtered = new Set([
    "postresTamanos",
    "postresConfig",
    "tortaTamanos",
    "tortaCoberturas",
    "tortaRellenos",
    "tortaExtras",
  ]);
  const stable = (value) =>
    JSON.stringify(value, (_key, v) =>
      v && !Array.isArray(v) && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
          )
        : v,
    );
  const differences = [];
  for (const key of Object.keys(definitions)) {
    let expected = filtered.has(key)
      ? original[key].filter((r) => r.disponible !== false)
      : original[key];
    let values = actual[key] || [];
    if (key === "postresConfig") {
      const byRelation = (a, b) =>
        `${a.postreId}:${a.sizeId}`.localeCompare(
          `${b.postreId}:${b.sizeId}`,
          "es",
        );
      expected = [...expected].sort(byRelation);
      values = [...values].sort(byRelation);
    }
    if (
      expected.length !== values.length ||
      expected.some((row, i) =>
        Object.entries(row).some(
          ([field, value]) => stable(value) !== stable(values[i]?.[field]),
        ),
      )
    )
      differences.push(`origen Sheets: ${key}`);
  }
  return differences;
}
