import { useEffect, useState } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import CakeConfigurator from "./CakeConfigurator.jsx";
import BackLink from "./BackLink.jsx";

const tortasCarouselImages = [
  "/images/tortas-carousel/portada.jpg",
  "/images/tortas-carousel/torta-1.jpg",
  "/images/tortas-carousel/torta-2.jpg",
  "/images/tortas-carousel/torta-3.jpg",
  "/images/tortas-carousel/torta-4.jpg"
];

function TortasSection({ onAddToCart, tortaSizes, coberturas, rellenos, tortaExtras }) {
  const sectionRef = useIntersectionObserver();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [visibleImageIndex, setVisibleImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState([]);
  const [loadedImages, setLoadedImages] = useState([]);
  const availableImages = tortasCarouselImages.filter((image) => !failedImages.includes(image));
  const availableImagesKey = availableImages.join("|");
  const normalizedImageIndex = availableImages.length
    ? ((activeImageIndex % availableImages.length) + availableImages.length) % availableImages.length
    : 0;
  const normalizedVisibleImageIndex = availableImages.length
    ? Math.min(visibleImageIndex, availableImages.length - 1)
    : 0;

  useEffect(() => {
    tortasCarouselImages.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    const timer = window.setInterval(() => {
      setActiveImageIndex((index) => index + 1);
    }, 4000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const nextImage = availableImages[normalizedImageIndex];

    if (nextImage && loadedImages.includes(nextImage)) {
      setVisibleImageIndex(normalizedImageIndex);
    }
  }, [availableImagesKey, loadedImages, normalizedImageIndex]);

  const goToPreviousImage = () => {
    setActiveImageIndex((index) => index - 1 + availableImages.length);
  };

  const goToNextImage = () => {
    setActiveImageIndex((index) => index + 1);
  };

  const handleImageError = (image) => {
    setFailedImages((current) => (current.includes(image) ? current : [...current, image]));
  };

  const handleImageLoad = (image) => {
    setLoadedImages((current) => (current.includes(image) ? current : [...current, image]));
  };

  return (
    <section className="section page-section reveal-fade" id="tortas" ref={sectionRef}>
      <div className="section-heading">
        <span>Tortas Personalizadas</span>
        <h2>Para celebrar momentos únicos</h2>
        <p>
          Diseñá tu torta a medida. Elegí el tamaño, la cobertura, los rellenos y los extras para tu evento.
        </p>
        <BackLink to="/" label="Volver al inicio" />
      </div>

      <div className="tortas-intro">
        <div className="tortas-visual">
          <div className={`tortas-carousel ${availableImages.length === 0 ? "torta-placeholder" : ""}`}>
            {availableImages.map((image, index) => (
              <img
                key={image}
                className={`tortas-carousel-slide ${index === normalizedVisibleImageIndex ? "active" : ""}`}
                src={image}
                alt=""
                aria-hidden="true"
                loading="eager"
                onError={() => handleImageError(image)}
                onLoad={() => handleImageLoad(image)}
              />
            ))}
            {availableImages.length > 1 && (
              <>
                <button className="tortas-carousel-control previous" type="button" onClick={goToPreviousImage} aria-label="Imagen anterior">
                  ‹
                </button>
                <button className="tortas-carousel-control next" type="button" onClick={goToNextImage} aria-label="Imagen siguiente">
                  ›
                </button>
                <div className="tortas-carousel-dots" aria-hidden="true">
                  {availableImages.map((image, index) => (
                    <button
                      key={image}
                      className={index === normalizedVisibleImageIndex ? "active" : ""}
                      type="button"
                      tabIndex={-1}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="tortas-copy">
          <h3>Armá tu torta en 5 simples pasos</h3>
          <p className="cake-order-note">
            Las tortas se piden con 5 días de anticipación. Si la necesitás antes, consultanos igual porque a veces podemos resolverlo según disponibilidad.
          </p>
          <ul className="pasos-lista">
            <li><strong>1.</strong> Cobertura</li>
            <li><strong>2.</strong> Tamaño</li>
            <li><strong>3.</strong> Rellenos</li>
            <li><strong>4.</strong> Extras y decoración</li>
            <li><strong>5.</strong> Detalles y fecha</li>
          </ul>
          <button 
            className="primary-button" 
            onClick={() => setIsConfiguring(true)}
            style={{ marginTop: '24px', width: '100%', padding: '16px' }}
          >
            Diseñar mi torta
          </button>
        </div>
      </div>

      {isConfiguring && (
        <CakeConfigurator 
          onClose={() => setIsConfiguring(false)} 
          onAddToCart={onAddToCart}
          tortaSizes={tortaSizes}
          coberturas={coberturas}
          rellenos={rellenos}
          tortaExtras={tortaExtras}
        />
      )}
    </section>
  );
}

export default TortasSection;
