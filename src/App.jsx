import { useMemo, useState } from "react";
import { ArrowLeft, CakeSlice, Gift, Heart, Instagram, MessageCircle, ShoppingBag, Sparkles } from "lucide-react";
import { categories, products } from "./data/products.js";
import { INSTAGRAM_URL, WHATSAPP_URL } from "./config.js";
import Hero from "./components/Hero.jsx";
import CategoryFilter from "./components/CategoryFilter.jsx";
import ProductCard from "./components/ProductCard.jsx";
import Cart from "./components/Cart.jsx";
import Footer from "./components/Footer.jsx";

const formatPrice = (value) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);

function App() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  const categoryProducts = useMemo(() => {
    if (activeCategory === "Todos") return products;
    return products.filter((product) => product.categoria === activeCategory);
  }, [activeCategory]);

  const visibleProducts = useMemo(() => {
    if (activeCategory !== "Todos" || showAllProducts) return categoryProducts;
    return categoryProducts.filter((product) => product.categoria === "Alfajores").slice(0, 4);
  }, [activeCategory, categoryProducts, showAllProducts]);

  const hasHiddenProducts = activeCategory === "Todos" && categoryProducts.length > visibleProducts.length;

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setShowAllProducts(false);
  };

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const product = products.find((item) => item.id === id);
          return product ? { ...product, quantity } : null;
        })
        .filter(Boolean),
    [cart]
  );

  const total = cartItems.reduce((sum, item) => sum + item.precio * item.quantity, 0);
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product) => {
    setCart((current) => ({
      ...current,
      [product.id]: (current[product.id] || 0) + 1
    }));
  };

  const changeQuantity = (id, quantity) => {
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) {
        delete next[id];
      } else {
        next[id] = quantity;
      }
      return next;
    });
  };

  const clearCart = () => setCart({});

  const whatsappMessage = useMemo(() => {
    const detail = cartItems
      .map((item) => `- ${item.nombre} x${item.quantity} - ${formatPrice(item.precio * item.quantity)}`)
      .join("\n");

    return `Hola Flor de Postre! Quiero hacer este pedido:\n\n${detail || "- Aun no agregue productos"}\n\nTotal aproximado: ${formatPrice(total)}\n\nMi nombre:\nDireccion o retiro:\nComentarios:`;
  }, [cartItems, total]);

  const whatsappHref = `${WHATSAPP_URL}?text=${encodeURIComponent(whatsappMessage)}`;
  const cateringHref = `${WHATSAPP_URL}?text=${encodeURIComponent(
    "Hola Flor de Postre! Quiero consultar por catering para un evento.\n\nFecha:\nCantidad de personas:\nTipo de evento:\nHorario:\nComentarios:"
  )}`;

  if (isCartOpen) {
    return (
      <div className="site-shell">
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
          <button onClick={() => setIsCartOpen(false)} className="ghost-button" style={{ margin: 0, padding: '0.5rem 1rem' }}>
            <ArrowLeft size={18} />
            Volver al menu
          </button>
        </header>
        <main style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 200px)' }}>
          <section className="section order-section" id="pedido" style={{ marginTop: 0 }}>
            <div className="section-heading compact">
              <span>Carrito</span>
              <h2>Tu pedido ({itemCount})</h2>
              <p>Revisa cantidades y envia el detalle automaticamente por WhatsApp.</p>
            </div>
            <Cart
              items={cartItems}
              total={total}
              onQuantityChange={changeQuantity}
              onClear={clearCart}
              whatsappHref={whatsappHref}
              formatPrice={formatPrice}
            />
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="site-shell">
      <Hero itemCount={itemCount} cateringHref={cateringHref} onOpenCart={() => setIsCartOpen(true)} />

      <main>
                <section className="section" id="menu">
          <div className="section-heading">
            <span>Menu digital</span>
            <h2>Eleginos para tu mesa dulce, desayuno o evento</h2>
            <p>
              Selecciona productos, revisa el resumen y envia el pedido por WhatsApp con el detalle listo.
            </p>
          </div>

          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onChange={handleCategoryChange}
          />

          <div className="products-grid" aria-live="polite">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart[product.id] || 0}
                onAdd={addToCart}
                formatPrice={formatPrice}
              />
            ))}
          </div>

          {hasHiddenProducts && (
            <div className="see-more-wrap">
              <button className="see-more-button" type="button" onClick={() => setShowAllProducts(true)}>
                Ver mas productos
              </button>
            </div>
          )}
        </section>

        <section className="catering-section" id="catering">
          <div className="catering-copy">
            <span>Catering</span>
            <h2>Dulce, salado o los dos para tu evento 🧁</h2>
            <p>
              Armamos propuestas a medida segun cantidad de personas, tipo de evento, horario y gustos. Escribinos y coordinamos una opcion pensada para tu mesa.
            </p>
            <a className="primary-button catering-button" href={cateringHref} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              Consultar por WhatsApp
            </a>
          </div>
          <div className="catering-notes" aria-label="Informacion de catering">
            <article>
              <CakeSlice size={20} />
              <strong>Mesas dulces</strong>
              <p>Postres, tortas, alfajores, budines y bandejas materas.</p>
            </article>
            <article>
              <Gift size={20} />
              <strong>Opciones saladas</strong>
              <p>Sandwiches, tartas, ensaladas y propuestas para reuniones.</p>
            </article>
            <article>
              <Sparkles size={20} />
              <strong>A medida</strong>
              <p>Nos adaptamos al evento para que solo tengas que disfrutar.</p>
            </article>
          </div>
        </section>

        <section className="how-to section" id="como-pedir">
          <div className="section-heading compact">
            <span>Como pedir</span>
            <h2>Simple, rapido y con atencion personalizada</h2>
          </div>
          <div className="steps">
            <article>
              <strong>01</strong>
              <h3>Elegis</h3>
              <p>Agrega al carrito pasteleria, desayunos y opciones saladas.</p>
              <a className="mini-whatsapp-link" href={cateringHref} target="_blank" rel="noreferrer">
                <MessageCircle size={16} />
                Consultar catering
              </a>
            </article>
            <article>
              <strong>02</strong>
              <h3>Revisas 🧁</h3>
              <p>Controla cantidades y total aproximado antes de enviar el mensaje.</p>
            </article>
            <article>
              <strong>03</strong>
              <h3>Coordinamos</h3>
              <p>El pedido llega a WhatsApp y se define entrega, retiro o detalles del evento.</p>
            </article>
          </div>
        </section>
      </main>

      <button className="floating-cart" onClick={() => setIsCartOpen(true)} aria-label="Ver carrito" style={{ border: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
        <ShoppingBag size={18} />
        <span>Carrito {itemCount}</span>
      </button>

      <Footer />
    </div>
  );
}

export default App;
