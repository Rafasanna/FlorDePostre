import { useState } from "react";
import { Sparkle } from "lucide-react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import LocationsSection from "./LocationsSection.jsx";

function AboutSection() {
  const sectionRef = useIntersectionObserver();
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <section className="about section page-section reveal-fade" id="sobre-nosotras" ref={sectionRef}>
      <div className="section-heading compact">
        <span>Nuestra Historia</span>
        <h2>Sobre Flor de Postre</h2>
      </div>

      <div className="about-content">
        <div className="about-image skeleton-pulse">
          {!imageFailed ? (
            <img 
              src="/images/sobre-flor.jpg" 
              alt="Flor de Postre" 
              onError={() => setImageFailed(true)} 
              style={{ width: '100%', borderRadius: '24px', objectFit: 'cover', height: '100%' }} 
            />
          ) : (
            <div className="about-image-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 237, 245, 0.5)', height: '100%', minHeight: '300px', borderRadius: '24px', color: 'var(--rose-500)', border: '1px dashed var(--rose-old)' }}>
              <Sparkle size={48} style={{ marginBottom: '12px' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Flor de Postre</span>
            </div>
          )}
        </div>
        <div className="about-text">
          <p>
            Flor de Postre nace con la idea de crear productos de pastelería artesanal de alta calidad, cuidando cada detalle del proceso y la experiencia de cada cliente.
          </p>
          <p>
            Buscamos que cada pedido combine sabor, estética y calidez, manteniendo una atención cercana y una identidad delicada en cada elaboración.
          </p>
        </div>
      </div>

      <div className="values-grid">
        <article>
          <h3>Artesanía y cuidado</h3>
          <p>Productos hechos con dedicación, respetando los tiempos y detalles de cada elaboración.</p>
        </article>
        <article>
          <h3>Calidad constante</h3>
          <p>Trabajamos para que cada producto mantenga el nivel de sabor, presentación y cuidado que caracteriza a Flor de Postre.</p>
        </article>
        <article>
          <h3>Calidez en la atención</h3>
          <p>Acompañamos cada pedido con cercanía, buscando que la experiencia sea simple, linda y personalizada.</p>
        </article>
      </div>

      <LocationsSection />
    </section>
  );
}

export default AboutSection;
