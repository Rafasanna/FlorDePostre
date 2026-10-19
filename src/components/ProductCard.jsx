import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Sparkle, Check } from "lucide-react";
import ProductBadge from "./ProductBadge.jsx";
import PromoBadge from "./PromoBadge.jsx";
import { getProductBadges, hasActiveOffer } from "../utils/seasonal.js";
import { getDisplayImageUrl, getProductImages, getResponsiveImageSrcSet } from "../utils/productImages.js";

const isProductOrderable = (product) =>
  Boolean(product) && product.disponible !== false && product.reservado !== true;

function ProductCard({ product, quantity, onAdd, formatPrice }) {
  const addFeedbackTimeoutRef = useRef(null);
  const [justAdded, setJustAdded] = useState(false);
  const [failedImages, setFailedImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const badges = getProductBadges(product);
  const productImages = useMemo(() => getProductImages(product), [product]);
  const imagesKey = productImages.join("|");
  const availableImages = useMemo(
    () => productImages.filter((image) => !failedImages.includes(image)),
    [failedImages, productImages]
  );
  const hasMultipleImages = availableImages.length > 1;
  const activeImage = availableImages[activeImageIndex] || availableImages[0] || "";
  const activeImageUrl = getDisplayImageUrl(activeImage, {
    width: 768,
    quality: "good"
  });
  const activeImageSrcSet = getResponsiveImageSrcSet(activeImage, [480, 768, 1200], {
    quality: "good"
  });
  const hasImage = Boolean(activeImage);

  useEffect(() => {
    setActiveImageIndex(0);
    setFailedImages([]);
  }, [imagesKey]);

  useEffect(() => {
    if (activeImageIndex >= availableImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, availableImages.length]);

  useEffect(() => () => {
    if (addFeedbackTimeoutRef.current) {
      window.clearTimeout(addFeedbackTimeoutRef.current);
    }
  }, []);

  const handleAdd = () => {
    if (!isProductOrderable(product)) return;

    onAdd(product);
    setJustAdded(true);
    if (addFeedbackTimeoutRef.current) {
      window.clearTimeout(addFeedbackTimeoutRef.current);
    }
    addFeedbackTimeoutRef.current = window.setTimeout(() => {
      setJustAdded(false);
      addFeedbackTimeoutRef.current = null;
    }, 1200);
  };

  const handleImageError = () => {
    if (!activeImage) return;

    setFailedImages((currentImages) =>
      currentImages.includes(activeImage) ? currentImages : [...currentImages, activeImage]
    );
  };

  const handlePreviousImage = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hasMultipleImages) return;

    setActiveImageIndex((index) => (index - 1 + availableImages.length) % availableImages.length);
  };

  const handleNextImage = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!hasMultipleImages) return;

    setActiveImageIndex((index) => (index + 1) % availableImages.length);
  };

  return (
    <article className="product-card">
      <div className={hasImage ? "product-media" : "product-media placeholder"}>
        {hasImage && (
          <img 
            src={activeImageUrl} 
            srcSet={activeImageSrcSet || undefined}
            sizes="(max-width: 680px) calc(100vw - 32px), (max-width: 960px) calc(50vw - 42px), 280px"
            alt={product.nombre} 
            loading="lazy"
            decoding="async"
            onError={handleImageError} 
          />
        )}
        {hasMultipleImages && hasImage && (
          <>
            <button
              type="button"
              className="product-image-control previous"
              onClick={handlePreviousImage}
              aria-label={`Ver imagen anterior de ${product.nombre}`}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="product-image-control next"
              onClick={handleNextImage}
              aria-label={`Ver imagen siguiente de ${product.nombre}`}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </>
        )}
        {!hasImage && (
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
          {product.descripcion?.trim().toLocaleLowerCase() !== product.nombre?.trim().toLocaleLowerCase() && product.descripcion && <p>{product.descripcion}</p>}
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
            {justAdded ? "Agregado" : quantity > 0 ? `Agregar (${quantity})` : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
