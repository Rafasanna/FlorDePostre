import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight } from "lucide-react";
import { coberturas, tortaSizes, rellenos, tortaExtras } from "../data/tortasData.js";
import CakeSummary from "./CakeSummary.jsx";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);

function CakeConfigurator({ onClose, onAddToCart }) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    cobertura: null,
    size: null,
    rellenosSeleccionados: [],
    extrasSeleccionados: [],
    date: "",
    comments: ""
  });

  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  })();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = '';
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const toggleRelleno = (id) => {
    setConfig(prev => {
      const isSelected = prev.rellenosSeleccionados.includes(id);
      if (isSelected) {
        return { ...prev, rellenosSeleccionados: prev.rellenosSeleccionados.filter(r => r !== id) };
      } else {
        // En un futuro podríamos limitar la cantidad máxima de rellenos aquí
        return { ...prev, rellenosSeleccionados: [...prev.rellenosSeleccionados, id] };
      }
    });
  };

  const toggleExtra = (id) => {
    setConfig(prev => {
      const isSelected = prev.extrasSeleccionados.includes(id);
      if (isSelected) {
        return { ...prev, extrasSeleccionados: prev.extrasSeleccionados.filter(e => e !== id) };
      } else {
        return { ...prev, extrasSeleccionados: [...prev.extrasSeleccionados, id] };
      }
    });
  };

  if (step === 6) {
    return createPortal(
      <CakeSummary config={config} onClose={onClose} onEdit={() => setStep(1)} formatPrice={formatPrice} onAddToCart={onAddToCart} />,
      document.body
    );
  }

  return createPortal(
    <>
      <div className="cart-overlay open" onClick={onClose} />
      <aside className="cart-drawer open configurator-drawer cake-configurator">
        <div className="cart-header">
          <div>
            <span>Paso {step} de 5</span>
            <h2>Diseñá tu torta</h2>
          </div>
          <button className="icon-button close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-items configurator-body">
          {step === 1 && (
            <div className="form-group slide-in">
              <label>Elegí la cobertura *</label>
              <div className="options-grid">
                {coberturas.map(c => (
                  <button 
                    key={c.id}
                    className={`option-btn ${config.cobertura === c.id ? 'selected' : ''}`}
                    onClick={() => setConfig({...config, cobertura: c.id})}
                  >
                    <strong>{c.nombre}</strong>
                    <small>{c.descripcion}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form-group slide-in">
              <label>Elegí el tamaño *</label>
              <div className="options-grid">
                {tortaSizes.map(s => (
                  <button 
                    key={s.id}
                    className={`option-btn ${config.size === s.id ? 'selected' : ''}`}
                    onClick={() => setConfig({...config, size: s.id})}
                  >
                    <strong>{s.nombre}</strong>
                    <small>{s.porciones}</small>
                    <span className="price-tag">Base: {formatPrice(s.precioBaseEstimado)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form-group slide-in">
              <label>Rellenos (Múltiples opciones)</label>
              <div className="options-list">
                {rellenos.map(r => {
                  const isSelected = config.rellenosSeleccionados.includes(r.id);
                  return (
                    <div 
                      key={r.id} 
                      className={`option-list-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleRelleno(r.id)}
                    >
                      <div className="checkbox-dummy">
                        {isSelected && <div className="checkbox-inner" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{r.nombre}</strong>
                      </div>
                      {r.precioExtra > 0 && <span className="price-extra">+{formatPrice(r.precioExtra)}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="form-group slide-in">
              <label>Extras y Decoración</label>
              <div className="options-list">
                {tortaExtras.map(e => {
                  const isSelected = config.extrasSeleccionados.includes(e.id);
                  return (
                    <div 
                      key={e.id} 
                      className={`option-list-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleExtra(e.id)}
                    >
                      <div className="checkbox-dummy">
                        {isSelected && <div className="checkbox-inner" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong>{e.nombre}</strong>
                      </div>
                      <span className="price-extra">+{formatPrice(e.precioExtra)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="form-group slide-in">
              <label>¿Para qué fecha la necesitás? (Mínimo 5 días) *</label>
              <input 
                type="date" 
                className="form-input" 
                value={config.date} 
                min={minDate}
                onChange={(e) => setConfig({...config, date: e.target.value})} 
              />
              
              <label style={{ marginTop: '24px' }}>Diseño y Comentarios</label>
              <textarea 
                className="form-input" 
                placeholder="Describí los colores, la temática o el diseño. Luego podrás enviarnos fotos de referencia por WhatsApp."
                value={config.comments}
                onChange={(e) => setConfig({...config, comments: e.target.value})}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="cart-footer step-footer">
          {step > 1 ? (
            <button className="secondary-button" onClick={handlePrev}>
              Atrás
            </button>
          ) : <div></div>}
          
          <button
            className="primary-button"
            onClick={handleNext}
            disabled={
              (step === 1 && !config.cobertura) || 
              (step === 2 && !config.size) || 
              (step === 5 && !config.date)
            }
          >
            {step === 5 ? "Ver Resumen" : "Siguiente"}
            {step !== 5 && <ArrowRight size={16} />}
          </button>
        </div>
      </aside>
    </>,
    document.body
  );
}

export default CakeConfigurator;
