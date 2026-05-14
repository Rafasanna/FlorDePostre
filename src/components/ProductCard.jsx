import { useState } from "react";
import { Plus, Sparkle, Check } from "lucide-react";

function ProductCard({ product, quantity, onAdd, formatPrice }) {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    onAdd(product);
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
    }, 3000);
  };

  return (
    <article className="product-card">
      <div className={product.imagen ? "product-media" : "product-media placeholder"}>
        {product.imagen ? (
          <img src={product.imagen} alt={product.nombre} />
        ) : (
          <div className="placeholder-content">
            <Sparkle size={26} />
            <span>Flor de Postre</span>
          </div>
        )}
        <span className="product-category">{product.categoria}</span>
      </div>
      <div className="product-info">
        <div>
          <h3>{product.nombre}</h3>
          <p>{product.descripcion}</p>
        </div>
        <div className="product-footer">
          <strong>{formatPrice(product.precio)}</strong>
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
