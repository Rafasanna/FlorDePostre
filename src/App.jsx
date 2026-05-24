import { useMemo, useState, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { WHATSAPP_URL } from "./config.js";
import { campaigns } from "./data/campaigns.js";
import { dailyProducts } from "./data/dailyProducts.js";
import { postresBase, postresSizes } from "./data/postresData.js";
import { coberturas, rellenos, tortaExtras, tortaSizes } from "./data/tortasData.js";
import {
  fetchCampaignsFromSheet,
  fetchDailyProductsFromSheet,
  fetchPostresConfigFromSheet,
  fetchPostresFromSheet,
  fetchSinTaccProductsFromSheet,
  fetchPostresTamanosFromSheet,
  fetchSpecialProductsFromSheet,
  fetchTortaCoberturasFromSheet,
  fetchTortaExtrasFromSheet,
  fetchTortaRellenosFromSheet,
  fetchTortaTamanosFromSheet
} from "./services/googleSheets.js";
import { getActiveCampaigns, getEffectivePrice, isProductVisible } from "./utils/seasonal.js";
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

const localSinTaccProducts = dailyProducts.filter(
  (product) => product.sinTacc || product.categoria === "Sin TACC"
);

const dedupeProductsById = (products) => {
  const seen = new Set();
  return products.filter((product) => {
    if (!product?.id || seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
};

const withSpecialProducts = (campaignItems, specialProducts) =>
  campaignItems.map((campaign) => {
    const campaignEvent = campaign.evento || campaign.titulo;
    const sheetProducts = specialProducts.filter(
      (product) =>
        product.evento === campaignEvent &&
        product.activo !== false &&
        isProductVisible(product)
    );

    if (!sheetProducts.length) return campaign;

    return {
      ...campaign,
      textoBoton: campaign.textoBoton || "Ver especial",
      linkBoton: campaign.linkBoton || "#menu-diario",
      productosEspeciales: sheetProducts
    };
  });

const localPostresConfig = postresBase.flatMap((postre) =>
  postresSizes.map((size) => ({
    postreId: postre.id,
    sizeId: size.id,
    precio: size.precioEstimado,
    disponible: true
  }))
);

const resolvePostresWithSizes = (postres, tamanos, configs) => {
  const availableSizes = tamanos.filter((size) => size.disponible !== false);

  return postres
    .filter((postre) => postre.disponible !== false)
    .map((postre) => {
      const postreConfigs = configs.filter((config) => config.postreId === postre.id && config.disponible !== false);
      const sizes = (postreConfigs.length > 0 ? postreConfigs : availableSizes.map((size) => ({
        postreId: postre.id,
        sizeId: size.id,
        precio: size.precioEstimado,
        disponible: true
      })))
        .map((config) => {
          const size = availableSizes.find((item) => item.id === config.sizeId);
          const precio = Number.isFinite(config.precio) ? config.precio : size?.precioEstimado;

          if (!size || !Number.isFinite(precio)) return null;

          return {
            id: size.id,
            nombre: size.nombre,
            porciones: size.porciones,
            precio,
            disponible: config.disponible !== false && size.disponible !== false
          };
        })
        .filter(Boolean);

      return {
        ...postre,
        sizes
      };
    });
};

const SHEETS_CACHE_PREFIX = "florDePostre:sheets:";

const getCachedDataset = (key) => {
  if (typeof window === "undefined") return null;

  try {
    const value = window.sessionStorage.getItem(`${SHEETS_CACHE_PREFIX}${key}`);
    if (!value) return null;
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info(`[Google Sheets] error leyendo cache de ${key}.`, error);
    }
    return null;
  }
};

const cacheDataset = (key, data) => {
  if (typeof window === "undefined" || !Array.isArray(data) || data.length === 0) return;

  try {
    window.sessionStorage.setItem(`${SHEETS_CACHE_PREFIX}${key}`, JSON.stringify(data));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.info(`[Google Sheets] error guardando cache de ${key}.`, error);
    }
  }
};

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldScrollToMenu, setShouldScrollToMenu] = useState(false);
  const [menuCategoryRequest, setMenuCategoryRequest] = useState(null);
  const [menuDiarioProducts, setMenuDiarioProducts] = useState(() => getCachedDataset("menuDiario") || dailyProducts);
  const [sinTaccProducts, setSinTaccProducts] = useState(() => getCachedDataset("sinTacc") || localSinTaccProducts);
  const [postresProducts, setPostresProducts] = useState(() => getCachedDataset("postres") || postresBase);
  const [postresTamanos, setPostresTamanos] = useState(() => getCachedDataset("postresTamanos") || postresSizes);
  const [postresConfig, setPostresConfig] = useState(() => getCachedDataset("postresConfig") || localPostresConfig);
  const [tortaTamanos, setTortaTamanos] = useState(() => getCachedDataset("tortaTamanos") || tortaSizes);
  const [tortaCoberturas, setTortaCoberturas] = useState(() => getCachedDataset("tortaCoberturas") || coberturas);
  const [tortaRellenos, setTortaRellenos] = useState(() => getCachedDataset("tortaRellenos") || rellenos);
  const [tortaExtrasData, setTortaExtrasData] = useState(() => getCachedDataset("tortaExtras") || tortaExtras);
  const [campaignsData, setCampaignsData] = useState(() => getCachedDataset("campaigns") || campaigns);
  const [specialProducts, setSpecialProducts] = useState(() => getCachedDataset("specialProducts") || []);
  const [isUsingSheetProducts, setIsUsingSheetProducts] = useState(
    () => Boolean(getCachedDataset("menuDiario") || getCachedDataset("sinTacc"))
  );
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const campaignsWithSpecials = useMemo(
    () => withSpecialProducts(campaignsData, specialProducts),
    [campaignsData, specialProducts]
  );
  const activeCampaign = useMemo(() => getActiveCampaigns(campaignsWithSpecials)[0] || null, [campaignsWithSpecials]);
  const homeCampaign = pathname === "/" ? activeCampaign : null;

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const resources = [
      { key: "menuDiario", label: "menú diario", fetcher: fetchDailyProductsFromSheet, setter: setMenuDiarioProducts },
      { key: "sinTacc", label: "Sin TACC", fetcher: fetchSinTaccProductsFromSheet, setter: setSinTaccProducts },
      { key: "postres", label: "Postres", fetcher: fetchPostresFromSheet, setter: setPostresProducts },
      { key: "postresTamanos", label: "tamaños postres", fetcher: fetchPostresTamanosFromSheet, setter: setPostresTamanos },
      { key: "postresConfig", label: "configuraciones postres", fetcher: fetchPostresConfigFromSheet, setter: setPostresConfig },
      { key: "campaigns", label: "campañas", fetcher: fetchCampaignsFromSheet, setter: setCampaignsData },
      { key: "specialProducts", label: "productos especiales", fetcher: fetchSpecialProductsFromSheet, setter: setSpecialProducts },
      { key: "tortaTamanos", label: "tamaños de tortas", fetcher: fetchTortaTamanosFromSheet, setter: setTortaTamanos },
      { key: "tortaCoberturas", label: "coberturas de tortas", fetcher: fetchTortaCoberturasFromSheet, setter: setTortaCoberturas },
      { key: "tortaRellenos", label: "rellenos de tortas", fetcher: fetchTortaRellenosFromSheet, setter: setTortaRellenos },
      { key: "tortaExtras", label: "extras de tortas", fetcher: fetchTortaExtrasFromSheet, setter: setTortaExtrasData }
    ];

    Promise.allSettled(
      resources.map((resource) =>
        resource.fetcher().then((data) => ({
          ...resource,
          data
        }))
      )
    ).then((results) => {
      if (!isMounted) return;

      results.forEach((result, index) => {
        const resource = resources[index];

        if (result.status === "rejected") {
          if (import.meta.env.DEV) {
            console.info(`[Google Sheets] error en ${resource.label}; se conserva el estado actual.`, result.reason);
          }
          return;
        }

        const { data } = result.value;
        if (Array.isArray(data) && data.length > 0) {
          cacheDataset(resource.key, data);
          resource.setter(data);
          if (resource.key === "menuDiario" || resource.key === "sinTacc") {
            setIsUsingSheetProducts(true);
          }
          if (import.meta.env.DEV) {
            console.info(`[Google Sheets] ${resource.label} cargado desde Sheets: ${data.length}`);
          }
          return;
        }

        if (import.meta.env.DEV) {
          const hasCachedData = Boolean(getCachedDataset(resource.key));
          const fallbackMessage = hasCachedData ? "se conserva cache previa" : "usando fallback local";
          console.info(`[Google Sheets] ${resource.label} sin datos válidos; ${fallbackMessage}.`);
        }
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const dailyMenuProductsFinal = useMemo(
    () => dedupeProductsById([...menuDiarioProducts, ...sinTaccProducts]),
    [menuDiarioProducts, sinTaccProducts]
  );

  const postresProductsFinal = useMemo(
    () => resolvePostresWithSizes(postresProducts, postresTamanos, postresConfig),
    [postresConfig, postresProducts, postresTamanos]
  );

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
                  products={dailyMenuProductsFinal}
                  isUsingSheetProducts={isUsingSheetProducts}
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
          <Route
            path="/tortas-personalizadas"
            element={
              <TortasSection
                onAddToCart={addToCart}
                tortaSizes={tortaTamanos}
                coberturas={tortaCoberturas}
                rellenos={tortaRellenos}
                tortaExtras={tortaExtrasData}
              />
            }
          />
          <Route
            path="/postres"
            element={<PostresSection postres={postresProductsFinal} formatPrice={formatPrice} onAddToCart={addToCart} />}
          />
          <Route
            path="/postres/:postreId"
            element={<PostresSection postres={postresProductsFinal} formatPrice={formatPrice} onAddToCart={addToCart} />}
          />
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
        dailyProducts={dailyMenuProductsFinal}
        postres={postresProductsFinal}
      />

      <MobileMenuDrawer 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </div>
  );
}

export default App;
