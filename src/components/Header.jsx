import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Search, Menu, ShoppingBag } from "lucide-react";

function Header({ onOpenSearch, onOpenMenu, onOpenDailyMenu, itemCount }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? "nav-scrolled" : ""}`}>
      <button className="icon-button menu-trigger" type="button" onClick={onOpenMenu} aria-label="Menú principal">
        <Menu size={20} />
      </button>

      <Link className="brand" to="/" aria-label="Flor de Postre inicio">
        <img src="/images/logo-flor-de-postre.jpeg" alt="" />
        <span>Flor de Postre</span>
      </Link>

      <div className="nav-actions">
        <div className="nav-links">
          <button type="button" onClick={onOpenDailyMenu}>Menú</button>
          <NavLink to="/pedido">
            <ShoppingBag size={16} />
            Mi pedido {itemCount > 0 && <span>({itemCount})</span>}
          </NavLink>
        </div>
        
        <button className="icon-button search-trigger" type="button" onClick={onOpenSearch} aria-label="Buscar productos">
          <Search size={18} />
        </button>
      </div>
    </nav>
  );
}

export default Header;
