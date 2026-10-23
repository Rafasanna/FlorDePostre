import { toPesos } from "./catalog.js";
export function publicDatasets(catalog) {
  const products = catalog.products.filter((p) => !p.archived),
    categories = new Map(catalog.categories.map((c) => [c.id, c]));
  const publicId = (p) => p.sourceRecord?.id || p.id;
  const product = (p) => ({
    ...p.sourceRecord,
    id: publicId(p),
    nombre: p.name,
    descripcion: p.description,
    precio: toPesos(p.priceCents),
    categoria:
      categories.get(categories.get(p.categoryId)?.parentId || p.categoryId)
        ?.name || "",
    imagen: p.images[0]?.url || "",
    imagenes: p.images.map((i) => i.url),
    disponible:
      p.active &&
      Boolean(categories.get(p.categoryId)?.active) &&
      (!categories.get(p.categoryId)?.parentId ||
        Boolean(categories.get(categories.get(p.categoryId).parentId)?.active)),
    reservado: p.reserved,
    destacado: p.featured,
    sinTacc: p.sinTacc,
    esLimitado: p.limited,
    stock: p.stock,
    etiqueta: p.label,
    precioAnterior: toPesos(p.previousPriceCents),
    precioOferta: toPesos(p.offerPriceCents),
    tipoOferta: p.offerLabel,
    fechaInicio: p.startDate,
    fechaFin: p.endDate,
  });
  const dataset = {
    menuDiario: products.filter((p) => p.kind === "daily").map(product),
    sinTacc: products.filter((p) => p.kind === "sin_tacc").map(product),
    postres: products.filter((p) => p.kind === "postre").map(product),
    postresTamanos: catalog.sizes
      .filter((s) => s.active)
      .map((s) => ({
        id: s.id,
        nombre: s.name,
        porciones: s.portions,
        disponible: s.active,
        precioEstimado: toPesos(s.estimatedPriceCents),
        notas: s.notes,
      })),
    postresConfig: products
      .filter((p) => p.kind === "postre")
      .flatMap((p) =>
        p.variants
          .filter((v) => v.active)
          .map((v) => ({
            postreId: publicId(p),
            sizeId: v.sizeId,
            precio: toPesos(v.priceCents),
            disponible: v.active,
          })),
      ),
    campaigns: catalog.campaigns,
    specialProducts: products
      .filter((p) => p.kind === "special")
      .map((p) => ({
        ...product(p),
        activo: p.campaignActive,
        evento:
          catalog.campaigns.find((c) => c.id === p.campaignId)?.evento || "",
      })),
  };
  for (const key of [
    "tortaTamanos",
    "tortaCoberturas",
    "tortaRellenos",
    "tortaExtras",
  ])
    dataset[key] = (catalog.cake || [])
      .filter((d) => d.dataset === key && d.data.disponible !== false)
      .map((d) => d.data);
  return dataset;
}
