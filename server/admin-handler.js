import { database } from "./db.js";
import {
  assertConfigured,
  assertOrigin,
  fail,
  requireSession,
  login,
  sessionCookie,
  hashToken,
} from "./security.js";
import { readCatalog, saveProduct, saveCategory } from "./repository.js";
import {
  validateProduct,
  validateCategory,
  ValidationError,
} from "../shared/catalog.js";
import { uploadImage } from "./cloudinary.js";
export function createAdminHandler({
  env = process.env,
  getDatabase = database,
  read = readCatalog,
  save = saveProduct,
  saveCat = saveCategory,
  upload = uploadImage,
} = {}) {
  return async function handler(req, res) {
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    try {
      assertConfigured(env); // Ni una consulta ni escritura si no está habilitado explícitamente.
      const url = new URL(req.url, "http://localhost"),
        route =
          url.searchParams.get("route") ||
          url.pathname.replace(/^\/api\/admin\/?/, "").replace(/\/$/, "");
      const mutation = !["GET", "HEAD"].includes(req.method);
      if (mutation) assertOrigin(req, env);
      let body = req.body;
      if (typeof body === "string") {
        if (Buffer.byteLength(body) > 3000000)
          fail(413, "El archivo es demasiado grande.");
        try {
          body = body.trim() ? JSON.parse(body) : {};
        } catch {
          fail(400, "JSON inválido.");
        }
      }
      body = body || {};
      const sql = await getDatabase(env);
      if (route === "login" && req.method === "POST") {
        const s = await login(req, sql, env, body);
        res.setHeader("Set-Cookie", sessionCookie(s.token, env));
        return res
          .status(200)
          .json({ user: { email: s.email }, csrfToken: s.csrfToken });
      }
      const session = await requireSession(req, sql, env, mutation);
      if (route === "session" && req.method === "GET")
        return res.status(200).json({
          user: { email: session.email },
          csrfToken: session.csrfToken,
          writesEnabled: env.ADMIN_WRITES_ENABLED === "true",
        });
      if (route === "logout" && req.method === "POST") {
        await sql.transaction([
          sql`DELETE FROM admin_sessions WHERE token_hash=${hashToken(session.token)}`,
          sql`INSERT INTO audit_log(admin_id,action) VALUES(${session.id},'auth.logout')`,
        ]);
        res.setHeader("Set-Cookie", sessionCookie("", env, 0));
        return res.status(200).json({ ok: true });
      }
      if (route === "catalog" && req.method === "GET")
        return res.status(200).json(await read(sql));
      if (mutation && env.ADMIN_WRITES_ENABLED !== "true")
        fail(503, "Las modificaciones reales todavía no están habilitadas.");
      if (route === "images/upload" && req.method === "POST")
        return res
          .status(201)
          .json(await upload(sql, env, body.file, session.id));
      const match = route.match(
        /^(products|categories)(?:\/([a-zA-Z0-9._-]+))?$/,
      );
      if (!match || !["POST", "PUT"].includes(req.method))
        fail(404, "No encontramos esa operación.");
      const creating = req.method === "POST";
      if (creating ? Boolean(match[2]) : !match[2])
        fail(405, "Método no permitido.");
      if (!Number.isSafeInteger(body.revision) || body.revision < 0)
        fail(422, "Falta la revisión del catálogo.");
      const catalog = await read(sql);
      if (catalog.revision !== body.revision)
        fail(
          409,
          "El catálogo cambió en otra sesión. Recargá antes de guardar.",
        );
      let revision;
      if (match[1] === "products") {
        const existing = creating
          ? null
          : catalog.products.find((p) => p.id === match[2]);
        if (!creating && !existing) fail(404, "Producto no encontrado.");
        const product = validateProduct(body.product, catalog, { existing });
        // Solo assets ya registrados por upload o por importación, no metadatos inventados.
        for (const img of product.images) {
          const [asset] =
            await sql`SELECT id FROM images WHERE id=${img.id} AND url=${img.url} AND public_id IS NOT DISTINCT FROM ${img.publicId}`;
          if (!asset)
            fail(422, "Subí o elegí una imagen registrada antes de guardar.");
        }
        revision = await save(
          sql,
          product,
          body.revision,
          creating,
          session.id,
        );
      } else {
        if (!creating && body.category?.id !== match[2])
          fail(422, "El ID de categoría no puede cambiar.");
        if (!creating && !catalog.categories.some((c) => c.id === match[2]))
          fail(404, "Categoría no encontrada.");
        if (
          creating &&
          catalog.categories.some((c) => c.id === body.category?.id)
        )
          fail(409, "El ID de categoría ya existe.");
        const category = validateCategory(body.category, catalog.categories);
        if (
          !category.active &&
          catalog.products.some(
            (p) =>
              (p.categoryId === category.id ||
                catalog.categories.some(
                  (c) => c.id === p.categoryId && c.parentId === category.id,
                )) &&
              p.active &&
              !p.archived,
          )
        )
          fail(
            422,
            "Desactivá o reasigná los productos activos de esta categoría primero.",
          );
        revision = await saveCat(
          sql,
          category,
          body.revision,
          creating,
          session.id,
        );
      }
      return res.status(200).json({ ok: true, revision });
    } catch (error) {
      const code = error.code;
      const status =
        error.status ||
        (["23505", "40001"].includes(code)
          ? 409
          : ["23503", "23514", "23502", "22003", "22007"].includes(code)
            ? 422
            : 500);
      const message = error.status
        ? error.message
        : status === 409
          ? "El catálogo cambió o ese ID ya existe. Recargá antes de guardar."
          : status === 422
            ? "Los datos no cumplen las reglas del catálogo."
            : "No pudimos completar la operación.";
      if (status === 429) res.setHeader("Retry-After", "900");
      if (status >= 500)
        console.error(
          JSON.stringify({
            event: "admin.error",
            status,
            code: code || "unavailable",
          }),
        );
      return res.status(status).json({
        error: message,
        ...(error instanceof ValidationError ? { fields: error.errors } : {}),
      });
    }
  };
}
