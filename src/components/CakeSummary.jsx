import { X, ShoppingBag, Edit2 } from "lucide-react";
import { coberturas, tortaSizes, rellenos, tortaExtras } from "../data/tortasData.js";
import { WHATSAPP_URL } from "../config.js";

function CakeSummary({ config, onClose, onEdit, formatPrice, onAddToCart }) {
  const getCobertura = (id) => coberturas.find(c => c.id === id);
  const getSize = (id) => tortaSizes.find(s => s.id === id);
  const getRellenos = (ids) => ids.map(id => rellenos.find(r => r.id === id)).filter(Boolean);
  const getExtras = (ids) => ids.map(id => tortaExtras.find(e => e.id === id)).filter(Boolean);

  const cobertura = getCobertura(config.cobertura);
  const size = getSize(config.size);
  const rellenosList = getRellenos(config.rellenosSeleccionados);
  const extrasList = getExtras(config.extrasSeleccionados);

  let precioEstimado = size.precioBaseEstimado;
  rellenosList.forEach(r => precioEstimado += r.precioExtra);
  extrasList.forEach(e => precioEstimado += e.precioExtra);

  const handleSend = () => {
    const cartItem = {
      type: 'torta',
      product: { id: 'torta-personalizada' },
      nombre: 'Torta Personalizada',
      precio: precioEstimado,
      quantity: 1,
      configuracion: {
        coberturaId: cobertura.id,
        coberturaName: cobertura.nombre,
        sizeId: size.id,
        sizeName: size.nombre,
        rellenos: rellenosList,
        extras: extrasList,
        date: config.date,
        comments: config.comments
      }
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <>
      <div className="cart-overlay open" onClick={onClose} />
      <aside className="cart-drawer open configurator-drawer cake-summary">
        <div className="cart-header">
          <div>
            <span>Resumen</span>
            <h2>Tu Torta</h2>
          </div>
          <button className="icon-button close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-items summary-body">
          <div className="summary-card">
            <div className="summary-row">
              <span className="summary-label">Cobertura</span>
              <span className="summary-value">{cobertura?.nombre}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tamaño</span>
              <span className="summary-value">{size?.nombre}</span>
            </div>
            
            {rellenosList.length > 0 && (
              <div className="summary-row column">
                <span className="summary-label">Rellenos</span>
                <ul>
                  {rellenosList.map(r => <li key={r.id}>{r.nombre}</li>)}
                </ul>
              </div>
            )}

            {extrasList.length > 0 && (
              <div className="summary-row column">
                <span className="summary-label">Extras</span>
                <ul>
                  {extrasList.map(e => <li key={e.id}>{e.nombre}</li>)}
                </ul>
              </div>
            )}

            <div className="summary-row">
              <span className="summary-label">Fecha</span>
              <span className="summary-value">{config.date}</span>
            </div>
          </div>

          <div className="summary-disclaimer">
            <p><strong>Importante:</strong> Las tortas se piden con 5 días de anticipación y no se preparan para domingos. El precio final puede variar según la complejidad del diseño, la decoración específica solicitada y la disponibilidad de la fecha.</p>
          </div>
        </div>

        <div className="cart-footer">
          <div className="cart-total" style={{ marginBottom: '16px' }}>
            <span>Precio Base Estimado</span>
            <strong>{formatPrice(precioEstimado)}</strong>
          </div>

          <div className="step-footer">
            <button className="secondary-button" onClick={onEdit} style={{ flex: 'none', padding: '12px' }}>
              <Edit2 size={18} />
            </button>
            <button className="primary-button whatsapp-button" onClick={handleSend} style={{ flex: 1 }}>
              <ShoppingBag size={18} />
              Agregar a Mi pedido
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default CakeSummary;
