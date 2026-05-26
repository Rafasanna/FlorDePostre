import { useEffect, useState } from "react";
import { Plus, Sparkle, Check } from "lucide-react";
import ProductBadge from "./ProductBadge.jsx";
import PromoBadge from "./PromoBadge.jsx";
import { getProductBadges, hasActiveOffer } from "../utils/seasonal.js";

const isProductOrderable = (product) => {
  const stock = Number.isFinite(product?.stock) ? product.stock : null;
  return product?.disponible !== false && product?.reservado !== true && (stock === null || stock > 0);
};

function ProductCard({ product, quantity, onAdd, formatPrice }) {
  const [justAdded, setJustAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const badges = getProductBadges(product);
  const hasImage = Boolean(product.imagen) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
  }, [product.imagen]);

  const handleAdd = () => {
    if (!isProductOrderable(product)) return;

    onAdd(product);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 3000);
  };

  return (
    <article className="product-card">
      <div className={hasImage && imageLoaded ? "product-media" : "product-media placeholder"}>
        {hasImage && (
          <img 
            src={product.imagen} 
            alt={product.nombre} 
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)} 
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
        )}
        {(!hasImage || !imageLoaded) && (
          <div className="placeholder-content">
            <Sparkle size={26} />
            <span>Flor de Postre</span>
          </div>
        )}
        {badges.length > 0 && (
          <div className="product-badges" aria-label="Etiquetas de producto">
            {badges.map((badge) => (
              <ProductBadge key={`${badge.type}-${badge.label}`} label={badge.label} type={badge.type} />
            ))}
          </div>
        )}
      </div>
      <div className="product-info">
        <div>
          <h3>{product.nombre}</h3>
          <p>{product.descripcion}</p>
        </div>
        <div className="product-footer">
          <PromoBadge product={product} formatPrice={formatPrice} />
          {!hasActiveOffer(product) && <strong>{formatPrice(product.precio)}</strong>}
          <button 
            type="button" 
            onClick={handleAdd}
            className={justAdded ? "added" : ""}
          >
            {justAdded ? <Check size={17} /> : <Plus size={17} />}
            {quantity > 0 ? `Agregar (${quantity})` : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
