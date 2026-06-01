import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Sparkle, Check } from "lucide-react";
import ProductBadge from "./ProductBadge.jsx";
import PromoBadge from "./PromoBadge.jsx";
import { getProductBadges, hasActiveOffer } from "../utils/seasonal.js";
import { getProductImages } from "../utils/productImages.js";

const SLIDESHOW_INTERVAL_MS = 4000;

const isProductOrderable = (product) => {
  const stock = Number.isFinite(product?.stock) ? product.stock : null;
  return product?.disponible !== false && product?.reservado !== true && (stock === null || stock > 0);
};

const preloadProductImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (typeof image.decode === "function") {
        image.decode().then(resolve).catch(resolve);
        return;
      }

      resolve();
    };
    image.onerror = reject;
    image.src = src;
  });

function ProductCard({ product, quantity, onAdd, formatPrice }) {
  const cardRef = useRef(null);
  const addFeedbackTimeoutRef = useRef(null);
  const isPreloadingNextImageRef = useRef(false);
  const [justAdded, setJustAdded] = useState(false);
  const [failedImages, setFailedImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCardVisible, setIsCardVisible] = useState(false);
  const badges = getProductBadges(product);
  const productImages = useMemo(() => getProductImages(product), [product]);
  const imagesKey = productImages.join("|");
  const failedImagesKey = failedImages.join("|");
  const availableImages = useMemo(
    () => productImages.filter((image) => !failedImages.includes(image)),
    [failedImages, productImages]
  );
  const hasMultipleImages = availableImages.length > 1;
  const activeImage = availableImages[activeImageIndex] || availableImages[0] || "";
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

  useEffect(() => {
    if (!hasMultipleImages) {
      setIsCardVisible(false);
      return undefined;
    }

    const currentCard = cardRef.current;
    if (!currentCard) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setIsCardVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(entry.isIntersecting);
      },
      {
        rootMargin: "160px 0px",
        threshold: 0.15
      }
    );

    observer.observe(currentCard);

    return () => {
      observer.unobserve(currentCard);
      observer.disconnect();
    };
  }, [hasMultipleImages, imagesKey]);

  useEffect(() => {
    if (!hasMultipleImages || !isCardVisible) return undefined;

    let isCancelled = false;

    const intervalId = window.setInterval(() => {
      if (isPreloadingNextImageRef.current) return;

      const nextIndex = (activeImageIndex + 1) % availableImages.length;
      const nextImage = availableImages[nextIndex];

      if (!nextImage) return;

      isPreloadingNextImageRef.current = true;
      preloadProductImage(nextImage)
        .then(() => {
          if (!isCancelled) {
            setActiveImageIndex(nextIndex);
          }
        })
        .catch(() => {
          if (isCancelled) return;

          setFailedImages((currentImages) =>
            currentImages.includes(nextImage) ? currentImages : [...currentImages, nextImage]
          );
        })
        .finally(() => {
          isPreloadingNextImageRef.current = false;
        });
    }, SLIDESHOW_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeImageIndex, availableImages, failedImagesKey, hasMultipleImages, isCardVisible]);

  useEffect(() => {
    if (!activeImage) return undefined;

    let isCancelled = false;

    preloadProductImage(activeImage).catch(() => {
      if (!isCancelled) {
        setFailedImages((currentImages) =>
          currentImages.includes(activeImage) ? currentImages : [...currentImages, activeImage]
        );
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeImage]);

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
    }, 3000);
  };

  return (
    <article className="product-card" ref={cardRef}>
      <div className={hasImage ? "product-media" : "product-media placeholder"}>
        {hasImage && (
          <img 
            src={activeImage} 
            alt={product.nombre} 
            onError={() => {
              setFailedImages((currentImages) =>
                currentImages.includes(activeImage) ? currentImages : [...currentImages, activeImage]
              );
            }} 
          />
        )}
        {hasMultipleImages && hasImage && (
          <div className="product-image-dots" aria-label={`${availableImages.length} imágenes disponibles`}>
            {availableImages.map((image, index) => (
              <span
                key={`${image}-${index}`}
                className={index === activeImageIndex ? "active" : ""}
                aria-hidden="true"
              />
            ))}
          </div>
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
