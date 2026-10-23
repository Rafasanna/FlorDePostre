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
    ...parseProductImages(product?.imageUrls),
  ];
  if (images.length > 0) return [...new Set(images)];

  return [
    ...new Set([
      ...parseProductImages(product?.imagen),
      ...parseProductImages(product?.image),
      ...parseProductImages(product?.imageUrl),
      ...parseProductImages(product?.mainImage),
      ...parseProductImages(product?.thumbnail),
      ...parseProductImages(product?.foto),
      ...parseProductImages(product?.portada),
    ]),
  ];
};

export const getPrimaryProductImage = (product) =>
  getProductImages(product)[0] || "";

const CLOUDINARY_UPLOAD_PATHS = ["/image/upload/", "/video/upload/"];
const DEFAULT_DISPLAY_WIDTH = 1200;
const MAX_DISPLAY_WIDTH = 2400;
const QUALITY_TRANSFORMATIONS = {
  auto: "q_auto",
  good: "q_auto:good",
  eco: "q_auto:eco",
  low: "q_auto:low",
  best: "q_auto:best",
};

const normalizeDisplayWidth = (width) => {
  if (!Number.isInteger(width) || width <= 0 || width > MAX_DISPLAY_WIDTH) {
    return DEFAULT_DISPLAY_WIDTH;
  }

  return width;
};

const normalizeQualityTransformation = (quality) =>
  QUALITY_TRANSFORMATIONS[quality] || QUALITY_TRANSFORMATIONS.good;

const getCloudinaryUploadPath = (parsedUrl) => {
  if (parsedUrl.hostname !== "res.cloudinary.com") return "";

  return (
    CLOUDINARY_UPLOAD_PATHS.find((path) => parsedUrl.pathname.includes(path)) ||
    ""
  );
};

const buildCloudinaryDeliveryTransformation = ({ width, quality }) =>
  [
    `c_limit,w_${normalizeDisplayWidth(width)}`,
    normalizeQualityTransformation(quality),
    "f_auto",
  ].join("/");

const isCloudinaryDeliveryTransformationSegment = (segment) => {
  if (!segment || /^v\d+$/.test(segment)) return false;

  return segment
    .split(",")
    .some(
      (token) =>
        token === "f_auto" ||
        token === "c_limit" ||
        token === "q_auto" ||
        token.startsWith("q_auto:") ||
        /^w_\d+$/.test(token),
    );
};

export const getDisplayImageUrl = (url, options = {}) => {
  if (typeof url !== "string") return "";

  const value = url.trim();

  if (!value) return "";

  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    return url;
  }

  const uploadPath = getCloudinaryUploadPath(parsedUrl);
  if (!uploadPath) return url;

  const uploadPathIndex = parsedUrl.pathname.indexOf(uploadPath);
  const pathBeforeUpload = parsedUrl.pathname.slice(
    0,
    uploadPathIndex + uploadPath.length,
  );
  const pathAfterUpload = parsedUrl.pathname.slice(
    uploadPathIndex + uploadPath.length,
  );

  if (!pathAfterUpload) return url;

  const desiredTransformation = buildCloudinaryDeliveryTransformation(options);
  const pathParts = pathAfterUpload.split("/");

  if (pathParts[0] === desiredTransformation) return url;

  const assetPathParts = [...pathParts];
  while (
    assetPathParts.length > 0 &&
    isCloudinaryDeliveryTransformationSegment(assetPathParts[0])
  ) {
    assetPathParts.shift();
  }

  parsedUrl.pathname = `${pathBeforeUpload}${desiredTransformation}/${assetPathParts.join("/")}`;

  return parsedUrl.toString();
};

export const getResponsiveImageSrcSet = (url, widths, options = {}) => {
  if (typeof url !== "string" || !Array.isArray(widths)) return "";

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return "";
  }

  if (!getCloudinaryUploadPath(parsedUrl)) return "";

  const normalizedWidths = [...new Set(widths.map(normalizeDisplayWidth))].sort(
    (a, b) => a - b,
  );

  return normalizedWidths
    .map(
      (width) => `${getDisplayImageUrl(url, { ...options, width })} ${width}w`,
    )
    .join(", ");
};
