import { X, ShoppingBag, Edit2 } from "lucide-react";
import {
  coberturas as fallbackCoberturas,
  tortaSizes as fallbackTortaSizes,
  rellenos as fallbackRellenos,
  tortaExtras as fallbackTortaExtras
} from "../data/tortasData.js";
import { WHATSAPP_URL } from "../config.js";

function CakeSummary({
  config,
  onClose,
  onEdit,
  formatPrice,
  onAddToCart,
  tortaSizes = fallbackTortaSizes,
  coberturas = fallbackCoberturas,
  rellenos = fallbackRellenos,
  tortaExtras = fallbackTortaExtras
}) {
  const safeConfig = config || {};
  const safeCoberturas = Array.isArray(coberturas) ? coberturas : [];
  const safeTortaSizes = Array.isArray(tortaSizes) ? tortaSizes : [];
  const safeRellenos = Array.isArray(rellenos) ? rellenos : [];
  const safeTortaExtras = Array.isArray(tortaExtras) ? tortaExtras : [];
  const selectedRellenos = Array.isArray(safeConfig.rellenosSeleccionados) ? safeConfig.rellenosSeleccionados : [];
  const selectedExtras = Array.isArray(safeConfig.extrasSeleccionados) ? safeConfig.extrasSeleccionados : [];

  const getCobertura = (id) => safeCoberturas.find(c => c.id === id);
  const getSize = (id) => safeTortaSizes.find(s => s.id === id);
  const getRellenos = (ids) => ids.map(id => safeRellenos.find(r => r.id === id)).filter(Boolean);
  const getExtras = (ids) => ids.map(id => safeTortaExtras.find(e => e.id === id)).filter(Boolean);

  const cobertura = getCobertura(safeConfig.cobertura);
  const size = getSize(safeConfig.size);
  const rellenosList = getRellenos(selectedRellenos);
  const extrasList = getExtras(selectedExtras);

  let precioEstimado = Number.isFinite(size?.precioBaseEstimado) ? size.precioBaseEstimado : 0;
  rellenosList.forEach(r => {
    precioEstimado += Number.isFinite(r.precioExtra) ? r.precioExtra : 0;
  });
  extrasList.forEach(e => {
    precioEstimado += Number.isFinite(e.precioExtra) ? e.precioExtra : 0;
  });
  const canAddToCart = Boolean(size && cobertura && Number.isFinite(precioEstimado));

  const handleSend = () => {
    if (!canAddToCart) return;

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
        date: safeConfig.date,
        comments: safeConfig.comments
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
              <span className="summary-value">{cobertura?.nombre || ""}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tamaño</span>
              <span className="summary-value">{size?.nombre || ""}</span>
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
              <span className="summary-value">{safeConfig.date || ""}</span>
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
            <button className="primary-button whatsapp-button" onClick={handleSend} disabled={!canAddToCart} style={{ flex: 1 }}>
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
