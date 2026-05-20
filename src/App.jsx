import { useMemo, useState, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { WHATSAPP_URL } from "./config.js";
import { campaigns } from "./data/campaigns.js";
import { getActiveCampaigns, getEffectivePrice } from "./utils/seasonal.js";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import CampaignBanner from "./components/CampaignBanner.jsx";
import MobileMenuDrawer from "./components/MobileMenuDrawer.jsx";
import DailyMenuSection from "./components/DailyMenuSection.jsx";
import PostresSection from "./components/PostresSection.jsx";
import TortasSection from "./components/TortasSection.jsx";
import CateringSection from "./components/CateringSection.jsx";
import AboutSection from "./components/AboutSection.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import ProductSearchModal from "./components/ProductSearchModal.jsx";
import ComoPedirPage from "./pages/ComoPedirPage.jsx";
import CartPage from "./pages/CartPage.jsx";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldScrollToMenu, setShouldScrollToMenu] = useState(false);
  const [menuCategoryRequest, setMenuCategoryRequest] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeCampaign = useMemo(() => getActiveCampaigns(campaigns)[0] || null, []);
  const homeCampaign = pathname === "/" ? activeCampaign : null;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    if (!shouldScrollToMenu || pathname !== "/") return;

    const timer = setTimeout(() => {
      document.getElementById("menu-diario")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setShouldScrollToMenu(false);
    }, 80);

    return () => clearTimeout(timer);
  }, [pathname, shouldScrollToMenu]);

  const total = cartItems.reduce((sum, item) => sum + item.precio * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (productObj) => {
    setCartItems((prev) => {
      // Si es menú diario, intentar agrupar
      if (productObj.type === 'daily') {
        const existing = prev.find(item => item.product.id === productObj.product.id && item.type === 'daily');
        if (existing) {
          return prev.map(item => 
            item.cartItemId === existing.cartItemId 
              ? { ...item, quantity: item.quantity + 1 } 
              : item
          );
        }
      }
      
      // Si no es diario o no existe, agregarlo como nuevo item con cartItemId unico
      return [...prev, { 
        ...productObj, 
        cartItemId: crypto.randomUUID() 
      }];
    });
    
    // Abrir carrito opcionalmente o mostrar notificacion
    setIsCartOpen(true);
  };

  const changeQuantity = (cartItemId, quantity) => {
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter(item => item.cartItemId !== cartItemId);
      }
      return prev.map(item => 
        item.cartItemId === cartItemId 
          ? { ...item, quantity } 
          : item
      );
    });
  };

  const removeItem = (cartItemId) => {
    setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => setCartItems([]);

  const whatsappMessage = useMemo(() => {
    let detail = "";
    
    cartItems.forEach(item => {
      detail += `- ${item.nombre} x${item.quantity} - ${formatPrice(item.precio * item.quantity)}\n`;
      if (item.type !== 'daily' && item.configuracion) {
        const c = item.configuracion;
        if (c.sizeName) detail += `  • Tamaño: ${c.sizeName}\n`;
        if (c.coberturaName) detail += `  • Cobertura: ${c.coberturaName}\n`;
        if (c.rellenos && c.rellenos.length > 0) detail += `  • Rellenos: ${c.rellenos.map(r => r.nombre).join(', ')}\n`;
        if (c.extras && c.extras.length > 0) detail += `  • Extras: ${c.extras.map(e => e.nombre).join(', ')}\n`;
        if (c.date) detail += `  • Fecha deseada: ${c.date}\n`;
        if (c.comments) detail += `  • Detalles: ${c.comments}\n`;
      }
    });

    return `Hola Flor de Postre! Quiero hacer este pedido:\n\n${detail || "- Aún no agregué productos"}\n\nTotal estimado (sin envío): ${formatPrice(total)}\n\nMi nombre:\nRetiro o envío:\nDirección (si es envío):\nAclaraciones:\n\n¿Me confirmás disponibilidad?`;
  }, [cartItems, total]);

  const whatsappHref = `${WHATSAPP_URL}?text=${encodeURIComponent(whatsappMessage)}`;
  
  const cateringHref = `${WHATSAPP_URL}?text=${encodeURIComponent(
    "Hola Flor de Postre ✨\nQuiero consultar por catering / desayunos.\n\nTipo de propuesta:\nCantidad aproximada de personas:\nFecha:\nIdea general:"
  )}`;

  const handleSearchResult = (result) => {
    setIsSearchOpen(false);
    if (result.type === 'daily') {
      setShouldScrollToMenu(true);
      navigate("/");
    } else if (result.type === 'postre') {
      navigate(`/postres/${result.id}`);
    } else if (result.type === 'torta') {
      navigate("/tortas-personalizadas");
    }
  };

  // Convert old cart logic format to new format for DailyMenuSection
  // DailyMenuSection expects addToCart(product) and cart object with quantities
  const dailyCartState = cartItems.filter(i => i.type === 'daily').reduce((acc, item) => {
    acc[item.product.id] = item.quantity;
    return acc;
  }, {});

  const handleDailyAddToCart = (product) => {
    addToCart({ type: 'daily', product, nombre: product.nombre, precio: getEffectivePrice(product), quantity: 1 });
  };

  const goToMenu = () => {
    setShouldScrollToMenu(true);
    navigate("/");
  };

  const goToCampaignSpecial = () => {
    setMenuCategoryRequest({ category: "Especial", nonce: Date.now() });
    setShouldScrollToMenu(true);
    navigate("/");
  };

  return (
    <div className="site-shell">
      <Header 
        onOpenSearch={() => setIsSearchOpen(true)} 
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        onOpenDailyMenu={goToMenu}
        itemCount={itemCount}
      />

      <CampaignBanner campaign={homeCampaign} onOpenSpecial={goToCampaignSpecial} />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero
                  itemCount={itemCount}
                  onOpenCart={() => setIsCartOpen(true)}
                />
                <DailyMenuSection
                  cart={dailyCartState}
                  addToCart={handleDailyAddToCart}
                  formatPrice={formatPrice}
                  isLoading={isLoading}
                  campaign={homeCampaign}
                  categoryRequest={menuCategoryRequest}
                />
              </>
            }
          />
          <Route path="/menu" element={<Navigate to="/" replace />} />
          <Route
            path="/pedido"
            element={
              <CartPage
                items={cartItems}
                total={total}
                onQuantityChange={changeQuantity}
                onRemoveItem={removeItem}
                onClear={clearCart}
                whatsappHref={whatsappHref}
                formatPrice={formatPrice}
              />
            }
          />
          <Route path="/como-pedir" element={<ComoPedirPage />} />
          <Route path="/catering" element={<CateringSection cateringHref={cateringHref} />} />
          <Route path="/tortas-personalizadas" element={<TortasSection onAddToCart={addToCart} />} />
          <Route path="/postres" element={<PostresSection />} />
          <Route path="/postres/:postreId" element={<PostresSection />} />
          <Route path="/sobre" element={<AboutSection />} />
          <Route
            path="*"
            element={
              <Hero
                itemCount={itemCount}
                onOpenCart={() => setIsCartOpen(true)}
              />
            }
          />
        </Routes>
      </main>

      <button className="floating-cart" onClick={() => navigate("/pedido")} aria-label="Ver carrito" style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
        <ShoppingBag size={18} />
        <span>Mi pedido {itemCount > 0 && `(${itemCount})`}</span>
      </button>

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        total={total}
        onQuantityChange={changeQuantity}
        onRemoveItem={removeItem}
        onClear={clearCart}
        whatsappHref={whatsappHref}
        formatPrice={formatPrice}
      />

      <ProductSearchModal 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSearchResult}
      />

      <MobileMenuDrawer 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
}

export default App;
