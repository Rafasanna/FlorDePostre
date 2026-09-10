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
  const [failedImages, setFailedImages] = useState([]);
  const availableImages = tortasCarouselImages.filter((image) => !failedImages.includes(image));
  const normalizedImageIndex = availableImages.length
    ? ((activeImageIndex % availableImages.length) + availableImages.length) % availableImages.length
    : 0;

  useEffect(() => {
    if (availableImages.length > 0 && activeImageIndex >= availableImages.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, availableImages.length]);

  const goToPreviousImage = () => {
    if (availableImages.length === 0) return;

    setActiveImageIndex((index) => (index - 1 + availableImages.length) % availableImages.length);
  };

  const goToNextImage = () => {
    if (availableImages.length === 0) return;

    setActiveImageIndex((index) => (index + 1) % availableImages.length);
  };

  const handleImageError = (image) => {
    setFailedImages((current) => (current.includes(image) ? current : [...current, image]));
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
            {availableImages.map((image, index) => {
              const isActive = index === normalizedImageIndex;

              return (
                <img
                  key={image}
                  className={`tortas-carousel-slide ${isActive ? "active" : ""}`}
                  src={image}
                  alt={isActive ? "Ejemplo de torta personalizada de Flor de Postre" : ""}
                  aria-hidden={!isActive}
                  loading="eager"
                  fetchPriority={isActive ? "high" : "low"}
                  decoding="async"
                  onError={() => handleImageError(image)}
                />
              );
            })}
            {availableImages.length > 1 && (
              <>
                <button className="tortas-carousel-control previous" type="button" onClick={goToPreviousImage} aria-label="Imagen anterior de torta personalizada">
                  ‹
                </button>
                <button className="tortas-carousel-control next" type="button" onClick={goToNextImage} aria-label="Imagen siguiente de torta personalizada">
                  ›
                </button>
                <div className="tortas-carousel-dots">
                  {availableImages.map((image, index) => (
                    <button
                      key={image}
                      className={index === normalizedImageIndex ? "active" : ""}
                      type="button"
                      aria-label={`Ver imagen ${index + 1} de ${availableImages.length}`}
                      aria-current={index === normalizedImageIndex ? "true" : undefined}
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
            id="cake-configurator-start"
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
