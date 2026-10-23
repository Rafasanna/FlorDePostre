// Sheets sigue siendo el valor por defecto; ninguna credencial viaja en esta capa.
import * as sheets from "./googleSheets.js";
export const usesNeonCatalog = import.meta.env.VITE_CATALOG_SOURCE === "neon";
let request,
  requestedAt = 0;
async function dataset(key) {
  if (!request || Date.now() - requestedAt > 1000) {
    requestedAt = Date.now();
    request = fetch("/api/catalog", {
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(10000),
    }).then(async (r) => {
      if (!r.ok) throw new Error("Catálogo temporalmente no disponible.");
      const payload = await r.json();
      if (payload.source !== "neon") throw new Error("Fuente inesperada.");
      return payload.datasets;
    });
  }
  const data = (await request)[key];
  if (!Array.isArray(data)) throw new Error("Respuesta de catálogo inválida.");
  return data;
}
const source = (key, fn) => () => (usesNeonCatalog ? dataset(key) : fn());
export const fetchDailyProductsFromSheet = source(
  "menuDiario",
  sheets.fetchDailyProductsFromSheet,
);
export const fetchSinTaccProductsFromSheet = source(
  "sinTacc",
  sheets.fetchSinTaccProductsFromSheet,
);
export const fetchPostresFromSheet = source(
  "postres",
  sheets.fetchPostresFromSheet,
);
export const fetchPostresTamanosFromSheet = source(
  "postresTamanos",
  sheets.fetchPostresTamanosFromSheet,
);
export const fetchPostresConfigFromSheet = source(
  "postresConfig",
  sheets.fetchPostresConfigFromSheet,
);
export const fetchCampaignsFromSheet = source(
  "campaigns",
  sheets.fetchCampaignsFromSheet,
);
export const fetchSpecialProductsFromSheet = source(
  "specialProducts",
  sheets.fetchSpecialProductsFromSheet,
);
export const fetchTortaTamanosFromSheet = source(
  "tortaTamanos",
  sheets.fetchTortaTamanosFromSheet,
);
export const fetchTortaCoberturasFromSheet = source(
  "tortaCoberturas",
  sheets.fetchTortaCoberturasFromSheet,
);
export const fetchTortaRellenosFromSheet = source(
  "tortaRellenos",
  sheets.fetchTortaRellenosFromSheet,
);
export const fetchTortaExtrasFromSheet = source(
  "tortaExtras",
  sheets.fetchTortaExtrasFromSheet,
);
