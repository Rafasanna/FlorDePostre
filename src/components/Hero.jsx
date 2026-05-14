import { useState, useEffect } from "react";
import { ArrowDown, Instagram, MessageCircle, ShoppingBag } from "lucide-react";
import { INSTAGRAM_URL, WHATSAPP_URL } from "../config.js";

const carouselImages = [
  "/images/carousel-1.jpg",
  "/images/carousel-2.jpg",
  "/images/carousel-3.jpg",
  "/images/carousel-4.jpg",
  "/images/carousel-5.jpg"
];

function Hero({ itemCount, cateringHref, onOpenCart }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="hero" id="inicio">
      <nav className="nav">
        <a className="brand" href="#inicio" aria-label="Flor de Postre inicio">
          <img src="/images/logo-flor-de-postre.jpeg" alt="" />
          <span>Flor de Postre</span>
        </a>
        <div className="nav-links">
          <a href="#menu">Menu</a>
          <a href="#catering">Catering</a>
          <a href="#como-pedir">Como pedir</a>
          <a href="#" onClick={(e) => { e.preventDefault(); onOpenCart(); }}>Pedido</a>
        </div>
      </nav>

      <div className="hero-content">
        <div className="hero-copy">
          <span className="eyebrow">Menu digital</span>
          <h1>Flor de Postre</h1>
          <p>Pasteleria, desayunos y momentos dulces para compartir</p>
        </div>

        <div className="hero-visual" aria-label="Pasteleria Flor de Postre">
          {carouselImages.map((src, index) => (
            <img 
              key={src}
              className="hero-main-img" 
              src={src} 
              alt="Alfajores artesanales de Flor de Postre" 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: index === currentImageIndex ? 1 : 0,
                transition: 'opacity 1s ease-in-out',
                zIndex: index === currentImageIndex ? 1 : 0
              }}
            />
          ))}
          <div className="hero-card mini-logo" style={{ zIndex: 10 }}>
            <img src="/images/logo-flor-de-postre.jpeg" alt="" />
            <span>@flordepostre.ok</span>
          </div>
          <a className="hero-card mini-cart" href="#" onClick={(e) => { e.preventDefault(); onOpenCart(); }} style={{ zIndex: 10 }}>
            <ShoppingBag size={18} />
            <span>Carrito {itemCount}</span>
          </a>
        </div>
      </div>

      <a className="instagram-pill" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
        <Instagram size={17} />
        @flordepostre.ok
      </a>
    </header>
  );
}

export default Hero;
