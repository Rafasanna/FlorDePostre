import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { localDatabase, request } from "./helpers.js";
import { demoSeed } from "../src/admin/demo.js";
import { pricingRules } from "../scripts/catalog-import.js";
import { readCatalog, saveSettings } from "../server/repository.js";
import { validateSettings } from "../shared/settings.js";
import { createPublicHandler } from "../server/public-handler.js";
import { createAdminHandler } from "../server/admin-handler.js";
import { passwordHash } from "../server/security.js";
import { getCakeExtraPrice } from "../src/data/tortasData.js";

test("configuración editable guarda tortas, tamaños y banners con revisión; API pública usa la nueva matriz", async () => {
  const { db, sql } = await localDatabase();
  try {
    const actor = randomUUID();
    const password = "settings-password-only-123";
    await sql`INSERT INTO admins(id,email,password_hash) VALUES(${actor},'settings@example.test',${await passwordHash(password)})`;
    const seed = demoSeed();
    for (const size of seed.sizes)
      await sql`INSERT INTO postre_sizes(id,name,portions,active,display_order) VALUES(${size.id},${size.name},${size.portions},${size.active},0)`;
    for (const item of seed.cake)
      await sql`INSERT INTO cake_datasets(dataset,id,data) VALUES(${item.dataset},${item.id},${JSON.stringify({ ...item.data, disponible: true })}::jsonb)`;
    const campaign = { id: "fiesta", evento: "Fiesta", titulo: "Fiesta", bannerText: "Antes", descripcion: "Antes", decoracion: "🎂", notas: "", active: false, activa: false, fechaInicio: null, fechaFin: null, colors: { fondo: "#ffeeee", texto: "#332222", acento: "#bb6666", badge: "#ffffff" } };
    await sql`INSERT INTO campaigns(id,name,data) VALUES('fiesta','Fiesta',${JSON.stringify(campaign)}::jsonb)`;
    await sql`INSERT INTO pricing_rule_versions(id,rules,active) VALUES('legacy-v1',${JSON.stringify(pricingRules)}::jsonb,true)`;
    const catalog = await readCatalog(sql);
    const settings = {
      sizes: catalog.sizes,
      cake: Object.fromEntries(["tortaTamanos", "tortaCoberturas", "tortaRellenos", "tortaExtras"].map((key) => [key, catalog.cake.filter((item) => item.dataset === key).map((item) => item.data)])),
      campaigns: catalog.campaigns,
      rules: structuredClone(catalog.rules),
    };
    settings.cake.tortaRellenos.find((item) => item.id === "nutella").precioExtra = 5000;
    settings.cake.tortaExtras.find((item) => item.id === "extra-imprimible").precioExtra = 6000;
    settings.rules.extraRules.find((item) => item.id === "extra-imprimible").rule.amount = 6000;
    settings.campaigns[0].bannerText = "Banner nuevo";
    settings.rules.cakePriceOptions.find((item) => item.id === "buttercream-2-rellenos").sizes.find((item) => item.nombre === "18 cm").price = 60000;
    const validated = validateSettings(settings, catalog);
    const env = { ADMIN_ENABLED: "true", ADMIN_WRITES_ENABLED: "true", DATABASE_URL: "local-test-only", APP_ORIGIN: "http://localhost:4190", SESSION_SECRET: "test-only-secret-".repeat(4) };
    const handler = createAdminHandler({ env, getDatabase: async () => sql });
    const login = await request(handler, { url: "/api/admin/login", method: "POST", headers: { origin: env.APP_ORIGIN, "content-type": "application/json" }, body: { email: "settings@example.test", password } });
    assert.equal(login.statusCode, 200);
    const saved = await request(handler, { url: "/api/admin/settings", method: "PUT", headers: { origin: env.APP_ORIGIN, "content-type": "application/json", cookie: login.headers["set-cookie"].split(";")[0], "x-csrf-token": login.body.csrfToken }, body: { settings, revision: catalog.revision } });
    assert.equal(saved.statusCode, 200, JSON.stringify(saved.body));
    assert.equal(saved.body.revision, catalog.revision + 1);
    await assert.rejects(saveSettings(sql, validated, catalog.revision, actor), /Catalog revision conflict/);
    const updated = await readCatalog(sql);
    assert.equal(updated.cake.find((item) => item.id === "nutella").data.precioExtra, 5000);
    assert.equal(updated.campaigns[0].bannerText, "Banner nuevo");
    assert.equal(updated.rules.cakePriceOptions.find((item) => item.id === "buttercream-2-rellenos").sizes[0].price, 60000);
    const publicResponse = await request(createPublicHandler({ env: { CATALOG_SOURCE: "neon", CATALOG_NEON_APPROVED: "true" }, getDatabase: async () => sql }), { url: "/api/catalog" });
    assert.equal(publicResponse.statusCode, 200);
    assert.equal(publicResponse.body.datasets.cakeRules.cakePriceOptions.find((item) => item.id === "buttercream-2-rellenos").sizes[0].price, 60000);
    assert.equal(getCakeExtraPrice({ id: "extra-imprimible", precioExtra: 100 }, 60000, publicResponse.body.datasets.cakeRules.extraRules), 6000);
    assert.equal(publicResponse.body.datasets.campaigns[0].bannerText, "Banner nuevo");
  } finally { await db.close(); }
});
