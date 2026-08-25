import { useCallback, useMemo, useState, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Analytics } from "@vercel/analytics/react";
import { WHATSAPP_URL } from "./config.js";
import { campaigns } from "./data/campaigns.js";
import { dailyProducts } from "./data/dailyProducts.js";
import { postresBase, postresSizes } from "./data/postresData.js";
import { coberturas, enrichCakeExtra, enrichCakeFilling, getCakeSizePrice, rellenos, tortaExtras, tortaSizes } from "./data/tortasData.js";
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
import { getPrimaryProductImage } from "./utils/productImages.js";
import { getActiveCampaigns, getEffectivePrice, isProductVisible } from "./utils/seasonal.js";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import CampaignBanner from "./components/CampaignBanner.jsx";
import MobileMenuDrawer from "./components/MobileMenuDrawer.jsx";
import DailyMenuSection from "./components/DailyMenuSection.jsx";
import PostresSection from "./components/PostresSection.jsx";
import TortasSection from "./components/TortasSection.jsx";
import CateringSection from "./components/CateringSection.jsx";
import BreakfastSection from "./components/BreakfastSection.jsx";
import AboutSection from "./components/AboutSection.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Footer from "./components/Footer.jsx";
import ProductSearchModal from "./components/ProductSearchModal.jsx";
import ComoPedirPage from "./pages/ComoPedirPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import LegalPage from "./pages/LegalPage.jsx";

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

const isProductOrderable = (product) =>
  Boolean(product) && product.disponible !== false && product.reservado !== true;

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
const SHEETS_NOTICE =
  "Algunos datos pueden estar desactualizados. Confirmamos disponibilidad por WhatsApp.";
const SHEETS_CACHE_STORAGES = ["localStorage", "sessionStorage"];

const getCachedDataset = (key) => {
  if (typeof window === "undefined") return null;

  for (const storageName of SHEETS_CACHE_STORAGES) {
    try {
      const value = window[storageName].getItem(`${SHEETS_CACHE_PREFIX}${key}`);
      if (!value) continue;
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.info(`[Google Sheets] error leyendo ${storageName} de ${key}.`, error);
      }
    }
  }

  return null;
};

