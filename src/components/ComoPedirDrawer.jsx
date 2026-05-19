import { useEffect } from "react";
import { X } from "lucide-react";

function ComoPedirDrawer({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  return (
    <>
      <div 
        className={`cart-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`cart-drawer ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Cómo pedir">
        <div className="cart-header">
          <div>
            <span>Atención Personalizada</span>
            <h2>Cómo pedir</h2>
          </div>
          <button className="icon-button close-btn" type="button" onClick={onClose} aria-label="Cerrar tutorial">
            <X size={20} />
          </button>
        </div>

        <div className="cart-items configurator-body">
          <div className="steps" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <article>
              <strong style={{ color: 'var(--rose-500)', fontSize: '1.2rem' }}>01</strong>
              <h3 style={{ margin: '8px 0', fontSize: '1.2rem' }}>Menú diario</h3>
              <p style={{ color: 'var(--cocoa-soft)', lineHeight: '1.5' }}>Agregá al carrito pastelería, opciones saladas y enviá tu pedido al instante.</p>
            </article>
            <article>
              <strong style={{ color: 'var(--rose-500)', fontSize: '1.2rem' }}>02</strong>
              <h3 style={{ margin: '8px 0', fontSize: '1.2rem' }}>Postres por encargue</h3>
              <p style={{ color: 'var(--cocoa-soft)', lineHeight: '1.5' }}>Elegí tu postre, el tamaño, la fecha deseada (mín. 2 días) y envíanos la consulta para reservar.</p>
            </article>
            <article>
              <strong style={{ color: 'var(--rose-500)', fontSize: '1.2rem' }}>03</strong>
              <h3 style={{ margin: '8px 0', fontSize: '1.2rem' }}>Tortas a medida</h3>
              <p style={{ color: 'var(--cocoa-soft)', lineHeight: '1.5' }}>Armá tu torta perfecta paso a paso (mín. 5 días) y te confirmamos disponibilidad por WhatsApp.</p>
            </article>
          </div>
        </div>
      </aside>
    </>
  );
}

export default ComoPedirDrawer;
