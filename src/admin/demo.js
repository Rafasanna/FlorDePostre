import { dailyProducts, categories } from "../data/dailyProducts.js";
import { postresBase } from "../data/postresData.js";
import { campaigns } from "../data/campaigns.js";
import {
  cakePriceOptions,
  coberturas,
  tortaSizes,
  rellenos,
  tortaExtras,
  getCakeExtraRule,
} from "../data/tortasData.js";
import {
  slug,
  toCents,
  validateProduct,
  validateCategory,
} from "../../shared/catalog.js";
const key = "florDePostre:admin-demo:v1";
export function demoAllowed({ enabled, dev, host }) {
  return (
    enabled === true &&
    dev === true &&
    ["localhost", "127.0.0.1", "[::1]"].includes(host)
  );
}
export function demoSeed() {
  const cats = [
    ...new Set([
      ...categories.filter((c) => c !== "Todos"),
      ...dailyProducts.map((p) => p.categoria),
      "Postres",
      "Especiales",
    ]),
  ].map((name, order) => ({
    id: slug(name),
    name,
    parentId: null,
    order,
    active: true,
  }));
  const base = (p, kind, order) => ({
    id: p.id,
    kind,
    name: p.nombre,
    description: p.descripcion || "",
    categoryId: slug(p.categoria || "Postres"),
    priceCents: kind === "postre" ? null : toCents(p.precio),
    order,
    active: p.disponible !== false,
    featured: p.destacado === true,
    reserved: p.reservado === true,
    campaignActive: true,
    archived: false,
    sinTacc: p.sinTacc === true,
    limited: p.esLimitado === true,
    stock: p.stock ?? null,
    offerPriceCents: p.precioOferta ? toCents(p.precioOferta) : null,
    previousPriceCents: p.precioAnterior ? toCents(p.precioAnterior) : null,
    startDate: p.fechaInicio || null,
    endDate: p.fechaFin || null,
    label: p.etiqueta || "",
    offerLabel: p.tipoOferta || "",
    campaignId: null,
    variants: [],
    images: p.imagen
      ? [
          {
            id: `demo-img-${p.id}`,
            url: p.imagen,
            publicId: null,
            alt: p.nombre,
          },
        ]
      : [],
  });
  const sizes = [
    {
      id: "demo-18",
      name: "18 cm · ejemplo",
      portions: "12 porciones · ejemplo",
      active: true,
      estimatedPriceCents: null,
      notes: "",
    },
    {
      id: "demo-22",
      name: "22 cm · ejemplo",
      portions: "22 porciones · ejemplo",
      active: true,
      estimatedPriceCents: null,
      notes: "",
    },
  ];
  const products = dailyProducts.map((p, i) =>
    base(p, p.categoria === "Sin TACC" ? "sin_tacc" : "daily", i),
  );
  products.push(
    ...postresBase.map((p, i) => ({
      ...base(p, "postre", products.length + i),
      variants: sizes.map((s, j) => ({
        sizeId: s.id,
        priceCents: (35000 + j * 10000) * 100,
        active: true,
      })),
    })),
  );
  return {
    revision: 0,
    categories: cats,
    sizes,
    products,
    campaigns: campaigns.map((c) => ({ ...c, evento: c.titulo })),
    cake: [
      ...Object.entries({
        tortaTamanos: tortaSizes,
        tortaCoberturas: coberturas,
        tortaRellenos: rellenos,
        tortaExtras,
      }).flatMap(([dataset, items]) =>
        items.map((data) => ({ dataset, id: data.id, data })),
      ),
    ],
    rules: {
      version: 1,
      cakePriceOptions,
      extraRules: tortaExtras.map((e) => ({
        id: e.id,
        rule: getCakeExtraRule(e),
      })),
    },
  };
}
export function createDemoService(storage) {
  let catalog;
  try {
    catalog = JSON.parse(storage?.getItem(key));
  } catch {}
  if (
    !catalog ||
    !Array.isArray(catalog.products) ||
    !Array.isArray(catalog.categories)
  )
    catalog = demoSeed();
  function persist(next) {
    if (storage) {
      try {
        storage.setItem(key, JSON.stringify(next));
      } catch {
        throw new Error(
          "No hay espacio para guardar la demo en este navegador. Quitá fotos o reiniciá la demostración.",
        );
      }
    }
    catalog = next;
    return structuredClone(catalog);
  }
  return {
    mode: "demo",
    writesEnabled: true,
    read: async () => structuredClone(catalog),
    saveProduct: async (product, revision, creating) => {
      if (revision !== catalog.revision)
        throw new Error("El catálogo cambió. Recargá antes de guardar.");
      const existing = creating
        ? null
        : catalog.products.find((p) => p.id === product.id);
      if (!creating && !existing) throw new Error("Producto no encontrado.");
      const validated = validateProduct(product, catalog, {
        existing,
        demo: true,
      });
      const next = structuredClone(catalog);
      next.products = creating
        ? [...next.products, validated]
        : next.products.map((p) => (p.id === validated.id ? validated : p));
      next.revision++;
      return persist(next);
    },
    saveCategory: async (category, revision, creating) => {
      if (revision !== catalog.revision)
        throw new Error("El catálogo cambió. Recargá antes de guardar.");
      if (creating && catalog.categories.some((c) => c.id === category.id))
        throw new Error("Ese ID ya existe.");
      const c = validateCategory(category, catalog.categories);
      if (
        !c.active &&
        catalog.products.some(
          (p) =>
            (p.categoryId === c.id ||
              catalog.categories.some(
                (child) => child.id === p.categoryId && child.parentId === c.id,
              )) &&
            p.active &&
            !p.archived,
        )
      )
        throw new Error("Desactivá o reasigná los productos activos primero.");
      const next = structuredClone(catalog);
      next.categories = creating
        ? [...next.categories, c]
        : next.categories.map((x) => (x.id === c.id ? c : x));
      next.revision++;
      return persist(next);
    },
    upload: async (file) => ({
      id: `demo-${crypto.randomUUID()}`,
      url: await readImage(file),
      publicId: null,
      alt: "",
    }),
    logout: async () => {},
    reset: () => {
      storage?.removeItem(key);
      catalog = demoSeed();
      return structuredClone(catalog);
    },
  };
}
export function validateFile(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error("Elegí una foto JPG, PNG o WebP.");
  if (file.size > 2 * 1024 * 1024)
    throw new Error("La foto debe pesar hasta 2 MB.");
}
export async function readImage(file) {
  validateFile(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No pudimos leer esa foto."));
    reader.readAsDataURL(file);
  });
}
