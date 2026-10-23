import { createHash } from "node:crypto";
import * as sheets from "../src/services/googleSheets.js";
import { imageURLAllowed, slug, validateProduct } from "../shared/catalog.js";
import {
  cakePriceOptions,
  tortaExtras,
  getCakeExtraRule,
} from "../src/data/tortasData.js";
export const pricingRules = {
  version: 1,
  cakePriceOptions,
  extraRules: tortaExtras.map((e) => ({ id: e.id, rule: getCakeExtraRule(e) })),
};
export const definitions = {
  menuDiario: [
    "normalizeDailyProduct",
    ["ID interno (no tocar)", "Categoría", "Producto", "Descripción", "Precio"],
  ],
  sinTacc: [
    "normalizeSinTaccProduct",
    ["ID interno (no tocar)", "Producto", "Descripción", "Precio"],
  ],
  postres: [
    "normalizePostre",
    ["ID interno (no tocar)", "Postre", "Descripción"],
  ],
  postresTamanos: [
    "normalizePostreTamano",
    ["ID interno (no tocar)", "Tamaño", "Porciones"],
  ],
  postresConfig: [
    "normalizePostreConfig",
    ["ID postre", "ID Tamaño", "Precio"],
  ],
  campaigns: [
    "normalizeCampaign",
    [
      "Activa",
      "Evento",
      "Fecha inicio",
      "Fecha fin",
      "Banner / texto corto",
      "Título visible",
    ],
  ],
  specialProducts: [
    "normalizeSpecialProduct",
    [
      "Activo",
      "Evento",
      "ID interno (no tocar)",
      "Producto",
      "Descripción",
      "Precio",
    ],
  ],
  tortaTamanos: [
    "normalizeTortaTamano",
    ["ID interno (no tocar)", "Tamaño", "Porciones"],
  ],
  tortaCoberturas: ["normalizeTortaCobertura", ["ID interno (no tocar)"]],
  tortaRellenos: ["normalizeTortaRelleno", ["ID interno (no tocar)"]],
  tortaExtras: ["normalizeTortaExtra", ["ID interno (no tocar)"]],
};
const toCents = (value) => {
  if (
    !Number.isFinite(value) ||
    Math.abs(value * 100 - Math.round(value * 100)) > 0.000001
  )
    throw new Error(
      "Precio no representable en centavos: no se redondea durante la migración.",
    );
  return Math.round(value * 100);
};
const key = (v) =>
  String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
