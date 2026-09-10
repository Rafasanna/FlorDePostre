export const coberturas = [
  { id: "merengue-italiano", nombre: "Merengue italiano", descripcion: "Clásico y ligero." },
  { id: "buttercream", nombre: "Buttercream", descripcion: "Suave crema de manteca." },
  { id: "fondant", nombre: "Fondant", descripcion: "Cubierta lisa y perfecta para diseños complejos." }
];

export const tortaSizes = [
  { id: "size-18", nombre: "18 cm", porciones: "12-18 porciones", precioBaseEstimado: 36900 },
  { id: "size-22", nombre: "22 cm", porciones: "22-25 porciones", precioBaseEstimado: 44900 },
  { id: "size-24", nombre: "24 cm", porciones: "35-50 porciones", precioBaseEstimado: 51900 }
];

export const rellenos = [
  { id: "dulce-de-leche", nombre: "Dulce de leche", precioExtra: 0 },
  { id: "crema-chantilly", nombre: "Crema chantilly", precioExtra: 0 },
  { id: "mousse-de-chocolate", nombre: "Mousse de Chocolate", precioExtra: 0 },
  { id: "ganache-chocolate", nombre: "Ganache de chocolate", precioExtra: 2000 },
  { id: "ganache-blanco", nombre: "Ganache de chocolate blanco", precioExtra: 2500 },
  { id: "crema-frutilla", nombre: "Crema con frutilla", precioExtra: 3000 },
  { id: "nutella", nombre: "Nutella", precioExtra: 4500 },
  { id: "oreos", nombre: "Oreos", precioExtra: 2500 },
  { id: "nueces", nombre: "Nueces", precioExtra: 2500 },
  { id: "frutos-rojos", nombre: "Frutos Rojos", precioExtra: 3500 },
  { id: "merenguitos", nombre: "Merenguitos", precioExtra: 2000 }
];

export const tortaExtras = [
  { id: "extra-imprimible", nombre: "Imprimible para torta", precioExtra: 5000 },
  { id: "extra-topper-nombre", nombre: "Topper acrílico nombre/número", precioExtra: 5000 },
  { id: "extra-topper-frase", nombre: "Topper acrílico con frase", precioExtra: 5000 },
  { id: "extra-mono", nombre: "Moño con cinta de bebé", precioExtra: 5000 },
  { id: "extra-porcelana", nombre: "Adorno de porcelana fría", precioExtra: 5000 },
  { id: "extra-flores", nombre: "Flores naturales o de tela", precioExtra: 12000 },
  { id: "extra-pisos-falsos", nombre: "Pisos falsos para Fondant", precioExtra: 15000 },
  { id: "extra-corazon", nombre: "Forma de corazón", precioExtra: 10000 },
  { id: "extra-color", nombre: "Color negro, rojo o glitter", precioExtra: 10000 }
];

export const cakePriceOptions = [
  {
    id: "merengue-italiano-2-rellenos",
    coberturaId: "merengue-italiano",
    nombre: "Merengue italiano",
    descripcion: "2 rellenos incluidos.",
    fillings: 2,
    sizes: [
      { nombre: "18 cm", price: 38900, porciones: "hasta 12 porciones" },
      { nombre: "22 cm", price: 44900, porciones: "hasta 22 porciones" },
      { nombre: "24 cm", price: 55900, porciones: "hasta 35 porciones" }
    ]
  },
  {
    id: "buttercream-2-rellenos",
    coberturaId: "buttercream",
    nombre: "Buttercream",
    descripcion: "2 rellenos incluidos.",
    fillings: 2,
    sizes: [
      { nombre: "18 cm", price: 56900, porciones: "hasta 15 porciones" },
      { nombre: "22 cm", price: 64000, porciones: "hasta 25 porciones" },
      { nombre: "24 cm", price: 75000, porciones: "hasta 35 porciones" }
    ]
  },
  {
    id: "buttercream-3-rellenos",
    coberturaId: "buttercream",
    nombre: "Buttercream",
    descripcion: "3 rellenos incluidos.",
    fillings: 3,
    sizes: [
      { nombre: "18 cm", price: 65000, porciones: "hasta 25 porciones" },
      { nombre: "22 cm", price: 70000, porciones: "hasta 35 porciones" },
      { nombre: "24 cm", price: 85000, porciones: "hasta 50 porciones" }
    ]
  },
  {
    id: "fondant-2-rellenos",
    coberturaId: "fondant",
    nombre: "Fondant",
    descripcion: "2 rellenos incluidos.",
    fillings: 2,
    sizes: [
      { nombre: "18 cm", price: 66000, porciones: "hasta 18 porciones" },
      { nombre: "22 cm", price: 78000, porciones: "hasta 25 porciones" },
      { nombre: "24 cm", price: 85000, porciones: "hasta 35/40 porciones" }
    ]
  }
];

