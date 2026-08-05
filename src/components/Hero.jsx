import { useState, useEffect } from "react";
import { Instagram, ShoppingBag } from "lucide-react";
import { INSTAGRAM_URL } from "../config.js";
import BrandMark from "./BrandMark.jsx";

const carouselImages = [
  "/images/home-carousel/home-1.jpg",
  "/images/home-carousel/home-2.jpg",
  "/images/home-carousel/home-3.jpg",
  "/images/home-carousel/home-4.jpg",
  "/images/home-carousel/home-5.jpg",
  "/images/home-carousel/home-6.jpg",
  "/images/home-carousel/home-7.jpg",
  "/images/home-carousel/home-8.jpg",
  "/images/home-carousel/home-9.jpg",
  "/images/home-carousel/home-10.jpg",
  "/images/home-carousel/home-11.jpg",
  "/images/home-carousel/home-12.jpg",
  "/images/home-carousel/home-13.jpg",
  "/images/home-carousel/home-14.jpg",
  "/images/home-carousel/home-15.jpg"
];

function Hero({ itemCount, onOpenCart }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [preloadedImageIndexes, setPreloadedImageIndexes] = useState(() => new Set([0]));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const nextImageIndex = (currentImageIndex + 1) % carouselImages.length;
    if (preloadedImageIndexes.has(nextImageIndex)) return undefined;

    let isCancelled = false;
    const image = new Image();
    const markAsPreloaded = () => {
      if (isCancelled) return;

      setPreloadedImageIndexes((currentIndexes) => {
        if (currentIndexes.has(nextImageIndex)) return currentIndexes;
        return new Set([...currentIndexes, nextImageIndex]);
      });
    };

    image.onload = markAsPreloaded;
    image.src = carouselImages[nextImageIndex];
    if (image.complete) markAsPreloaded();

    return () => {
      isCancelled = true;
      image.onload = null;
    };
  }, [currentImageIndex, preloadedImageIndexes]);

  return (
    <header className="hero" id="inicio">
      <BrandMark variant="flower" className="hero-flower-detail" />

      <div className="hero-content">
        <div className="hero-copy">
          <span className="eyebrow">Menú </span>
          <h1>Flor de Postre</h1>
          <p>Pastelería, desayunos y momentos dulces para compartir</p>
        </div>

        <div className="hero-visual" aria-label="Pasteleria Flor de Postre">
          {carouselImages.map((src, index) => {
            if (!preloadedImageIndexes.has(index) && index !== currentImageIndex) return null;

            return (
              <img
                key={src}
                className="hero-main-img"
                src={src}
                alt="Alfajores artesanales de Flor de Postre"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === currentImageIndex ? "high" : "low"}
                decoding="async"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: index === currentImageIndex ? 1 : 0,
                  transition: 'opacity 1s ease-in-out',
                  zIndex: index === currentImageIndex ? 1 : 0
                }}
              />
            );
          })}
          <div className="hero-card mini-logo" style={{ zIndex: 10 }}>
            <BrandMark variant="circle" />
            <span>@flordepostre.ok</span>
          </div>
          <button className="hero-card mini-cart" type="button" onClick={onOpenCart} style={{ zIndex: 10 }}>
            <ShoppingBag size={18} />
            <span>Carrito {itemCount}</span>
          </button>
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
