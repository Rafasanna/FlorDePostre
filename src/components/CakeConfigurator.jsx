import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ArrowRight } from "lucide-react";
import {
  coberturas as fallbackCoberturas,
  tortaSizes as fallbackTortaSizes,
  rellenos as fallbackRellenos,
  tortaExtras as fallbackTortaExtras
} from "../data/tortasData.js";
import CakeSummary from "./CakeSummary.jsx";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const monthFormatter = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric"
});

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (dateValue) => new Date(`${dateValue}T12:00:00`);

function CakeConfigurator({
  onClose,
  onAddToCart,
  tortaSizes = fallbackTortaSizes,
  coberturas = fallbackCoberturas,
  rellenos = fallbackRellenos,
  tortaExtras = fallbackTortaExtras
}) {
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
    return toDateInputValue(d);
  })();
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const min = parseDateValue(minDate);
    return new Date(min.getFullYear(), min.getMonth(), 1);
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => document.body.style.overflow = '';
  }, []);

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const isSunday = (dateValue) => {
    if (!dateValue) return false;
    return parseDateValue(dateValue).getDay() === 0;
  };

  const handleDateChange = (dateValue) => {
    setConfig(prev => ({ ...prev, date: dateValue }));
  };

  const calendarDays = (() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const gridStartOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - gridStartOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const value = toDateInputValue(date);
      const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
      const isDisabled = value < minDate || date.getDay() === 0;

      return {
        date,
        value,
        isCurrentMonth,
        isDisabled,
        isSunday: date.getDay() === 0
      };
    });
  })();

  const canGoPrevMonth = (() => {
    const min = parseDateValue(minDate);
    return calendarMonth.getFullYear() > min.getFullYear() || calendarMonth.getMonth() > min.getMonth();
  })();

  const goToPreviousMonth = () => {
    if (!canGoPrevMonth) return;
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const selectCalendarDate = (day) => {
    if (!day.isCurrentMonth) {
      setCalendarMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    }
    handleDateChange(day.value);
  };

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
      <CakeSummary
        config={config}
        onClose={onClose}
        onEdit={() => setStep(1)}
        formatPrice={formatPrice}
        onAddToCart={onAddToCart}
        tortaSizes={tortaSizes}
        coberturas={coberturas}
        rellenos={rellenos}
        tortaExtras={tortaExtras}
      />,
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
              <label>¿Para qué fecha la necesitás? *</label>
              <p className="cake-date-note">
                Las tortas se piden con 5 días de anticipación. Consultanos igual si la necesitás antes, porque a veces podemos resolverlo según disponibilidad.
              </p>
              <div className="cake-calendar" aria-label="Seleccionar fecha para la torta">
                <div className="cake-calendar-header">
                  <button type="button" onClick={goToPreviousMonth} disabled={!canGoPrevMonth} aria-label="Mes anterior">
                    ‹
                  </button>
                  <strong>{monthFormatter.format(calendarMonth)}</strong>
                  <button type="button" onClick={goToNextMonth} aria-label="Mes siguiente">
                    ›
                  </button>
                </div>
                <div className="cake-calendar-weekdays" aria-hidden="true">
                  {WEEKDAY_LABELS.map((day, index) => (
                    <span key={`${day}-${index}`}>{day}</span>
                  ))}
                </div>
                <div className="cake-calendar-grid">
                  {calendarDays.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`cake-calendar-day ${config.date === day.value ? "selected" : ""} ${!day.isCurrentMonth ? "outside-month" : ""} ${day.isSunday ? "sunday" : ""}`}
                      disabled={day.isDisabled}
                      onClick={() => selectCalendarDate(day)}
                      aria-label={`${day.date.getDate()} de ${monthFormatter.format(day.date)}`}
                    >
                      {day.date.getDate()}
                    </button>
                  ))}
                </div>
                <p className="cake-calendar-help">Los domingos el local permanece cerrado.</p>
              </div>
              
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
              (step === 5 && (!config.date || isSunday(config.date)))
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
