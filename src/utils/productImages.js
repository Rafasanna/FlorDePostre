export const parseProductImages = (value) => {
  if (Array.isArray(value)) {
    return value.map((url) => String(url ?? "").trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);
};

export const getProductImages = (product) => {
  const images = [
    ...parseProductImages(product?.imagenes),
    ...parseProductImages(product?.images),
    ...parseProductImages(product?.imageUrls)
  ];
  if (images.length > 0) return [...new Set(images)];

  return [...new Set([
    ...parseProductImages(product?.imagen),
    ...parseProductImages(product?.image),
    ...parseProductImages(product?.imageUrl),
    ...parseProductImages(product?.mainImage),
    ...parseProductImages(product?.thumbnail),
    ...parseProductImages(product?.foto),
    ...parseProductImages(product?.portada)
  ])];
};

export const getPrimaryProductImage = (product) => getProductImages(product)[0] || "";
