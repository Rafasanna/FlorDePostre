const today = () => new Date();

export const isWithinDateRange = (item, referenceDate = today()) => {
  if (!item?.fechaInicio && !item?.fechaFin) return true;

  const current = new Date(referenceDate);
  const start = item.fechaInicio ? new Date(`${item.fechaInicio}T00:00:00`) : null;
  const end = item.fechaFin ? new Date(`${item.fechaFin}T23:59:59`) : null;

  if (start && current < start) return false;
  if (end && current > end) return false;
  return true;
};

export const isCampaignActive = (campaign, referenceDate = today()) =>
  Boolean(campaign?.active ?? campaign?.activa) && isWithinDateRange(campaign, referenceDate);

export const isProductVisible = (product, referenceDate = today()) =>
  product?.disponible !== false && isWithinDateRange(product, referenceDate);

export const hasActiveOffer = (product, referenceDate = today()) =>
  Boolean(product?.precioOferta) && isProductVisible(product, referenceDate);

export const getEffectivePrice = (product, referenceDate = today()) =>
  hasActiveOffer(product, referenceDate) ? product.precioOferta : product.precio;

export const getProductBadges = (product, referenceDate = today()) => {
  const badges = [];

  if (hasActiveOffer(product, referenceDate)) badges.push({ label: product.tipoOferta || "Oferta", type: "offer" });
  if ((product?.esLimitado || product?.etiqueta) && (product?.fechaInicio || product?.fechaFin) && isProductVisible(product, referenceDate)) {
    badges.push({ label: product.etiqueta || "Edición limitada", type: "limited" });
  }

  return badges;
};

export const getVisibleProducts = (products, referenceDate = today()) =>
  products.filter((product) => isProductVisible(product, referenceDate));

export const getActiveCampaigns = (campaigns, referenceDate = today()) =>
  campaigns.filter((campaign) => isCampaignActive(campaign, referenceDate));

export const getFeaturedProducts = (products, referenceDate = today()) =>
  getVisibleProducts(products, referenceDate).filter((product) => product.destacado);
