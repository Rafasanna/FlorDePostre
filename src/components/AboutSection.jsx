import { useEffect, useRef, useState } from "react";
import { Sparkle } from "lucide-react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";

const historyParagraphs = [
  {
    type: "subtitle",
    title: "2015 · El comienzo"
  },
  {
    type: "paragraph",
    text: "Flor de Postre nace en 2015, impulsada por el sueño de una estudiante apasionada por la pastelería y por una tradición familiar ligada a la cocina."
  },
  {
    type: "paragraph",
    text: "Lo que comenzó como un pequeño proyecto fue creciendo junto a años de formación, capacitaciones y experiencias que ayudaron a transformar esa pasión en una profesión."
  },
  {
    type: "paragraph",
    text: "Cada curso, cada receta y cada desafío fueron construyendo la identidad de una marca que busca transmitir amor, dedicación y calidad en cada detalle."
  },
  {
    type: "subtitle",
    title: "2021 · Nuestro primer local"
  },
  {
    type: "paragraph",
    text: "En 2021 dimos un gran paso con la apertura de nuestro primer local físico, un espacio pensado para recibir a nuestros clientes y compartir momentos especiales a través de nuestras creaciones."
  },
  {
    type: "subtitle",
    title: "Hoy · Seguimos creciendo"
  },
  {
    type: "paragraph",
    text: "Hoy, Flor de Postre es una empresa consolidada en la ciudad, reconocida por la calidad de sus productos, la atención cercana y el compromiso de seguir creando experiencias que acompañen los momentos más importantes de cada persona."
  },
  {
    type: "paragraph",
    text: "Creemos que detrás de cada torta, cada desayuno y cada mesa dulce hay una historia para celebrar. Y nos sentimos felices de ser parte de ella."
  }
];

const brandValues = [
  {
    title: "Compromiso",
    text: "Creemos que cada pedido representa un momento importante para quien lo recibe. Por eso trabajamos con dedicación, responsabilidad y cercanía, cuidando cada detalle desde la atención hasta la entrega final."
  },
  {
    title: "Mejora continua",
    text: "La pasión por la pastelería nos impulsa a aprender y crecer constantemente. Buscamos perfeccionar nuestros procesos, incorporar nuevas técnicas y seguir capacitándonos para ofrecer experiencias cada vez mejores."
  },
  {
    title: "Calidad",
    text: "La calidad es la base de todo lo que hacemos. Seleccionamos cuidadosamente nuestros ingredientes y cuidamos cada etapa de elaboración para ofrecer productos que destaquen por su sabor, presentación y excelencia."
  }
];

function AboutSection() {
  const sectionRef = useIntersectionObserver();
  const revealRefs = useRef([]);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const revealItems = revealRefs.current.filter(Boolean);

    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.18 }
    );

    revealItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

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
            <div className="about-image-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb, var(--color-rose-light) 50%, transparent)', height: '100%', minHeight: '300px', borderRadius: '24px', color: 'var(--color-text)', border: '1px dashed var(--color-rose-old)' }}>
              <Sparkle size={48} style={{ marginBottom: '12px' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>Flor de Postre</span>
            </div>
          )}
        </div>
        <div className="about-text">
          {historyParagraphs.map((item, index) => {
            if (item.type === "subtitle") {
              return (
                <h3
                  className="about-story-subtitle about-reveal"
                  key={item.title}
                  ref={(element) => {
                    revealRefs.current[index] = element;
                  }}
                  style={{ transitionDelay: `${index * 55}ms` }}
                >
                  {item.title}
                </h3>
              );
            }

            return (
              <p
                className="about-history-paragraph about-reveal"
                key={item.text}
                ref={(element) => {
                  revealRefs.current[index] = element;
                }}
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                {item.text}
              </p>
            );
          })}
        </div>
      </div>

      <div className="values-grid">
        {brandValues.map((value, index) => (
          <article
            className="about-value-card about-reveal"
            key={value.title}
            ref={(element) => {
              revealRefs.current[historyParagraphs.length + index] = element;
            }}
            style={{ transitionDelay: `${index * 90}ms` }}
          >
            <h3>{value.title}</h3>
            <p>{value.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AboutSection;
