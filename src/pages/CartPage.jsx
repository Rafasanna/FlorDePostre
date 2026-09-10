import { Minus, Plus, Send, Sparkle, Trash2 } from "lucide-react";
import BackLink from "../components/BackLink.jsx";
import { getDisplayImageUrl, getPrimaryProductImage } from "../utils/productImages.js";

function CartPage({
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
  const renderConfigDetails = (item) => {
    if (item.type === "daily" || !item.configuracion) return null;

    return (
      <div className="cart-item-config page-cart-config">
        {item.configuracion.sizeName && <div>Tamaño: {item.configuracion.sizeName}</div>}
        {item.configuracion.porciones && <div>Porciones: {item.configuracion.porciones}</div>}
        {item.configuracion.coberturaName && <div>Cobertura: {item.configuracion.coberturaName}</div>}
        {item.configuracion.fillingsCount && <div>Cantidad de rellenos: {item.configuracion.fillingsCount}</div>}
        {item.configuracion.rellenos?.length > 0 && (
          <div>
            Rellenos: {item.configuracion.rellenos.map((relleno) => `${relleno.nombre}${relleno.precioTexto ? `: ${relleno.precioTexto}` : ""}`).join(", ")}
          </div>
        )}
        {item.configuracion.rellenoExtras?.length > 0 && (
          <div>
            Extras: {item.configuracion.rellenoExtras.map((extra) => `${extra.nombre}${extra.precioTexto ? `: ${extra.precioTexto}` : ""}`).join(", ")}
          </div>
        )}
        {item.configuracion.extras?.length > 0 && (
          <div>
            Agregados de decoración: {item.configuracion.extras.map((extra) => `${extra.nombre}${extra.precioTexto ? `: ${extra.precioTexto}` : ""}`).join(", ")}
          </div>
        )}
        {item.type === "torta" && (
          <>
            <div>Precio unitario: {formatPrice(item.precio)}</div>
            <div>Subtotal: {formatPrice(item.precio * item.quantity)}</div>
          </>
        )}
        {item.configuracion.date && <div>Para el: {item.configuracion.date}</div>}
      </div>
    );
  };

  const renderItemImage = (item) => {
    const image = item.imagen || getPrimaryProductImage(item.product);
    const displayImage = getDisplayImageUrl(image, { width: 160, quality: "eco" });

    return (
      <div className={image ? "cart-item-image" : "cart-item-image placeholder"}>
        {image ? <img src={displayImage} alt={item.nombre} loading="lazy" decoding="async" /> : <Sparkle size={18} />}
      </div>
    );
  };

  return (
    <section className="section page-section">
      <div className="section-heading">
        <span>Resumen</span>
        <h2>Mi pedido</h2>
        <p>Revisá cantidades y enviá el pedido por WhatsApp para confirmar disponibilidad.</p>
        <BackLink to="/" label="Volver al inicio" />
      </div>

      <div className="page-cart">
        {items.length === 0 ? (
          <div className="empty-cart page-empty-cart">
            <p>Agregá productos para armar tu pedido.</p>
          </div>
        ) : (
          <>
            <div className="page-cart-items">
              {items.map((item) => (
                <article className="cart-item page-cart-item" key={item.cartItemId}>
                  <div className="cart-item-main">
                    {renderItemImage(item)}
                    <div>
                      <h3>{item.nombre}</h3>
                      <p>{formatPrice(item.precio)}{item.type === "daily" ? " c/u" : ""}</p>
                      {renderConfigDetails(item)}
                    </div>
                  </div>

                  {item.type === "daily" ? (
                    <div className="quantity-control">
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
                      type="button"
                      onClick={() => onRemoveItem(item.cartItemId)}
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </article>
              ))}
            </div>

            <div className="cart-page-actions">
              <button className="secondary-button" type="button" onClick={onClear}>
                Vaciar pedido
              </button>
            </div>
          </>
        )}

        <div className="cart-footer page-cart-footer">
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
            onClick={(event) => {
              if (items.length === 0) {
                event.preventDefault();
                return;
              }

              const href = getWhatsappHref?.() || null;
              if (!href) {
                event.preventDefault();
                return;
              }

              event.preventDefault();
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
      </div>
    </section>
  );
}

export default CartPage;
