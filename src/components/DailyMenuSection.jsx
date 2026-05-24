import { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { categories, dailyProducts } from "../data/dailyProducts.js";
import CategoryFilter from "./CategoryFilter.jsx";
import ProductCard from "./ProductCard.jsx";
import ProductSkeleton from "./ProductSkeleton.jsx";
import FeaturedProductsSection from "./FeaturedProductsSection.jsx";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import { getFeaturedProducts, getVisibleProducts } from "../utils/seasonal.js";

function DailyMenuSection({
  cart,
  addToCart,
  formatPrice,
  isLoading,
  campaign,
  categoryRequest,
  products = dailyProducts,
  isUsingSheetProducts = false
}) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const menuProducts = products;
  const sectionRef = useIntersectionObserver();
  const visibleCatalog = useMemo(() => getVisibleProducts(menuProducts), [menuProducts]);
  const featuredProducts = useMemo(() => getFeaturedProducts(menuProducts).slice(0, 4), [menuProducts]);
  const specialProducts = campaign?.productosEspeciales || [];
  const baseCategories = useMemo(() => {
    if (!isUsingSheetProducts) return categories;

    const sheetCategories = menuProducts
      .map((product) => product.categoria)
      .filter((category) => category && category !== "Todos" && category !== "Sin TACC");
    const knownCategories = categories.filter((category) => sheetCategories.includes(category));
    const newCategories = sheetCategories.filter((category) => !categories.includes(category));

    return ["Todos", "Sin TACC", ...new Set([...knownCategories, ...newCategories])];
  }, [isUsingSheetProducts, menuProducts]);
  const menuCategories = useMemo(
    () => (specialProducts.length > 0 ? ["Especial", ...baseCategories] : baseCategories),
    [baseCategories, specialProducts.length]
  );

  useEffect(() => {
    if (categoryRequest?.category) {
      setActiveCategory(categoryRequest.category);
      setShowAllProducts(false);
    }
  }, [categoryRequest]);

  const categoryProducts = useMemo(() => {
    if (activeCategory === "Especial") return specialProducts;
    if (activeCategory === "Todos") return visibleCatalog;
    if (activeCategory === "Sin TACC") {
      return visibleCatalog.filter((product) => product.sinTacc || product.categoria === "Sin TACC");
    }
    return visibleCatalog.filter((product) => product.categoria === activeCategory);
  }, [activeCategory, specialProducts, visibleCatalog]);

  const visibleProducts = useMemo(() => {
    if (activeCategory !== "Todos" || showAllProducts) return categoryProducts;
    return categoryProducts.filter((product) => product.categoria === "Alfajores").slice(0, 4);
  }, [activeCategory, categoryProducts, showAllProducts]);

  const hasHiddenProducts = activeCategory === "Todos" && categoryProducts.length > visibleProducts.length;

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setShowAllProducts(false);
  };

  const sinTaccMapsUrl = "https://www.google.com/maps/search/?api=1&query=Sarmiento%20y%20Republica%20de%20Chile";

  return (
    <section className="section page-section reveal-fade" id="menu-diario" ref={sectionRef}>
      <div className="section-heading">
        <span>Menú diario</span>
        <h2>Para tu mesa dulce, desayuno o merienda</h2>
        <p>
          Seleccioná productos de stock diario, revisá el resumen y enviá el pedido por WhatsApp.
        </p>
      </div>

      <CategoryFilter
        categories={menuCategories}
        activeCategory={activeCategory}
        onChange={handleCategoryChange}
      />

      {activeCategory === "Todos" && (
        <FeaturedProductsSection
          products={featuredProducts}
          cart={cart}
          addToCart={addToCart}
          formatPrice={formatPrice}
        />
      )}

      {activeCategory === "Sin TACC" && (
        <div className="sin-tacc-intro">
          <div>
            <h3>Flor de Postre Sin TACC</h3>
            <p>
              En el local contamos con algunos productos seleccionados de nuestra marca exclusiva
              para celíacos Flor de Postre Sin TACC.
            </p>
            <p>
              Para más variedad y opciones, nuestro local libre de gluten está ubicado en{" "}
              <a href={sinTaccMapsUrl} target="_blank" rel="noreferrer">
                Sarmiento y República de Chile
              </a>
              .
            </p>
          </div>
          <a className="sin-tacc-location-link" href={sinTaccMapsUrl} target="_blank" rel="noreferrer">
            <MapPin size={17} />
            Ver ubicación
          </a>
        </div>
      )}

      <div className="products-grid" aria-live="polite">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
          : visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart[product.id] || 0}
                onAdd={addToCart}
                formatPrice={formatPrice}
              />
            ))}
      </div>

      {!isLoading && hasHiddenProducts && (
        <div className="see-more-wrap">
          <button className="see-more-button" type="button" onClick={() => setShowAllProducts(true)}>
            Ver más productos
          </button>
        </div>
      )}
    </section>
  );
}

export default DailyMenuSection;
