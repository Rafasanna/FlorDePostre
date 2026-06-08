import { X, ShoppingBag, Edit2 } from "lucide-react";
import {
  coberturas as fallbackCoberturas,
  enrichCakeFilling,
  enrichCakeExtra,
  getCakeOptionDisplayKey,
  getCakePriceOption,
  getCakeSizePrice,
  tortaSizes as fallbackTortaSizes,
  rellenos as fallbackRellenos,
  tortaExtras as fallbackTortaExtras
} from "../data/tortasData.js";

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
  const rellenosByDisplayName = new Map(
    [...fallbackRellenos, ...(Array.isArray(rellenos) ? rellenos : [])]
      .filter(Boolean)
      .map((relleno) => [getCakeOptionDisplayKey(relleno), relleno])
  );
  const safeRellenos = Array.from(rellenosByDisplayName.values());
  const extrasById = new Map(
    [...fallbackTortaExtras, ...(Array.isArray(tortaExtras) ? tortaExtras : [])]
      .filter(Boolean)
      .map((extra) => [getCakeOptionDisplayKey(extra), extra])
  );
  const safeTortaExtras = Array.from(extrasById.values());
  const selectedRellenos = Array.isArray(safeConfig.rellenosSeleccionados) ? safeConfig.rellenosSeleccionados : [];
  const selectedExtras = Array.isArray(safeConfig.extrasSeleccionados) ? safeConfig.extrasSeleccionados : [];

  const getCobertura = (id) => safeCoberturas.find(c => c.id === id);
  const getSize = (id) => safeTortaSizes.find(s => s.id === id);
  const getRellenos = (ids) => ids.map(id => safeRellenos.find(r => r.id === id)).filter(Boolean);
  const getExtras = (ids) => ids.map(id => safeTortaExtras.find(e => e.id === id)).filter(Boolean);

  const cakeOption = getCakePriceOption(safeConfig.cobertura);
  const cobertura = getCobertura(cakeOption?.coberturaId) || cakeOption;
  const size = getSize(safeConfig.size);
  const rellenosList = getRellenos(selectedRellenos).map((relleno) => enrichCakeFilling(relleno, formatPrice));
  const sizePrice = getCakeSizePrice(safeConfig.cobertura, size);
  const cakeBasePrice = Number.isFinite(sizePrice?.price) ? sizePrice.price : 0;
  const extrasList = getExtras(selectedExtras).map((extra) => enrichCakeExtra(extra, cakeBasePrice, formatPrice));
  const requiredFillings = cakeOption?.fillings || 0;
  const hasValidFillings = requiredFillings > 0 && rellenosList.length === requiredFillings;
  const rellenosTotal = rellenosList.reduce((sum, relleno) => sum + (Number.isFinite(relleno.precioCalculado) ? relleno.precioCalculado : 0), 0);
  const extrasTotal = extrasList.reduce((sum, extra) => sum + (Number.isFinite(extra.precioCalculado) ? extra.precioCalculado : 0), 0);

  const precioEstimado = cakeBasePrice + rellenosTotal + extrasTotal;
  const canAddToCart = Boolean(size && cobertura && sizePrice && hasValidFillings);

  const handleSend = () => {
    if (!canAddToCart) return;

    const cartItem = {
      type: 'torta',
      product: { id: 'torta-personalizada' },
      nombre: 'Torta por encargo',
      precio: precioEstimado,
      quantity: 1,
      configuracion: {
        cakeOptionId: cakeOption.id,
        cakeOptionName: cakeOption.nombre,
        coberturaId: cakeOption.coberturaId,
        coberturaName: `${cakeOption.nombre}, ${cakeOption.fillings} rellenos`,
        fillingsCount: cakeOption.fillings,
        sizeId: size.id,
        sizeName: sizePrice.nombre,
        porciones: sizePrice.porciones,
        rellenos: rellenosList,
        rellenosTotal,
        extras: extrasList,
        cakeBasePrice,
        extrasTotal,
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
              <span className="summary-value">{cakeOption ? `${cakeOption.nombre}, ${cakeOption.fillings} rellenos` : ""}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Tamaño</span>
              <span className="summary-value">{sizePrice?.nombre || size?.nombre || ""}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Porciones</span>
              <span className="summary-value">{sizePrice?.porciones || size?.porciones || ""}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Cantidad de rellenos</span>
              <span className="summary-value">{requiredFillings ? `${requiredFillings}` : ""}</span>
            </div>
            
            {rellenosList.length > 0 && (
              <div className="summary-row column">
                <span className="summary-label">Rellenos</span>
                <ul>
                  {rellenosList.map(r => (
                    <li key={r.id}>
                      {r.nombre}{r.precioTexto ? `: ${r.precioTexto}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {extrasList.length > 0 && (
              <div className="summary-row column">
                <span className="summary-label">Extras</span>
                <ul>
                  {extrasList.map(e => (
                    <li key={e.id}>
                      {e.nombre}{e.precioTexto ? `: ${e.precioTexto}` : ""}
                    </li>
                  ))}
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
            <span>Precio estimado</span>
            <strong>{formatPrice(precioEstimado)}</strong>
          </div>
          {!canAddToCart && (
            <p className="help-text">
              Revisá cobertura, tamaño y cantidad de rellenos antes de agregar la torta.
            </p>
          )}

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