function unique(items, getId, context) {
  const seen = new Set();
  for (const item of items) {
    const id = getId(item);
    if (seen.has(id))
      throw new Error(`${context}: ID o relación duplicada: ${id}`);
    seen.add(id);
  }
}
export function normalizeSnapshot(files) {
  const datasets = {},
    omissions = [];
  for (const [dataset, [normalizer, headers]] of Object.entries(definitions)) {
    if (typeof files[dataset] !== "string")
      throw new Error(`Falta el respaldo ${dataset}.csv`);
    if ((files[dataset].match(/"/g) || []).length % 2)
      throw new Error(`${dataset}: CSV con comillas incompletas.`);
    const rows = sheets.parseCsv(files[dataset]);
    if (
      !rows.some((row) => headers.every((h) => row.map(key).includes(key(h))))
    )
      throw new Error(`${dataset}: faltan cabeceras obligatorias.`);
    const objects = sheets.csvToObjects(files[dataset], headers.map(key));
    datasets[dataset] = objects.flatMap((row, index) => {
      const item = sheets[normalizer](row);
      if (!item) {
        const value = Object.entries(row).find(
            ([field]) => key(field) === "disponible",
          )?.[1],
          unavailable = new Set([
            "false",
            "no",
            "0",
            "agotado",
            "no disponible",
            "reservado",
          ]).has(
            String(value || "")
              .trim()
              .toLowerCase(),
          ),
          postreId = Object.entries(row).find(
            ([field]) => key(field) === "idpostre",
          )?.[1],
          sizeId = Object.entries(row).find(
            ([field]) => key(field) === "idtamano",
          )?.[1],
          price = Object.entries(row).find(
            ([field]) => key(field) === "precio",
          )?.[1];
        if (
          dataset === "postresConfig" &&
          unavailable &&
          postreId &&
          sizeId &&
          !price
        ) {
          omissions.push({
            dataset,
            row: index + 1,
            reason: "unavailable-without-price",
            postreId,
            sizeId,
          });
          return [];
        }
        const activeValue = Object.entries(row).find(
            ([field]) => key(field) === "activo",
          )?.[1],
          inactive = new Set(["false", "no", "0"]).has(
            String(activeValue || "")
              .trim()
              .toLowerCase(),
          ),
          productId = Object.entries(row).find(
            ([field]) => key(field) === "idinternonotocar",
          )?.[1],
          event = Object.entries(row).find(
            ([field]) => key(field) === "evento",
          )?.[1];
        if (dataset === "specialProducts" && inactive && !price) {
          omissions.push({
            dataset,
            row: index + 1,
            reason: productId
              ? "inactive-product-without-price"
              : "inactive-placeholder",
            productId: productId || null,
            event: event || null,
          });
          return [];
        }
        throw new Error(
          `${dataset}: fila ${index + 1} no válida; no se descarta silenciosamente.`,
        );
      }
      if (
        !["postresConfig", "campaigns"].includes(dataset) &&
        !Object.entries(row).some(
          ([k, v]) => key(k) === "idinternonotocar" && v,
        )
      )
        throw new Error(`${dataset}: fila ${index + 1} sin ID explícito.`);
      return [item];
    });
    for (const item of datasets[dataset]) {
      for (const field of [
        "precio",
        "precioExtra",
        "precioBaseEstimado",
        "precioEstimado",
      ]) {
        if (item[field] !== null && item[field] !== undefined) {
          const amount = toCents(item[field]);
          if (amount < 0 || amount > 10000000000)
            throw new Error(
              `${dataset}/${item.id || item.postreId}: importe inválido en ${field}.`,
            );
          if (
            dataset === "postresTamanos" &&
            field === "precioEstimado" &&
            amount === 0
          )
            throw new Error(
              `${dataset}/${item.id}: precio estimado debe ser positivo o vacío.`,
            );
        }
      }
      for (const field of ["fechaInicio", "fechaFin"])
        if (item[field]) {
          const value = item[field];
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            !Number.isFinite(Date.parse(value)) ||
            new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value
          )
            throw new Error(
              `${dataset}/${item.id}: fecha inválida en ${field}.`,
            );
        }
      if (item.fechaInicio && item.fechaFin && item.fechaInicio > item.fechaFin)
        throw new Error(`${dataset}/${item.id}: rango de fechas inválido.`);
    }
    unique(
      datasets[dataset],
      (x) => (dataset === "postresConfig" ? `${x.postreId}:${x.sizeId}` : x.id),
      dataset,
    );
  }
  const categoryNames = [
    ...new Set([
      ...datasets.menuDiario.map((p) => p.categoria),
      "Sin TACC",
      "Postres",
      "Especial",
    ]),
  ];
  const categories = categoryNames.map((name, order) => ({
    id: slug(name),
    name,
    parentId: null,
    active: true,
    order,
  }));
  unique(categories, (c) => c.id, "categorías");
  const sizes = datasets.postresTamanos.map((s) => ({
    id: s.id,
    name: s.nombre,
    portions: s.porciones,
    active: s.disponible,
    estimatedPriceCents:
      s.precioEstimado === null ? null : toCents(s.precioEstimado),
    notes: s.notas,
  }));
  for (const c of datasets.postresConfig)
    if (
      !datasets.postres.some((p) => p.id === c.postreId) ||
      !sizes.some((s) => s.id === c.sizeId)
    )
      throw new Error(`Variante huérfana: ${c.postreId}/${c.sizeId}`);
  const products = [];
  const sourceProducts = [
    ["menuDiario", "daily"],
    ["sinTacc", "sin_tacc"],
    ["postres", "postre"],
    ["specialProducts", "special"],
  ];
  const publicIdCounts = new Map();
  for (const [dataset] of sourceProducts)
    for (const product of datasets[dataset])
      publicIdCounts.set(product.id, (publicIdCounts.get(product.id) || 0) + 1);
  const identities = [];
  for (const [dataset, kind] of sourceProducts) {
    for (const p of datasets[dataset]) {
      const seenImages = new Set();
      p.imagenes = (p.imagenes || []).filter((url) => {
        const reason = !imageURLAllowed(url)
          ? "invalid-image-url"
          : seenImages.has(url)
            ? "duplicate-image-url"
            : null;
        if (reason) {
          omissions.push({ dataset, productId: p.id, reason, value: url });
          return false;
        }
        seenImages.add(url);
        return true;
      });
      p.imagen = p.imagenes[0] || "";
      // Sheets ya contiene algunos IDs repetidos entre catálogos con modelos de
      // precio diferentes. Neon necesita una clave única, pero la web y el
      // carrito deben seguir recibiendo el ID público histórico.
      const safePublicId = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(p.id);
      const internalId =
        publicIdCounts.get(p.id) > 1 || !safePublicId
          ? `${kind}-${slug(p.id)}`
          : p.id;
      if (internalId !== p.id)
        identities.push({ dataset, kind, publicId: p.id, internalId });
      const campaign =
        kind === "special"
          ? datasets.campaigns.find((c) => c.evento === p.evento)
          : null;
      if (kind === "special" && !campaign)
        throw new Error(`Campaña inexistente para ${p.id}: ${p.evento}`);
      const variants = datasets.postresConfig
        .filter((c) => c.postreId === p.id && kind === "postre")
        .map((c) => ({
          sizeId: c.sizeId,
          priceCents: toCents(c.precio),
          active: c.disponible,
        }));
      if (
        kind === "postre" &&
        p.disponible !== false &&
        !variants.some((variant) => variant.active)
      ) {
        p.disponible = false;
        omissions.push({
          dataset,
          productId: p.id,
          reason: "active-postre-without-priced-variant",
        });
      }
      products.push({
        id: internalId,
        kind,
        name: p.nombre,
        description: p.descripcion,
        categoryId: slug(p.categoria || "Postres"),
        campaignId: campaign?.id || null,
        priceCents: kind === "postre" ? null : toCents(p.precio),
        offerPriceCents:
          p.precioOferta === null || p.precioOferta === undefined
            ? null
            : toCents(p.precioOferta),
        previousPriceCents:
          p.precioAnterior === null || p.precioAnterior === undefined
            ? null
            : toCents(p.precioAnterior),
        active: p.disponible !== false,
        archived: false,
        featured: p.destacado === true,
        reserved: p.reservado === true,
        campaignActive: p.activo !== false,
        sinTacc: p.sinTacc === true,
        limited: p.esLimitado === true,
        stock: p.stock ?? null,
        label: p.etiqueta || "",
        offerLabel: p.tipoOferta || "",
        startDate: p.fechaInicio || null,
        endDate: p.fechaFin || null,
        order: products.length,
        variants,
        images: (p.imagenes || []).map((url, i) => ({
          id: `img-${createHash("sha256").update(url).digest("hex").slice(0, 32)}`,
          url,
          publicId: null,
          alt: p.nombre,
        })),
        sourceRecord: p,
      });
    }
  }
  unique(products, (p) => p.id, "productos (todos los orígenes)");
  const cake = Object.keys(definitions)
    .filter((k) => k.startsWith("torta"))
    .flatMap((dataset) =>
      datasets[dataset].map((p) => ({ dataset, id: p.id, data: p })),
    );
  const catalog = {
    revision: 0,
    categories,
    sizes,
    products,
    campaigns: datasets.campaigns,
    cake,
    rules: pricingRules,
  };
  for (const p of products) {
    try {
      validateProduct(p, catalog, { existing: p });
    } catch (e) {
      throw new Error(
        `Producto ${p.id}: ${Object.entries(e.errors || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(" ")}`,
      );
    }
  }
  return { catalog, datasets, omissions, identities };
}
// Separa SQL sin romper cuerpos PL/pgSQL ni cadenas: útil para transacción HTTP Neon.
export function splitSQL(input) {
  const statements = [];
  let buffer = "",
    quote = null,
    dollar = null,
    lineComment = false,
    blockComment = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i],
      next = input[i + 1];
    if (lineComment) {
      if (c === "\n") {
        lineComment = false;
        buffer += "\n";
      }
      continue;
    }
    if (blockComment) {
      if (c === "*" && next === "/") {
        blockComment = false;
        i++;
      }
      continue;
    }
    if (!quote && !dollar && c === "-" && next === "-") {
      lineComment = true;
      i++;
      continue;
    }
    if (!quote && !dollar && c === "/" && next === "*") {
      blockComment = true;
      i++;
      continue;
    }
    if (dollar) {
      if (input.startsWith(dollar, i)) {
        buffer += dollar;
        i += dollar.length - 1;
        dollar = null;
      } else buffer += c;
      continue;
    }
    if (quote) {
      buffer += c;
      if (c === quote) {
        if (next === quote) {
          buffer += next;
          i++;
        } else quote = null;
      }
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
      buffer += c;
      continue;
    }
    if (c === "$") {
      const m = input.slice(i).match(/^\$[a-zA-Z_0-9]*\$/);
      if (m) {
        dollar = m[0];
        buffer += dollar;
        i += dollar.length - 1;
        continue;
      }
    }
    if (c === ";") {
      if (buffer.trim() && !/^(BEGIN|COMMIT)$/i.test(buffer.trim()))
        statements.push(buffer.trim());
      buffer = "";
    } else buffer += c;
  }
  if (quote || dollar || blockComment) throw new Error("SQL incompleto.");
  if (buffer.trim()) statements.push(buffer.trim());
  return statements;
}
