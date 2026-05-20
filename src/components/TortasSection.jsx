import { useState } from "react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import CakeConfigurator from "./CakeConfigurator.jsx";
import BackLink from "./BackLink.jsx";

function TortasSection({ onAddToCart }) {
  const sectionRef = useIntersectionObserver();
  const [isConfiguring, setIsConfiguring] = useState(false);

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
          <div className="torta-placeholder skeleton-pulse" style={{ height: '300px', borderRadius: '24px' }}></div>
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
        />
      )}
    </section>
  );
}

export default TortasSection;
