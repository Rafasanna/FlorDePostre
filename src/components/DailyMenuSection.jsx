import { useMemo, useState } from "react";
import { categories, dailyProducts } from "../data/dailyProducts.js";
import CategoryFilter from "./CategoryFilter.jsx";
import ProductCard from "./ProductCard.jsx";
import ProductSkeleton from "./ProductSkeleton.jsx";
import FeaturedProductsSection from "./FeaturedProductsSection.jsx";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import { getFeaturedProducts, getVisibleProducts } from "../utils/seasonal.js";

function DailyMenuSection({ cart, addToCart, formatPrice, isLoading }) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const sectionRef = useIntersectionObserver();
  const visibleCatalog = useMemo(() => getVisibleProducts(dailyProducts), []);
  const featuredProducts = useMemo(() => getFeaturedProducts(dailyProducts).slice(0, 4), []);

  const categoryProducts = useMemo(() => {
    if (activeCategory === "Todos") return visibleCatalog;
    if (activeCategory === "Sin TACC") return visibleCatalog.filter((product) => product.sinTacc);
    return visibleCatalog.filter((product) => product.categoria === activeCategory);
  }, [activeCategory, visibleCatalog]);

  const visibleProducts = useMemo(() => {
    if (activeCategory !== "Todos" || showAllProducts) return categoryProducts;
    return categoryProducts.filter((product) => product.categoria === "Alfajores").slice(0, 4);
  }, [activeCategory, categoryProducts, showAllProducts]);

  const hasHiddenProducts = activeCategory === "Todos" && categoryProducts.length > visibleProducts.length;

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setShowAllProducts(false);
  };

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
        categories={categories}
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
