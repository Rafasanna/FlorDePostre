import { Minus, Plus, Send, Trash2 } from "lucide-react";

function Cart({ items, total, onQuantityChange, onClear, whatsappHref, formatPrice }) {
  return (
    <aside className="cart">
      <div className="cart-header">
        <div>
          <span>Resumen</span>
          <h2>Tu pedido</h2>
        </div>
        {items.length > 0 && (
          <button className="icon-button" type="button" onClick={onClear} aria-label="Vaciar carrito">
            <Trash2 size={17} />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <p>Agregá productos para armar tu pedido.</p>
        </div>
      ) : (
        <div className="cart-items">
          {items.map((item) => (
            <div className="cart-item" key={item.id}>
              <div>
                <h3>{item.nombre}</h3>
                <p>{formatPrice(item.precio)} c/u</p>
              </div>
              <div className="quantity-control">
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                  aria-label={`Restar ${item.nombre}`}
                >
                  <Minus size={15} />
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                  aria-label={`Sumar ${item.nombre}`}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cart-total">
        <span>Total (sin envío)</span>
        <strong>{formatPrice(total)}</strong>
      </div>

      <a
        className={`whatsapp-button ${items.length === 0 ? "disabled" : ""}`}
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        aria-disabled={items.length === 0}
      >
        <Send size={18} />
        Pedir por WhatsApp
      </a>
    </aside>
  );
}

export default Cart;
