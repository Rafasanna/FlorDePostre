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
  { id: "ganache-chocolate", nombre: "Ganache de chocolate", precioExtra: 2000 },
  { id: "ganache-blanco", nombre: "Ganache de chocolate blanco", precioExtra: 2500 },
  { id: "crema-frutilla", nombre: "Crema de frutilla", precioExtra: 3000 },
  { id: "nutella", nombre: "Nutella", precioExtra: 4500 },
  { id: "crema-oreo", nombre: "Crema Oreo", precioExtra: 2500 }
];

export const tortaExtras = [
  { id: "extra-frutos-rojos", nombre: "Frutos rojos", precioExtra: 2000 },
  { id: "extra-frutos-secos", nombre: "Frutos secos o nueces", precioExtra: 2000 },
  { id: "extra-kinder-ferrero", nombre: "Golosinas (Kinder / Ferrero)", precioExtra: 4500 },
  { id: "extra-imprimible", nombre: "Imprimible para torta", precioExtra: 3000 },
  { id: "extra-topper-nombre", nombre: "Topper acrílico nombre/número", precioExtra: 2500 },
  { id: "extra-topper-frase", nombre: "Topper acrílico con frase", precioExtra: 3500 },
  { id: "extra-mono", nombre: "Moño con cinta de bebé", precioExtra: 2500 },
  { id: "extra-porcelana", nombre: "Adorno de porcelana fría", precioExtra: 5000 },
  { id: "extra-flores", nombre: "Flores naturales o de tela", precioExtra: 12000 },
  { id: "extra-pisos-falsos", nombre: "Pisos falsos (para Fondant)", precioExtra: 10000 },
  { id: "extra-corazon", nombre: "Forma de corazón", precioExtra: 10000 }
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
