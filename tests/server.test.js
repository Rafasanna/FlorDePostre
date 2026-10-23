import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { localDatabase, request } from "./helpers.js";
import { createAdminHandler } from "../server/admin-handler.js";
import { createPublicHandler } from "../server/public-handler.js";
import {
  passwordHash,
  verifyPassword,
  sessionCookie,
  hashToken,
  assertConfigured,
  cookieName,
} from "../server/security.js";
import {
  readCatalog,
  saveProduct,
  saveCategory,
} from "../server/repository.js";
import { demoSeed } from "../src/admin/demo.js";
import {
  decodeImage,
  signCloudinary,
  uploadImage,
} from "../server/cloudinary.js";
import { splitSQL } from "../scripts/catalog-import.js";
let db, sql, actor, handler, cookie, csrf;
const env = {
  ADMIN_ENABLED: "true",
  ADMIN_WRITES_ENABLED: "true",
  DATABASE_URL: "local-test-only",
  APP_ORIGIN: "http://localhost:4190",
  SESSION_SECRET: "test-only-secret-".repeat(4),
};
const mutation = { origin: env.APP_ORIGIN, "content-type": "application/json" };
before(async () => {
  ({ db, sql } = await localDatabase());
  actor = randomUUID();
  const hash = await passwordHash("test-password-only-123");
  await sql`INSERT INTO admins(id,email,password_hash) VALUES(${actor},'admin@example.test',${hash})`;
  const c = demoSeed();
  for (const cat of c.categories)
    await saveCategory(
      sql,
      cat,
      (await readCatalog(sql)).revision,
      true,
      actor,
    );
  for (const [i, s] of c.sizes.entries())
    await sql`INSERT INTO postre_sizes(id,name,portions,display_order) VALUES(${s.id},${s.name},${s.portions},${i})`;
  for (const cam of c.campaigns)
    await sql`INSERT INTO campaigns(id,name,data) VALUES(${cam.id},${cam.evento},${JSON.stringify(cam)}::jsonb)`;
  handler = createAdminHandler({ env, getDatabase: async () => sql });
  const response = await request(handler, {
    url: "/api/admin/login",
    method: "POST",
    headers: mutation,
    body: { email: "admin@example.test", password: "test-password-only-123" },
  });
  assert.equal(response.statusCode, 200);
  cookie = response.headers["set-cookie"].split(";")[0];
  csrf = response.body.csrfToken;
});
after(async () => {
  await db?.close();
});
test("migración es SQL PostgreSQL válido y puede ejecutarse otra vez en memoria", async () => {
  const source = await readFile(
    new URL("../migrations/001_admin_catalog.sql", import.meta.url),
    "utf8",
  );
  const statements = splitSQL(source);
  assert.ok(
    statements.some((s) =>
      s.startsWith("CREATE OR REPLACE FUNCTION admin_save_product"),
    ),
  );
  await sql.transaction(statements.map((s) => sql.query(s)));
  const [r] = await sql`SELECT count(*)::int AS count FROM schema_migrations`;
  assert.equal(r.count, 1);
});
test("sin configuración no consulta la base, incluso si se intenta forzar demo en producción", async () => {
  let calls = 0;
  const closed = createAdminHandler({
    env: { ADMIN_DEMO_MODE: "local", NODE_ENV: "production" },
    getDatabase: async () => {
      calls++;
      throw new Error("should not query");
    },
  });
  const r = await request(closed);
  assert.equal(r.statusCode, 503);
  assert.equal(calls, 0);
  assert.equal(
    (
      await request(
        createPublicHandler({
          env: {},
          getDatabase: async () => {
            throw new Error("no");
          },
        }),
        { url: "/api/catalog" },
      )
    ).statusCode,
    503,
  );
});
test("sesión obligatoria en cada endpoint privado; cookie HttpOnly Secure SameSite", async () => {
  for (const url of [
    "/api/admin/catalog",
    "/api/admin/products",
    "/api/admin/categories",
    "/api/admin/images/upload",
  ])
    assert.equal((await request(handler, { url })).statusCode, 401);
  const session = await request(handler, { headers: { cookie }, body: "" });
  assert.equal(session.statusCode, 200);
  assert.equal(session.body.user.email, "admin@example.test");
  assert.equal(session.body.csrfToken, csrf);
  assert.match(session.headers["cache-control"], /no-store/);
  const production = sessionCookie("abc", { NODE_ENV: "production" });
  for (const value of [
    "__Host-fdp_admin=",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
  ])
    assert.ok(production.includes(value));
  assert.ok(!production.includes("Domain="));
  const [r] = await sql`SELECT token_hash FROM admin_sessions LIMIT 1`;
  assert.equal(r.token_hash, hashToken(cookie.split("=")[1]));
  assert.ok(!r.token_hash.includes(cookie.split("=")[1]));
});
test("Vercel local permite origen HTTP de desarrollo; Preview mantiene cookie Secure", () => {
  const local = {
    ADMIN_ENABLED: "true",
    DATABASE_URL: "postgresql://local:local@localhost/test",
    APP_ORIGIN: "http://127.0.0.1:3000",
    SESSION_SECRET: "local-test-secret-32-characters!!",
    NODE_ENV: "production",
    VERCEL: "1",
    VERCEL_ENV: "development",
  };
  assert.doesNotThrow(() => assertConfigured(local));
  assert.equal(cookieName(local), "fdp_admin");
  assert.doesNotMatch(sessionCookie("abc", local), /; Secure/);

  const preview = {
    ...local,
    APP_ORIGIN: "https://flordepostre-preview.vercel.app",
    VERCEL_ENV: "preview",
  };
  assert.doesNotThrow(() => assertConfigured(preview));
  assert.equal(cookieName(preview), "__Host-fdp_admin");
  assert.match(sessionCookie("abc", preview), /; Secure/);
});
test("origen, CSRF, modo solo lectura y revisión se verifican en servidor", async () => {
  const c = await readCatalog(sql),
    p = demoSeed().products[0];
  const action = {
    url: "/api/admin/products",
    method: "POST",
    body: { product: p, revision: c.revision },
  };
  assert.equal(
    (
      await request(handler, {
        ...action,
        headers: { ...mutation, cookie, origin: "https://evil.example" },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (await request(handler, { ...action, headers: { ...mutation, cookie } }))
      .statusCode,
    403,
  );
  const headers = { ...mutation, cookie, "x-csrf-token": csrf };
  assert.equal(
    (
      await request(
        createAdminHandler({
          env: { ...env, ADMIN_WRITES_ENABLED: "false" },
          getDatabase: async () => sql,
        }),
        { ...action, headers },
      )
    ).statusCode,
    503,
  );
  assert.equal(
    (
      await request(handler, {
        ...action,
        headers,
        body: { ...action.body, revision: -2 },
      })
    ).statusCode,
    422,
  );
  assert.equal(
    (
      await request(handler, {
        ...action,
        headers,
        body: { ...action.body, revision: c.revision - 1 },
      })
    ).statusCode,
    409,
  );
});
test("crear, editar, variantes, restricciones y auditoría usan la transacción real local", async () => {
  let c = await readCatalog(sql);
  const source = demoSeed(),
    p = source.products[0],
    postre = source.products.find((x) => x.kind === "postre");
  const headers = { ...mutation, cookie, "x-csrf-token": csrf };
  const initial = await request(handler, {
    url: "/api/admin/products",
    method: "POST",
    headers,
    body: { product: p, revision: c.revision },
  });
  assert.equal(initial.statusCode, 422, "asset no registrado no se acepta");
  for (const img of p.images)
    await sql`INSERT INTO images(id,url) VALUES(${img.id},${img.url})`;
  let r = await request(handler, {
    url: "/api/admin/products",
    method: "POST",
    headers,
    body: { product: p, revision: c.revision },
  });
  assert.equal(r.statusCode, 200, JSON.stringify(r.body));
  c = await readCatalog(sql);
  assert.equal(c.products.find((x) => x.id === p.id).name, p.name);
  r = await request(handler, {
    url: `/api/admin/products/${p.id}`,
    method: "PUT",
    headers,
    body: {
      product: { ...p, active: false, archived: true },
      revision: c.revision,
    },
  });
  assert.equal(r.statusCode, 200);
  c = await readCatalog(sql);
  assert.equal(c.products.find((x) => x.id === p.id).archived, true);
  assert.equal(
    (
      await request(handler, {
        url: "/api/admin/products",
        method: "POST",
        headers,
        body: { product: p, revision: c.revision },
      })
    ).statusCode,
    422,
  );
  assert.equal(
    (
      await request(handler, {
        url: `/api/admin/products/${p.id}`,
        method: "PUT",
        headers,
        body: { product: { ...p, id: "another" }, revision: c.revision },
      })
    ).statusCode,
    422,
  );
  await assert.rejects(
    saveProduct(sql, p, c.revision - 1, false, actor),
    (e) => e.code === "40001",
  );
  await saveProduct(sql, postre, c.revision, true, actor);
  c = await readCatalog(sql);
  assert.deepEqual(
    c.products.find((x) => x.id === postre.id).variants,
    postre.variants,
  );
  const before = c.revision;
  await assert.rejects(
    saveProduct(
      sql,
      { ...postre, variants: [postre.variants[0], postre.variants[0]] },
      before,
      false,
      actor,
    ),
    (e) => e.code === "23505",
  );
  assert.equal((await readCatalog(sql)).revision, before);
  assert.equal(
    (await readCatalog(sql)).products.find((x) => x.id === postre.id).variants
      .length,
    2,
  );
  const [log] =
    await sql`SELECT count(*)::int AS count FROM audit_log WHERE action LIKE 'product.%'`;
  assert.ok(log.count >= 3);
});
test("Cloudinary valida contenido, firma en servidor y falla cerrado sin credenciales", async () => {
  const png =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6eLkAAAAASUVORK5CYII=";
  assert.equal(decodeImage(png).mime, "image/png");
  assert.throws(() => decodeImage("data:image/png;base64,aGVsbG8="));
  assert.throws(() => decodeImage("data:image/svg+xml;base64,PHN2Zz4="));
  assert.equal(
    signCloudinary({ timestamp: 1, public_id: "test" }, "secret"),
    signCloudinary({ public_id: "test", timestamp: 1 }, "secret"),
  );
  let calls = 0;
  await assert.rejects(
    uploadImage(sql, {}, png, actor, async () => {
      calls++;
    }),
  );
  assert.equal(calls, 0);
  const cloudEnv = {
    CLOUDINARY_CLOUD_NAME: "test-cloud",
    CLOUDINARY_API_KEY: "fake-public-key",
    CLOUDINARY_API_SECRET: "fake-private-secret",
    CLOUDINARY_UPLOAD_PRESET: "test-preset",
  };
  const uploaded = await uploadImage(
    sql,
    cloudEnv,
    png,
    actor,
    async (url, options) => {
      assert.equal(
        url,
        "https://api.cloudinary.com/v1_1/test-cloud/image/upload",
      );
      assert.equal(options.body.get("overwrite"), "false");
      assert.ok(options.body.get("signature"));
      assert.equal(options.body.get("api_key"), "fake-public-key");
      const public_id = options.body.get("public_id");
      return {
        ok: true,
        json: async () => ({
          public_id,
          secure_url: `https://res.cloudinary.com/test-cloud/image/upload/${public_id}.png`,
          format: "png",
          width: 1,
          height: 1,
          bytes: 68,
        }),
      };
    },
  );
  assert.ok(uploaded.publicId.startsWith("flor-de-postre/catalog/"));
  assert.ok(!JSON.stringify(uploaded).includes("fake-private-secret"));
});
test("login limita intentos con almacenamiento persistente y no revela existencia de cuenta", async () => {
  let last;
  for (let i = 0; i < 6; i++)
    last = await request(handler, {
      url: "/api/admin/login",
      method: "POST",
      headers: mutation,
      body: { email: "unknown@example.test", password: "a-wrong-password" },
    });
  assert.equal(last.statusCode, 429);
  assert.equal(last.headers["retry-after"], "900");
  assert.equal(
    await verifyPassword("wrong", await passwordHash("right-password")),
    false,
  );
});
test("logout revoca la sesión y limpia la cookie", async () => {
  const r = await request(handler, {
    url: "/api/admin/logout",
    method: "POST",
    headers: { ...mutation, cookie, "x-csrf-token": csrf },
    body: {},
  });
  assert.equal(r.statusCode, 200);
  assert.match(r.headers["set-cookie"], /Max-Age=0/);
  assert.equal(
    (await request(handler, { headers: { cookie } })).statusCode,
    401,
  );
});
