import { database } from "./db.js";
import { readCatalog } from "./repository.js";
import { publicDatasets } from "../shared/public-catalog.js";
import {
  cakePriceOptions,
  getCakeExtraRule,
  tortaExtras,
} from "../src/data/tortasData.js";
export function createPublicHandler({
  env = process.env,
  getDatabase = database,
  read = readCatalog,
} = {}) {
  return async function (req, res) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "GET")
      return res.status(405).json({ error: "Método no permitido." });
    if (env.CATALOG_SOURCE !== "neon" || env.CATALOG_NEON_APPROVED !== "true")
      return res
        .status(503)
        .json({ error: "La fuente Neon todavía no está habilitada." });
    try {
      const catalog = await read(await getDatabase(env));
      const expected = {
        version: 1,
        cakePriceOptions,
        extraRules: tortaExtras.map((e) => ({
          id: e.id,
          rule: getCakeExtraRule(e),
        })),
      };
      // La matriz que usa el carrito sigue versionada con el código; no aceptar drift silencioso.
      const stable = (o) =>
        JSON.stringify(o, (_k, v) =>
          v && !Array.isArray(v) && typeof v === "object"
            ? Object.fromEntries(
                Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
              )
            : v,
        );
      if (stable(catalog.rules) !== stable(expected))
        throw new Error("Pricing rules differ");
      return res.status(200).json({
        source: "neon",
        revision: catalog.revision,
        datasets: publicDatasets(catalog),
      });
    } catch {
      return res.status(503).json({
        error:
          "El catálogo no está disponible. Volvé a intentar en unos instantes.",
      });
    }
  };
}