const cacheDataset = (key, data) => {
  if (typeof window === "undefined" || !Array.isArray(data) || data.length === 0) return;

  const serializedData = JSON.stringify(data);

  for (const storageName of SHEETS_CACHE_STORAGES) {
    try {
      window[storageName].setItem(`${SHEETS_CACHE_PREFIX}${key}`, serializedData);
      return;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.info(`[Google Sheets] error guardando ${storageName} de ${key}.`, error);
      }
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
  const [sheetsNotice, setSheetsNotice] = useState("");
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
      { key: "menuDiario", label: "menú diario", fetcher: fetchDailyProductsFromSheet, setter: setMenuDiarioProducts, showNoticeOnFallback: true },
      { key: "sinTacc", label: "Sin TACC", fetcher: fetchSinTaccProductsFromSheet, setter: setSinTaccProducts, showNoticeOnFallback: true },
      { key: "postres", label: "Postres", fetcher: fetchPostresFromSheet, setter: setPostresProducts, showNoticeOnFallback: true },
      { key: "postresTamanos", label: "tamaños postres", fetcher: fetchPostresTamanosFromSheet, setter: setPostresTamanos, showNoticeOnFallback: true },
      { key: "postresConfig", label: "configuraciones postres", fetcher: fetchPostresConfigFromSheet, setter: setPostresConfig, showNoticeOnFallback: true },
      { key: "campaigns", label: "campañas", fetcher: fetchCampaignsFromSheet, setter: setCampaignsData },
      { key: "specialProducts", label: "productos especiales", fetcher: fetchSpecialProductsFromSheet, setter: setSpecialProducts },
      { key: "tortaTamanos", label: "tamaños de tortas", fetcher: fetchTortaTamanosFromSheet, setter: setTortaTamanos, showNoticeOnFallback: true },
      { key: "tortaCoberturas", label: "coberturas de tortas", fetcher: fetchTortaCoberturasFromSheet, setter: setTortaCoberturas, showNoticeOnFallback: true },
      { key: "tortaRellenos", label: "rellenos de tortas", fetcher: fetchTortaRellenosFromSheet, setter: setTortaRellenos, showNoticeOnFallback: true },
      { key: "tortaExtras", label: "extras de tortas", fetcher: fetchTortaExtrasFromSheet, setter: setTortaExtrasData, showNoticeOnFallback: true }
    ];

    resources.forEach((resource) => {
      resource.fetcher().then((data) => {
        if (!isMounted) return;

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

        if (resource.showNoticeOnFallback) setSheetsNotice(SHEETS_NOTICE);
        if (import.meta.env.DEV) {
          const hasCachedData = Boolean(getCachedDataset(resource.key));
          const fallbackMessage = hasCachedData ? "se conserva cache previa" : "usando fallback local";
          console.info(`[Google Sheets] ${resource.label} sin datos válidos; ${fallbackMessage}.`);
        }
      }).catch((error) => {
        if (!isMounted) return;

        if (resource.showNoticeOnFallback) setSheetsNotice(SHEETS_NOTICE);
        if (import.meta.env.DEV) {
          console.info(`[Google Sheets] error en ${resource.label}; se conserva el estado actual.`, error);
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

  const total = cartItems.reduce((sum, item) => {
    const itemTotal = item.precio * item.quantity;
    return Number.isFinite(itemTotal) ? sum + itemTotal : sum;
  }, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [cartValidationMessage, setCartValidationMessage] = useState("");

  const cartCatalog = useMemo(() => {
    const dailyById = new Map(
      [...dailyMenuProductsFinal, ...specialProducts]
        .filter(Boolean)
        .map((product) => [product.id, product])
    );
    const postresById = new Map(
      postresProductsFinal
        .filter(Boolean)
        .map((postre) => [postre.id, postre])
    );

    return { dailyById, postresById };
  }, [dailyMenuProductsFinal, postresProductsFinal, specialProducts]);

  const getValidatedCartItem = useCallback((item) => {
    if (!item || !Number.isFinite(item.quantity) || item.quantity <= 0) return null;

    if (item.type === "daily") {
      const currentProduct = cartCatalog.dailyById.get(item.product?.id);
      if (!isProductOrderable(currentProduct)) return null;

      const currentPrice = getEffectivePrice(currentProduct);
      if (!Number.isFinite(currentPrice)) return null;

      return {
        ...item,
        product: { id: currentProduct.id, imagen: getPrimaryProductImage(currentProduct) },
        imagen: getPrimaryProductImage(currentProduct),
        nombre: currentProduct.nombre,
        precio: currentPrice
      };
    }

    if (item.type === "postre") {
      const currentPostre = cartCatalog.postresById.get(item.product?.id);
      if (!currentPostre || currentPostre.disponible === false) return null;

      const currentSize = currentPostre.sizes?.find((size) => size.id === item.configuracion?.sizeId);
      if (!currentSize || currentSize.disponible === false || !Number.isFinite(currentSize.precio)) return null;

      return {
        ...item,
        product: { id: currentPostre.id, imagen: getPrimaryProductImage(currentPostre) },
        imagen: getPrimaryProductImage(currentPostre),
        nombre: currentPostre.nombre,
        precio: currentSize.precio,
        configuracion: {
          ...item.configuracion,
          sizeName: currentSize.nombre,
          porciones: currentSize.porciones
        }
      };
    }

    if (item.type === "torta") {
      const currentSize = tortaTamanos.find((size) => size.id === item.configuracion?.sizeId) || {
        id: item.configuracion?.sizeId,
        nombre: item.configuracion?.sizeName
      };
      const currentPrice = getCakeSizePrice(item.configuracion?.cakeOptionId, currentSize);

      if (currentPrice) {
        const selectedRellenos = Array.isArray(item.configuracion?.rellenos)
          ? item.configuracion.rellenos.map((relleno) => enrichCakeFilling(relleno, formatPrice))
          : [];
        const rellenosTotal = selectedRellenos.reduce((sum, relleno) => sum + (Number.isFinite(relleno.precioCalculado) ? relleno.precioCalculado : 0), 0);
        const extras = Array.isArray(item.configuracion?.extras)
          ? item.configuracion.extras.map((extra) => enrichCakeExtra(extra, currentPrice.price, formatPrice))
          : [];
        const extrasTotal = extras.reduce((sum, extra) => sum + (Number.isFinite(extra.precioCalculado) ? extra.precioCalculado : 0), 0);

        return {
          ...item,
          nombre: "Torta por encargo",
          precio: currentPrice.price + rellenosTotal + extrasTotal,
          configuracion: {
            ...item.configuracion,
            sizeName: currentPrice.nombre,
            porciones: currentPrice.porciones,
            cakeBasePrice: currentPrice.price,
            rellenos: selectedRellenos,
            rellenosTotal,
            extras,
            extrasTotal
          }
        };
      }

      if (!Number.isFinite(item.precio)) return null;
      return item;
    }

    if (!Number.isFinite(item.precio)) return null;
    return item;
  }, [cartCatalog, tortaTamanos]);

  const validateCartItems = useCallback((items) => {
    const nextItems = [];
    let hasChanges = false;

    for (const item of items) {
      const validatedItem = getValidatedCartItem(item);
      if (!validatedItem) {
        return {
          isValid: false,
          hasChanges: false,
          items,
          message: "Revisá el carrito porque hubo cambios en disponibilidad o precio."
        };
      }

      if (validatedItem.nombre !== item.nombre || validatedItem.precio !== item.precio) {
        hasChanges = true;
      }

      nextItems.push(validatedItem);
    }

    return {
      isValid: true,
      hasChanges,
      items: nextItems,
      message: hasChanges ? "Revisá el carrito porque hubo cambios en disponibilidad o precio." : ""
    };
  }, [getValidatedCartItem]);

  const addToCart = (productObj) => {
    if (productObj.type === "daily" && !isProductOrderable(productObj.product)) {
      setCartValidationMessage("Este producto no está disponible para agregar al carrito.");
      return;
    }

    if (productObj.type === "postre" && !isProductOrderable(productObj.product)) {
      setCartValidationMessage("Este producto no está disponible para agregar al carrito.");
      return;
    }

    setCartValidationMessage("");
    setCartItems((prev) => {
      const cartProduct = productObj.product
        ? { id: productObj.product.id, imagen: getPrimaryProductImage(productObj.product) }
        : productObj.product;
      const cartItem = {
        ...productObj,
        product: cartProduct,
        imagen: productObj.imagen || cartProduct?.imagen || ""
      };

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
        ...cartItem, 
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
    setCartValidationMessage("");
  };

  const clearCart = () => {
    setCartItems([]);
    setCartValidationMessage("");
  };

  const buildWhatsappMessage = useCallback((items, totalValue, aclaraciones = "") => {
    let detail = "";
    
    items.forEach(item => {
      const cakeLabel = item.type === "torta" && item.configuracion
        ? `${item.nombre} - ${item.configuracion.coberturaName || item.configuracion.cakeOptionName || "A definir"} - ${item.configuracion.sizeName || "A definir"}`
        : item.nombre;

      detail += `- ${cakeLabel} x${item.quantity} - ${formatPrice(item.precio * item.quantity)}\n`;
      if (item.type !== 'daily' && item.configuracion) {
        const c = item.configuracion;
        if (c.sizeName) detail += `  • Tamaño: ${c.sizeName}\n`;
        if (c.porciones) detail += `  • Porciones: ${c.porciones}\n`;
        if (c.coberturaName) detail += `  • Cobertura: ${c.coberturaName}\n`;
        if (c.fillingsCount) detail += `  • Cantidad de rellenos: ${c.fillingsCount}\n`;
        if (c.rellenos && c.rellenos.length > 0) {
          detail += `  • Rellenos: ${c.rellenos.map(r => `${r.nombre}${r.precioTexto ? ` (${r.precioTexto})` : ""}`).join(', ')}\n`;
        }
        if (c.extras && c.extras.length > 0) {
          detail += `  • Extras: ${c.extras.map(e => `${e.nombre}${e.precioTexto ? `: ${e.precioTexto}` : ""}`).join(', ')}\n`;
        }
        if (c.date) detail += `  • Fecha deseada: ${c.date}\n`;
        if (c.comments) detail += `  • Detalles: ${c.comments}\n`;
      }
    });

    const aclaracionesText = aclaraciones.trim();

    return `Hola Flor de Postre! Quiero hacer este pedido:\n\n${detail || "- Aún no agregué productos"}\n\nTotal estimado (sin envío): ${formatPrice(totalValue)}\n\nMi nombre:\nRetiro o envío:\nDirección (si es envío):\nAclaraciones:${aclaracionesText ? ` ${aclaracionesText}` : ""}\n\n¿Me confirmás disponibilidad?`;
  }, []);

  const whatsappMessage = useMemo(() => buildWhatsappMessage(cartItems, total), [buildWhatsappMessage, cartItems, total]);

  const getWhatsappHref = useCallback((aclaraciones = "") => {
    if (cartItems.length === 0) return null;

    const validation = validateCartItems(cartItems);
    if (!validation.isValid || validation.hasChanges) {
      if (validation.hasChanges) {
        setCartItems(validation.items);
      }
      setCartValidationMessage(validation.message);
      return null;
    }

    setCartValidationMessage("");
    const validatedTotal = validation.items.reduce((sum, item) => sum + item.precio * item.quantity, 0);
    const message = buildWhatsappMessage(validation.items, validatedTotal, aclaraciones);
    return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
  }, [buildWhatsappMessage, cartItems, validateCartItems]);

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

  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const floatingButtonLabel = normalizedPathname === "/tortas-personalizadas"
    ? "Diseñar mi torta"
    : normalizedPathname === "/catering" || normalizedPathname === "/desayunos"
      ? "Consultar por WhatsApp"
      : normalizedPathname === "/como-pedir"
        ? "Ver menú diario"
        : "Mi pedido";
  const isFloatingCartButton = floatingButtonLabel === "Mi pedido";

  const handleFloatingButtonClick = () => {
    if (normalizedPathname === "/tortas-personalizadas") {
      document.getElementById("cake-configurator-start")?.click();
      return;
    }

    if (normalizedPathname === "/catering" || normalizedPathname === "/desayunos") {
      document.getElementById("catering-whatsapp-cta")?.click();
      return;
    }

    if (normalizedPathname === "/como-pedir") {
      goToMenu();
      return;
    }

    navigate("/pedido");
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
                  sheetsNotice={sheetsNotice}
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
                getWhatsappHref={getWhatsappHref}
                validationMessage={cartValidationMessage}
                formatPrice={formatPrice}
              />
            }
          />
          <Route path="/como-pedir" element={<ComoPedirPage />} />
          <Route path="/catering" element={<CateringSection cateringHref={cateringHref} />} />
          <Route path="/desayunos" element={<BreakfastSection />} />
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
          <Route path="/terminos-y-condiciones" element={<LegalPage title="Términos y condiciones" />} />
          <Route path="/politicas-de-privacidad" element={<LegalPage title="Políticas de privacidad" />} />
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

      <button className="floating-cart" onClick={handleFloatingButtonClick} aria-label={isFloatingCartButton ? "Ver carrito" : floatingButtonLabel} style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
        <ShoppingBag size={18} />
        <span>{floatingButtonLabel} {isFloatingCartButton && itemCount > 0 && `(${itemCount})`}</span>
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
        getWhatsappHref={getWhatsappHref}
        validationMessage={cartValidationMessage}
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
      <Analytics />
    </div>
  );
}

export default App;
