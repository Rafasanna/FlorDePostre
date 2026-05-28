import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight } from "lucide-react";
import BrandMark from "./BrandMark.jsx";

function MobileMenuDrawer({ isOpen, onClose }) {
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

  const navItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 12px',
    borderBottom: '1px solid rgba(232, 215, 198, 0.3)',
    color: 'var(--cocoa)',
    textDecoration: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer'
  };

  const navItems = [
    { label: "Cómo pedir", to: "/como-pedir" },
    { label: "Nuestro Catering", to: "/catering" },
    { label: "Tortas Personalizadas", to: "/tortas-personalizadas" },
    { label: "Postres", to: "/postres" },
    { label: "Sobre Flor de Postre", to: "/sobre" }
  ];

  return (
    <>
      <div 
        className={`cart-overlay ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
        aria-hidden="true"
        style={{ zIndex: 1200 }} // Asegurar que esté sobre todo
      />

      <aside className={`cart-drawer mobile-menu-drawer ${isOpen ? 'open' : ''}`} style={{ zIndex: 1250 }} role="dialog" aria-label="Menú principal">
        <div className="cart-header">
          <div className="mobile-menu-heading">
            <span>Flor de Postre</span>
            <Link className="mobile-menu-title-link" to="/" onClick={onClose}>
              <h2 className="mobile-menu-title">
                Menú
                <BrandMark variant="flower" className="mobile-menu-title-flower" />
              </h2>
            </Link>
          </div>
          <button className="icon-button close-btn" type="button" onClick={onClose} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        <div className="cart-items" style={{ padding: '16px 24px' }}>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {navItems.map((item) => (
              <Link className="mobile-menu-nav-item" key={item.to} style={navItemStyle} to={item.to} onClick={onClose}>
                <span>{item.label}</span>
                <ChevronRight size={18} />
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default MobileMenuDrawer;
