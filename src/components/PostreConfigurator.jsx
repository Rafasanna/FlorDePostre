import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShoppingBag } from "lucide-react";
import { postresSizes } from "../data/postresData.js";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);

function PostreConfigurator({ postre, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState(null);
  const [date, setDate] = useState("");
  const [comments, setComments] = useState("");

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = '';
  }, []);

  const handleSend = () => {
    if (!selectedSize || !date) return;
    
    const sizeObj = postresSizes.find(s => s.id === selectedSize);
    
    const cartItem = {
      type: 'postre',
      product: postre,
      nombre: postre.nombre,
      precio: sizeObj.precioEstimado, // Precio base
      quantity: 1,
      configuracion: {
        sizeId: sizeObj.id,
        sizeName: sizeObj.nombre,
        date,
        comments
      }
    };

    onAddToCart(cartItem);
    onClose();
  };

  const isFormValid = selectedSize && date;

  return createPortal(
    <>
      <div className="cart-overlay open" onClick={onClose} />
      <aside className="cart-drawer open configurator-drawer">
        <div className="cart-header">
          <div>
            <span>Configurar pedido</span>
            <h2>{postre.nombre}</h2>
          </div>
          <button className="icon-button close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-items configurator-body">
          <div className="form-group">
            <label>1. Elegí el tamaño *</label>
            <div className="options-grid">
              {postresSizes.map((size) => (
                <button
                  key={size.id}
                  className={`option-btn ${selectedSize === size.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size.id)}
                >
                  <strong>{size.nombre}</strong>
                  <small>{size.porciones}</small>
                  <span className="price-tag">~{formatPrice(size.precioEstimado)}</span>
                </button>
              ))}
            </div>
            <small className="help-text">El precio puede variar levemente según el sabor y adicionales.</small>
          </div>

          <div className="form-group">
            <label>2. ¿Para qué fecha lo necesitás? (Mínimo 2 días) *</label>
            <input 
              type="date" 
              className="form-input" 
              value={date} 
              min={minDate}
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>3. Comentarios opcionales</label>
            <textarea 
              className="form-input" 
              placeholder="Ej: Lo necesito para la tarde, es para un cumpleaños..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="cart-footer">
          <button
            className={`primary-button whatsapp-button ${!isFormValid ? "disabled" : ""}`}
            onClick={handleSend}
            disabled={!isFormValid}
          >
            <ShoppingBag size={18} />
            Agregar a Mi pedido
          </button>
        </div>
      </aside>
    </>,
    document.body
  );
}

export default PostreConfigurator;
