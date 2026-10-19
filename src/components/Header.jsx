import { useEffect, useState, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Search, Menu, ShoppingBag } from "lucide-react";
import BrandMark from "./BrandMark.jsx";

function Header({ onOpenSearch, onOpenMenu, onOpenDailyMenu, itemCount }) {
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        document.documentElement.style.setProperty("--header-height", `${height}px`);
      }
    };

    updateHeaderHeight();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      updateHeaderHeight();
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateHeaderHeight);

    let resizeObserver;
    if (headerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateHeaderHeight);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  return (
    <nav ref={headerRef} className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
      <button className="icon-button menu-trigger" type="button" onClick={onOpenMenu} aria-label="Menú principal">
        <Menu size={20} />
      </button>

      <Link className="brand" to="/" aria-label="Flor de Postre inicio">
        <BrandMark variant="official" className="header-logo" />
      </Link>

      <div className="nav-actions desktop-header-actions">
        <div className="nav-links">
          <button className="daily-menu-link" type="button" onClick={onOpenDailyMenu}>Menú</button>
          <NavLink className="cart-link" to="/pedido">
            <ShoppingBag size={16} />
            <span className="cart-label">Mi pedido</span>
            {itemCount > 0 && <span key={itemCount} className="cart-count" aria-label={`${itemCount} productos en el pedido`}>{itemCount}</span>}
          </NavLink>
        </div>
        
        <button className="icon-button search-trigger" type="button" onClick={onOpenSearch} aria-label="Buscar productos">
          <Search size={18} />
        </button>
      </div>

      <div className="mobile-header-actions">
        <button className="icon-button mobile-search-trigger" type="button" onClick={onOpenSearch} aria-label="Buscar productos">
          <Search size={18} />
        </button>
        <NavLink className="icon-button mobile-cart-link" to="/pedido" aria-label="Ver mi pedido">
          <ShoppingBag size={18} />
          {itemCount > 0 && <span key={itemCount} className="mobile-cart-count">{itemCount}</span>}
        </NavLink>
      </div>
    </nav>
  );
}

export default Header;
