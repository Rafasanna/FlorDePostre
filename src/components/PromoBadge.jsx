import { getEffectivePrice, hasActiveOffer } from "../utils/seasonal.js";

function PromoBadge({ product, formatPrice }) {
  if (!hasActiveOffer(product)) return null;

  return (
    <div className="promo-price" aria-label={`Precio oferta ${formatPrice(getEffectivePrice(product))}`}>
      <span>{formatPrice(product.precioAnterior || product.precio)}</span>
      <strong>{formatPrice(getEffectivePrice(product))}</strong>
    </div>
  );
}

export default PromoBadge;
