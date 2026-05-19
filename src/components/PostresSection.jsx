import { useState } from "react";
import { postresBase } from "../data/postresData.js";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import PostreConfigurator from "./PostreConfigurator.jsx";

function PostresSection({ onAddToCart }) {
  const sectionRef = useIntersectionObserver();
  const [selectedPostre, setSelectedPostre] = useState(null);

  return (
    <section className="section page-section reveal-fade" id="postres" ref={sectionRef}>
      <div className="section-heading">
        <span>Postres por encargue</span>
        <h2>Los clásicos que nunca fallan</h2>
        <p>
          Elegí tu postre favorito, seleccioná el tamaño y reservalo para tu próxima fecha especial.
        </p>
      </div>

      <div className="postres-grid">
        {postresBase.map((postre) => (
          <article 
            key={postre.id} 
            className="product-card postre-card"
            onClick={() => setSelectedPostre(postre)}
            style={{ cursor: 'pointer', gridTemplateRows: 'auto 1fr' }} // Override grid since no image currently
          >
            <div className="product-info">
              <div>
                <h3>{postre.nombre}</h3>
                <p>{postre.descripcion}</p>
              </div>
              <div className="product-footer" style={{ marginTop: '16px' }}>
                <button type="button" style={{ width: '100%' }}>Encargar</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {selectedPostre && (
        <PostreConfigurator 
          postre={selectedPostre} 
          onClose={() => setSelectedPostre(null)} 
          onAddToCart={onAddToCart}
        />
      )}
    </section>
  );
}

export default PostresSection;
