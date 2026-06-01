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
  const images = parseProductImages(product?.imagenes);
  if (images.length > 0) return images;

  return parseProductImages(product?.imagen);
};

export const getPrimaryProductImage = (product) => getProductImages(product)[0] || "";
