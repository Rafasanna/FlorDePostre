import { useEffect } from "react";
import { Minus, Plus, Send, Trash2, X } from "lucide-react";

function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  onQuantityChange,
  onRemoveItem,
  onClear,
  whatsappHref,
  getWhatsappHref,
  validationMessage,
  formatPrice
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scrolling when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const renderConfigDetails = (item) => {
    if (item.type === 'daily') return null;

    return (
      <div className="cart-item-config" style={{ fontSize: '0.85rem', color: 'var(--cocoa-soft)', marginTop: '4px' }}>
        {item.configuracion.sizeName && <div>• Tamaño: {item.configuracion.sizeName}</div>}
        {item.configuracion.coberturaName && <div>• Cobertura: {item.configuracion.coberturaName}</div>}
        {item.configuracion.rellenos && item.configuracion.rellenos.length > 0 && (
          <div>• Rellenos: {item.configuracion.rellenos.map(r => r.nombre).join(', ')}</div>
        )}
        {item.configuracion.extras && item.configuracion.extras.length > 0 && (
          <div>• Extras: {item.configuracion.extras.map(e => e.nombre).join(', ')}</div>
        )}
        {item.configuracion.date && <div style={{ color: 'var(--rose-500)', marginTop: '4px' }}>• Para el: {item.configuracion.date}</div>}
      </div>
    );
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`cart-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Carrito de compras">
        <div className="cart-header">
          <div>
            <span>Resumen</span>
            <h2>Mi pedido</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {items.length > 0 && (
              <button className="icon-button" type="button" onClick={onClear} aria-label="Vaciar carrito">
                <Trash2 size={17} />
              </button>
            )}
            <button className="icon-button close-btn" type="button" onClick={onClose} aria-label="Cerrar carrito">
              <X size={20} />
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Agregá productos para armar tu pedido.</p>
          </div>
        ) : (
          <div className="cart-items">
            {items.map((item) => (
              <div className="cart-item" key={item.cartItemId} style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <h3>{item.nombre}</h3>
                  <p>{formatPrice(item.precio)} c/u</p>
                  {renderConfigDetails(item)}
                </div>
                {item.type === 'daily' ? (
                  <div className="quantity-control" style={{ marginTop: '0' }}>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(item.cartItemId, item.quantity - 1)}
                      aria-label={`Restar ${item.nombre}`}
                    >
                      <Minus size={15} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(item.cartItemId, item.quantity + 1)}
                      aria-label={`Sumar ${item.nombre}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="icon-button"
                    style={{ color: 'var(--cocoa-soft)' }}
                    onClick={() => onRemoveItem(item.cartItemId)}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            
            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>Aclaraciones del pedido</label>
              <textarea 
                className="form-input"
                placeholder="Ej: Necesito retirar a las 18hs..."
                rows={2}
                id="cart-aclaraciones"
              />
            </div>
          </div>
        )}

        <div className="cart-footer">
          <div className="cart-total">
            <span>Total estimado (sin envío)</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <a
            className={`whatsapp-button ${items.length === 0 ? "disabled" : ""}`}
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            aria-disabled={items.length === 0}
            onClick={(e) => {
              if (items.length === 0) {
                e.preventDefault();
                return;
              }
              const aclaraciones = document.getElementById('cart-aclaraciones')?.value || '';
              const href = getWhatsappHref?.(aclaraciones) || null;
              if (!href) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              window.open(href, "_blank", "noopener,noreferrer");
            }}
          >
            <Send size={18} />
            Pedir por WhatsApp
          </a>
          {validationMessage && (
            <p className="help-text">{validationMessage}</p>
          )}
        </div>
      </aside>
    </>
  );
}

export default CartDrawer;
