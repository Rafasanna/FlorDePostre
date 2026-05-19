import ProductCard from "./ProductCard.jsx";

function FeaturedProductsSection({ products, cart, addToCart, formatPrice }) {
  if (!products.length) return null;

  return (
    <section className="featured-products" aria-labelledby="featured-products-title">
      <div className="section-heading compact">
        <span id="featured-products-title">Productos destacados</span>
      </div>
      <div className="products-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            quantity={cart[product.id] || 0}
            onAdd={addToCart}
            formatPrice={formatPrice}
          />
        ))}
      </div>
    </section>
  );
}

export default FeaturedProductsSection;
