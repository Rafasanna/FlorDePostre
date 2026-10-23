// Contrato compartido: importable por navegador y servidor, sin dependencias privadas.
export const KINDS = ["daily", "sin_tacc", "postre", "special"];
export class ValidationError extends Error {
  constructor(errors) {
    super("Revisá los campos indicados.");
    this.name = "ValidationError";
    this.errors = errors;
    this.status = 422;
  }
}
const idOK = (v) =>
  typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(v);
const textOK = (v, max) => typeof v === "string" && v.length <= max;
export const moneyOK = (v, zero = false) =>
  Number.isSafeInteger(v) && v >= (zero ? 0 : 1) && v <= 10000000000;
export const toCents = (value) => Math.round(value * 100);
export const moneyInputToCents = (value) =>
  value === ""
    ? null
    : /^\d+(?:\.\d{0,2})?$/.test(value)
      ? Math.round(Number(value) * 100)
      : NaN;
export const toPesos = (value) => (value === null ? null : value / 100);
const dateOK = (v) =>
  v === null ||
  (typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v);
export function imageURLAllowed(url, demo = false) {
  if (typeof url !== "string" || url.length > 2000) return false;
  if (url.startsWith("/images/") && !url.includes("..")) return true;
  if (demo && /^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(url))
    return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function validateCategory(input, categories = []) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new ValidationError({ category: "Categoría inválida." });
  const e = {};
  if (!idOK(input?.id))
    e.id = "Usá un identificador de hasta 120 caracteres, sin espacios.";
  if (!textOK(input?.name, 120) || !input.name.trim())
    e.name = "Escribí un nombre.";
  if (!Number.isSafeInteger(input?.order) || input.order < 0)
    e.order = "Indicá un orden válido.";
  if (typeof input?.active !== "boolean") e.active = "Estado inválido.";
  if (
    input?.parentId !== null &&
    (!categories.some((c) => c.id === input.parentId && !c.parentId) ||
      input.parentId === input.id ||
      categories.some((c) => c.parentId === input.id))
  )
    e.parentId =
      "Elegí una categoría principal. Solo se admite un nivel de subcategorías.";
  if (
    categories.some(
      (c) =>
        c.id !== input.id &&
        c.parentId === input.parentId &&
        c.name.toLocaleLowerCase() ===
          (typeof input.name === "string"
            ? input.name.trim().toLocaleLowerCase()
            : ""),
    )
  )
    e.name = "Ya existe una categoría con ese nombre.";
  if (Object.keys(e).length) throw new ValidationError(e);
  return {
    id: input.id,
    name: input.name.trim(),
    parentId: input.parentId,
    order: input.order,
    active: input.active,
  };
}
export function validateProduct(
  input,
  catalog,
  { existing = null, demo = false } = {},
) {
  const p = input || {},
    e = {};
  if (!idOK(p.id))
    e.id = "ID inválido. Usá letras, números y guiones (máximo 120).";
  if (p.id === "torta-personalizada")
    e.id = "Este ID está reservado para el configurador de tortas.";
  if (existing && p.id !== existing.id)
    e.id = "El ID no puede cambiar: lo usan el catálogo y el carrito.";
  if (!existing && catalog.products.some((x) => x.id === p.id))
    e.id = "Este ID ya está en uso, incluso entre productos archivados.";
  if (!KINDS.includes(p.kind) || (existing && p.kind !== existing.kind))
    e.kind = "Tipo de producto inválido o modificado.";
  if (!textOK(p.name, 160) || !p.name.trim())
    e.name = "Escribí un nombre de hasta 160 caracteres.";
  if (!textOK(p.description, 5000))
    e.description = "La descripción admite hasta 5000 caracteres.";
  const category = catalog.categories.find((c) => c.id === p.categoryId);
  if (
    !category ||
    ((!category.active ||
      (category.parentId &&
        !catalog.categories.find((c) => c.id === category.parentId)?.active)) &&
      p.active &&
      !p.archived)
  )
    e.categoryId = "Elegí una categoría activa.";
  if (p.kind === "postre" ? p.priceCents !== null : !moneyOK(p.priceCents))
    e.priceCents =
      "Indicá un precio mayor a cero. Los postres se cobran por tamaño.";
  if (!Number.isSafeInteger(p.order) || p.order < 0 || p.order > 1000000)
    e.order = "Indicá un orden entre 0 y 1000000.";
  for (const field of [
    "active",
    "featured",
    "reserved",
    "archived",
    "sinTacc",
    "limited",
    "campaignActive",
  ])
    if (typeof p[field] !== "boolean") e[field] = "Estado inválido.";
  if (p.stock !== null && (!Number.isSafeInteger(p.stock) || p.stock < 0))
    e.stock = "El stock debe ser entero y no negativo, o quedar vacío.";
  for (const field of ["offerPriceCents", "previousPriceCents"])
    if (p[field] !== null && !moneyOK(p[field]))
      e[field] = "El precio debe ser mayor a cero o quedar vacío.";
  if (
    p.kind === "postre" &&
    (p.offerPriceCents !== null || p.previousPriceCents !== null)
  )
    e.offerPriceCents = "Los postres no admiten ofertas de precio único.";
  if (p.offerPriceCents !== null && p.offerPriceCents > p.priceCents)
    e.offerPriceCents = "La oferta no puede superar el precio habitual.";
  if (
    p.previousPriceCents !== null &&
    p.previousPriceCents < (p.offerPriceCents ?? p.priceCents)
  )
    e.previousPriceCents =
      "El precio anterior no puede ser menor al precio vigente.";
  for (const field of ["startDate", "endDate"]) {
    try {
      if (!dateOK(p[field])) e[field] = "Fecha inválida.";
    } catch {
      e[field] = "Fecha inválida.";
    }
  }
  if (p.startDate && p.endDate && p.startDate > p.endDate)
    e.endDate = "La fecha final debe ser igual o posterior al inicio.";
  for (const field of ["label", "offerLabel"])
    if (!textOK(p[field], 160)) e[field] = "Texto inválido (máximo 160).";
  if (
    p.kind === "special"
      ? !catalog.campaigns.some((c) => c.id === p.campaignId)
      : p.campaignId !== null
  )
    e.campaignId = "Elegí una campaña válida para el producto especial.";
  if (
    !Array.isArray(p.variants) ||
    p.variants.length > 50 ||
    (p.kind !== "postre" && p.variants.length)
  )
    e.variants = "Solo los postres admiten precios por tamaño.";
  else {
    const ids = new Set();
    for (const v of p.variants) {
      if (!v || typeof v !== "object") {
        e.variants = "Variante inválida.";
        continue;
      }
      if (
        !catalog.sizes.some((s) => s.id === v.sizeId) ||
        ids.has(v.sizeId) ||
        !moneyOK(v.priceCents) ||
        typeof v.active !== "boolean"
      )
        e.variants =
          "Cada tamaño debe ser válido, único y tener precio mayor a cero.";
      ids.add(v.sizeId);
    }
    if (
      p.kind === "postre" &&
      p.active &&
      !p.archived &&
      !p.variants.some(
        (v) =>
          v?.active && catalog.sizes.some((s) => s.id === v.sizeId && s.active),
      )
    )
      e.variants =
        "Agregá al menos un tamaño activo antes de activar este postre.";
  }
  if (!Array.isArray(p.images) || p.images.length > 12)
    e.images = "Podés asociar hasta 12 fotos.";
  else {
    const ids = new Set(),
      urls = new Set();
    for (const img of p.images) {
      if (!img || typeof img !== "object") {
        e.images = "Imagen inválida.";
        continue;
      }
      if (
        !idOK(img.id) ||
        ids.has(img.id) ||
        urls.has(img.url) ||
        !imageURLAllowed(img.url, demo) ||
        !textOK(img.alt, 240) ||
        (img.publicId !== null && !textOK(img.publicId, 300))
      )
        e.images =
          "Revisá las fotos: formato o URL inválidos, o imagen repetida.";
      ids.add(img.id);
      urls.add(img.url);
    }
  }
  if (Object.keys(e).length) throw new ValidationError(e);
  // Lista explícita: jamás aceptar revisiones, datos de auditoría ni metadatos arbitrarios del cliente.
  const result = Object.fromEntries(
    [
      "id",
      "kind",
      "description",
      "categoryId",
      "priceCents",
      "order",
      "active",
      "featured",
      "reserved",
      "archived",
      "sinTacc",
      "limited",
      "campaignActive",
      "stock",
      "offerPriceCents",
      "previousPriceCents",
      "startDate",
      "endDate",
      "label",
      "offerLabel",
      "campaignId",
    ].map((k) => [k, p[k]]),
  );
  return {
    ...result,
    name: p.name.trim(),
    variants: p.variants.map((v) => ({
      sizeId: v.sizeId,
      priceCents: v.priceCents,
      active: v.active,
    })),
    images: p.images.map((img) => ({
      id: img.id,
      url: img.url,
      publicId: img.publicId,
      alt: img.alt,
    })),
  };
}
export const slug = (v) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const formatMoney = (cents) =>
  cents === null
    ? "Por tamaño"
    : new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2,
      }).format(cents / 100);
export function filterProducts(
  products,
  { search = "", category = "", status = "all", sort = "order" } = {},
) {
  const q = slug(search);
  return products
    .filter(
      (p) =>
        (!q || slug(`${p.name} ${p.description} ${p.id}`).includes(q)) &&
        (!category || p.categoryId === category) &&
        (status === "archived"
          ? p.archived
          : !p.archived &&
            (status === "all" ||
              (status === "active" && p.active) ||
              (status === "inactive" && !p.active) ||
              (status === "featured" && p.featured) ||
              (status === "reserved" && p.reserved))),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "es")
        : sort === "price"
          ? (a.priceCents ?? Math.min(...a.variants.map((v) => v.priceCents))) -
            (b.priceCents ?? Math.min(...b.variants.map((v) => v.priceCents)))
          : a.order - b.order || a.name.localeCompare(b.name, "es"),
    );
}
