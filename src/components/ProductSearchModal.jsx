import { useState, useMemo, useEffect, useRef } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { dailyProducts as fallbackDailyProducts } from "../data/dailyProducts.js";
import { postresBase as fallbackPostres } from "../data/postresData.js";
import { getVisibleProducts } from "../utils/seasonal.js";

function ProductSearchModal({
  isOpen,
  onClose,
  onSelectResult,
  dailyProducts = fallbackDailyProducts,
  postres = fallbackPostres
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Pequeño delay para asegurar que el modal renderizó
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery("");
    }
    return () => { document.body.style.overflow = ''; }
  }, [isOpen]);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];

    const lowerQuery = query.toLowerCase();
    const matches = (text) => text && text.toLowerCase().includes(lowerQuery);

    const dailyMatches = getVisibleProducts(dailyProducts)
      .filter(p => matches(p.nombre) || matches(p.descripcion) || matches(p.categoria) || (p.sinTacc && matches("Sin TACC")) || matches(p.etiqueta))
      .map(p => ({ ...p, type: 'daily', label: 'Menú Diario' }));

    const postresMatches = postres.filter(p => matches(p.nombre) || matches(p.descripcion))
      .map(p => ({ ...p, type: 'postre', label: 'Postre por Encargue' }));

    // Simular búsqueda de tortas
    const tortasKeyword = ["torta", "personalizada", "merengue", "buttercream", "fondant"];
    const isTortaQuery = tortasKeyword.some(k => matches(k));
    const tortasMatches = isTortaQuery 
      ? [{ id: 'torta-custom', nombre: 'Torta Personalizada', descripcion: 'Diseñá tu torta a medida con cobertura, rellenos y extras.', type: 'torta', label: 'Torta a Medida' }]
      : [];

    return [...dailyMatches, ...postresMatches, ...tortasMatches];
  }, [dailyProducts, postres, query]);

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay">
      <div className="search-modal">
        <div className="search-header">
          <Search size={20} className="search-icon" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Buscar alfajores, tartas, chocolate..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="icon-button close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="search-results">
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="search-empty">Escribí al menos 2 letras para buscar...</p>
          )}

          {query.trim().length >= 2 && results.length === 0 && (
            <p className="search-empty">No encontramos nada para "{query}".<br/>Probá con otra palabra.</p>
          )}

          {results.length > 0 && (
            <ul className="search-list">
              {results.map((result, idx) => (
                <li key={idx} onClick={() => onSelectResult(result)}>
                  <div className="result-info">
                    <strong>{result.nombre}</strong>
                    <small>{result.label} • {result.descripcion}</small>
                  </div>
                  <ChevronRight size={18} className="result-arrow" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductSearchModal;