const normalizeCakeKey = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const CAKE_FILLING_EXTRA_KEYS = new Set([
  "nutella",
  "oreos",
  "nueces",
  "frutosrojos",
  "merenguitos"
]);

export const getCakeOptionDisplayKey = (item) => normalizeCakeKey(item?.nombre || item?.id);

export const isCakeFillingExtra = (relleno) => {
  const keys = [relleno?.id, relleno?.nombre].map(normalizeCakeKey);
  return keys.some((key) => CAKE_FILLING_EXTRA_KEYS.has(key));
};

export const getCakePriceOption = (optionId) =>
  cakePriceOptions.find((option) => option.id === optionId) || null;

export const getCakeSizePrice = (optionId, size) => {
  const option = getCakePriceOption(optionId);
  if (!option || !size) return null;

  const sizeName = typeof size === "string" ? size : size.nombre;
  const sizePrice = option.sizes.find((item) => normalizeCakeKey(item.nombre) === normalizeCakeKey(sizeName));
  if (!sizePrice || !Number.isFinite(sizePrice.price)) return null;

  return {
    ...sizePrice,
    sizeId: typeof size === "string" ? null : size.id,
    nombre: sizeName,
    option
  };
};

const EXTRA_PRICE_RULES = [
  { match: ["extra-imprimible", "imprimible para torta"], type: "fixed", amount: 5000 },
  { match: ["extra-topper-nombre", "topper acrilico nombre numero", "topper acrílico nombre/número"], type: "fixed", amount: 5000 },
  { match: ["extra-topper-frase", "topper acrilico con frase", "topper acrílico con frase"], type: "fixed", amount: 5000 },
  { match: ["extra-mono", "mono con cinta de bebe", "moño con cinta de bebé"], type: "fixed", amount: 5000 },
  { match: ["extra-porcelana", "adorno de porcelana fria", "adorno de porcelana fría"], type: "fixed", amount: 5000 },
  { match: ["extra-flores", "flores naturales o de tela"], type: "fixed", amount: 12000 },
  { match: ["extra-pisos-falsos", "pisos falsos para fondant", "pisos falsos"], type: "percent", percent: 0.25 },
  { match: ["extra-corazon", "forma de corazon", "forma de corazón"], type: "fixed", amount: 10000 },
  { match: ["extra-color", "extra-color-negro-rojo-glitter", "color negro rojo glitter", "color negro, rojo o glitter"], type: "fixed", amount: 10000 }
];

export const getCakeExtraRule = (extra) => {
  const extraKeys = [extra?.id, extra?.nombre].map(normalizeCakeKey);
  return EXTRA_PRICE_RULES.find((rule) =>
    rule.match.map(normalizeCakeKey).some((key) => extraKeys.includes(key))
  ) || null;
};

export const getCakeExtraPrice = (extra, cakeBasePrice = 0) => {
  const rule = getCakeExtraRule(extra);

  if (rule?.type === "fixed") return rule.amount;
  if (rule?.type === "percent" && Number.isFinite(cakeBasePrice)) {
    return Math.round(cakeBasePrice * rule.percent);
  }
  if (rule?.type === "from") return 0;

  return Number.isFinite(extra?.precioExtra) ? extra.precioExtra : 0;
};

export const getCakeExtraDisplay = (extra, cakeBasePrice = null, formatPrice = (value) => `$${value}`) => {
  const rule = getCakeExtraRule(extra);

  if (rule?.type === "fixed") return formatPrice(rule.amount);
  if (rule?.type === "from") return `A partir de ${formatPrice(rule.amount)}`;
  if (rule?.type === "percent") {
    if (Number.isFinite(cakeBasePrice)) {
      return `+25% sobre el valor de la torta (${formatPrice(getCakeExtraPrice(extra, cakeBasePrice))})`;
    }

    return "+25% sobre el valor de la torta";
  }

  return Number.isFinite(extra?.precioExtra) && extra.precioExtra > 0 ? formatPrice(extra.precioExtra) : "";
};

export const enrichCakeExtra = (extra, cakeBasePrice = null, formatPrice) => ({
  ...extra,
  precioCalculado: Number.isFinite(cakeBasePrice) ? getCakeExtraPrice(extra, cakeBasePrice) : 0,
  precioTexto: getCakeExtraDisplay(extra, cakeBasePrice, formatPrice),
  priceRule: getCakeExtraRule(extra)?.type || "fixed"
});

export const getCakeFillingPrice = (relleno) =>
  Number.isFinite(relleno?.precioExtra) ? relleno.precioExtra : 0;

export const getCakeFillingDisplay = (relleno, formatPrice = (value) => `$${value}`) => {
  const price = getCakeFillingPrice(relleno);
  return price > 0 ? `+${formatPrice(price)}` : "Sin costo extra";
};

export const enrichCakeFilling = (relleno, formatPrice) => ({
  ...relleno,
  precioCalculado: getCakeFillingPrice(relleno),
  precioTexto: getCakeFillingDisplay(relleno, formatPrice)
});
