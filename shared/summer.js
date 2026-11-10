// La selección editorial usa los IDs del catálogo publicado. Una baguette nueva
// se incorpora cuando exista en el menú, sin crearle precio ni disponibilidad.
const SUMMER_PRODUCT_IDS = [
  "ensalada-dia",
  "ensalada-cesar",
  "sandwich-miga-x6",
  "sandwich-miga-x12",
  "sandwich-miga-unidad",
  "tarta-casera",
  "bandeja-matera-chica",
  "bandeja-matera-grande",
  "ensalada de frutas",
  "bandeja-matera-mediana",
];

const summerPositions = new Map(
  SUMMER_PRODUCT_IDS.map((id, index) => [id, index]),
);

export const isSummerSeason = (date = new Date()) => {
  const month = date.getMonth() + 1;
  return month >= 11 || month <= 3;
};

export const getSummerRank = (product, date = new Date()) => {
  if (!isSummerSeason(date) || (product.kind && product.kind !== "daily"))
    return Infinity;

  const id = String(product.sourceRecord?.id || product.id || "").toLowerCase();
  if (summerPositions.has(id)) return summerPositions.get(id);

  const name = String(product.name || product.nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return name.includes("baguette") ? 5.5 : Infinity;
};

export const isSummerProduct = (product, date = new Date()) =>
  getSummerRank(product, date) !== Infinity;
