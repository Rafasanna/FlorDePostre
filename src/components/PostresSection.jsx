import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MessageCircle, ShoppingBag, Sparkle } from "lucide-react";
import { postresBase } from "../data/postresData.js";
import { WHATSAPP_URL } from "../config.js";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import { getDisplayImageUrl, getProductImages, getResponsiveImageSrcSet } from "../utils/productImages.js";
import BackLink from "./BackLink.jsx";

const getAvailableSizes = (postre) => postre.sizes?.filter((size) => size.disponible !== false) || [];

const getLowestPostrePrice = (postre) => {
  const prices = getAvailableSizes(postre).map((size) => size.precio).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : null;
};

const selectSizeCtaStyle = {
  alignItems: "center",
  alignSelf: "flex-start",
  background: "var(--color-rose)",
  borderRadius: "999px",
  boxShadow: "var(--shadow-soft)",
  color: "var(--cocoa)",
  cursor: "pointer",
  display: "inline-flex",
  fontSize: "0.82rem",
  fontWeight: 800,
  gap: "7px",
  justifyContent: "center",
  lineHeight: 1,
  marginTop: "4px",
  minHeight: "36px",
  padding: "0 15px",
  transition: "background 180ms ease, box-shadow 180ms ease, transform 180ms ease"
};

const buildPostreWhatsappHref = (postre, size, date) => {
  const message = `Hola Flor de Postre ✨

Quiero consultar por un postre.

Postre: ${postre.nombre}
Tamaño: ${size ? `${size.nombre} (${size.porciones})` : "A definir"}
Precio estimado: ${size ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(size.precio) : "A definir"}

Fecha en la que lo necesito:
${date || "A definir"}

¿Me confirmás disponibilidad?`;

  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
};

function PostreImage({ postre, large = false, priority = false }) {
  const images = useMemo(() => getProductImages(postre), [postre]);
  const imagesKey = images.join("|");
  const [failedImages, setFailedImages] = useState([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const activeImage = images.find((image) => !failedImages.includes(image)) || "";
  const activeImageUrl = getDisplayImageUrl(activeImage, {
    width: large ? 1200 : 768,
    quality: large ? "best" : "good"
  });
  const activeImageSrcSet = getResponsiveImageSrcSet(activeImage, large ? [768, 1200, 1800] : [480, 768, 1200], {
    quality: large ? "best" : "good"
  });
  const hasImage = Boolean(activeImage);

  useEffect(() => {
    setFailedImages([]);
  }, [imagesKey]);

  useEffect(() => {
    setImageLoaded(false);
  }, [activeImage]);

  if (hasImage) {
    return (
      <>
        <img
          src={activeImageUrl}
          srcSet={activeImageSrcSet || undefined}
          sizes={large
            ? "(max-width: 960px) calc(100vw - 48px), 55vw"
            : "(max-width: 680px) calc(100vw - 32px), (max-width: 960px) calc(50vw - 42px), 360px"}
          alt={postre.nombre}
          loading={large || priority ? "eager" : "lazy"}
          fetchPriority={large || priority ? "high" : undefined}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setFailedImages((currentImages) =>
              currentImages.includes(activeImage) ? currentImages : [...currentImages, activeImage]
            );
          }}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
        {!imageLoaded && (
          <div className="postre-placeholder">
            <Sparkle size={large ? 30 : 24} />
            <span>Flor de Postre</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="postre-placeholder">
      <Sparkle size={large ? 30 : 24} />
      <span>Flor de Postre</span>
    </div>
  );
}

function PostreGallery({ postre }) {
  const images = useMemo(() => getProductImages(postre), [postre]);
  const imagesKey = images.join("|");
  const [failedImages, setFailedImages] = useState([]);
  const availableImages = useMemo(
    () => images.filter((image) => !failedImages.includes(image)),
    [failedImages, images]
  );
  const [selectedImage, setSelectedImage] = useState(images[0] || "");
  const [imageLoaded, setImageLoaded] = useState(false);
  const selectedImageUrl = getDisplayImageUrl(selectedImage, {
    width: 1200,
    quality: "best"
  });
  const selectedImageSrcSet = getResponsiveImageSrcSet(selectedImage, [768, 1200, 1800], {
    quality: "best"
  });
  const hasImages = availableImages.length > 0;

  useEffect(() => {
    setSelectedImage(images[0] || "");
    setFailedImages([]);
  }, [imagesKey]);

  useEffect(() => {
    setImageLoaded(false);
  }, [selectedImage]);

  useEffect(() => {
    if (!availableImages.length) return;

    if (!selectedImage || !availableImages.includes(selectedImage)) {
      setSelectedImage(availableImages[0]);
    }
  }, [availableImages, selectedImage]);

  if (!hasImages) {
    return (
      <div className="postre-placeholder">
        <Sparkle size={30} />
        <span>Flor de Postre</span>
      </div>
    );
  }

  return (
    <>
      <img
        src={selectedImageUrl}
        srcSet={selectedImageSrcSet || undefined}
        sizes="(max-width: 960px) calc(100vw - 48px), 55vw"
        alt={postre.nombre}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setFailedImages((currentImages) =>
            currentImages.includes(selectedImage) ? currentImages : [...currentImages, selectedImage]
          );
        }}
        style={{ opacity: imageLoaded ? 1 : 0 }}
      />
      {!imageLoaded && (
        <div className="postre-placeholder">
          <Sparkle size={30} />
          <span>Flor de Postre</span>
        </div>
      )}
      {availableImages.length > 1 && (
        <div className="postre-gallery-thumbs" aria-label="Imágenes del producto">
          {availableImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={image === selectedImage ? "active" : ""}
              onClick={() => setSelectedImage(image)}
              aria-label={`Ver imagen ${index + 1} de ${availableImages.length} de ${postre.nombre}`}
            >
              <img
                src={getDisplayImageUrl(image, {
                  width: 160,
                  quality: "good"
                })}
                srcSet={getResponsiveImageSrcSet(image, [160, 300], { quality: "good" }) || undefined}
                sizes="80px"
                alt=""
                loading="lazy"
                decoding="async"
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

const POSTRES_PRICING_UNAVAILABLE_MESSAGE =
  "No pudimos cargar los tamaños y precios en este momento. Consultanos por WhatsApp.";

function PostresSection({ postres = postresBase, formatPrice, onAddToCart, isPricingLoading = false }) {
  const sectionRef = useIntersectionObserver();
  const [neededDate, setNeededDate] = useState("");
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const { postreId } = useParams();
  const navigate = useNavigate();
  const selectedPostre = useMemo(
    () => postres.find((postre) => postre.id === postreId),
    [postreId, postres]
  );
  const availableSizes = useMemo(() => getAvailableSizes(selectedPostre || {}), [selectedPostre]);
  const selectedSize = availableSizes.find((size) => size.id === selectedSizeId) || availableSizes[0] || null;
  const priorityImageIds = useMemo(
    () => new Set(
      postres
        .filter((postre) => getProductImages(postre).length > 0)
        .slice(0, 4)
        .map((postre) => postre.id)
    ),
    [postres]
  );

  const handleAddPostreToCart = () => {
    if (!selectedPostre || !selectedSize || !onAddToCart) return;

    onAddToCart({
      type: "postre",
      product: selectedPostre,
      nombre: selectedPostre.nombre,
      precio: selectedSize.precio,
      quantity: 1,
      configuracion: {
        sizeId: selectedSize.id,
        sizeName: selectedSize.nombre,
        porciones: selectedSize.porciones,
        date: neededDate,
        comments: ""
      }
    });
  };

  if (postreId) {
    if (!selectedPostre) {
      return (
        <section className="section page-section reveal-fade" id="postres" ref={sectionRef}>
          <div className="section-heading">
            <span>Postres por encargue</span>
            <h2>No encontramos ese postre</h2>
            <p>Podés volver al catálogo y elegir otra opción.</p>
            <BackLink to="/postres" label="Volver a postres" />
          </div>
        </section>
      );
    }

    return (
      <section className="section page-section reveal-fade" id="postres" ref={sectionRef}>
        <BackLink onClick={() => navigate("/postres")} label="Volver a postres" />

        <article className="postre-detail">
          <div className={getProductImages(selectedPostre).length > 0 ? "postre-detail-media" : "postre-detail-media placeholder"}>
            <PostreGallery postre={selectedPostre} />
          </div>

          <div className="postre-detail-copy">
            <span>Postres por encargue</span>
            <h1>{selectedPostre.nombre}</h1>
            <p>{selectedPostre.descripcion}</p>
            {selectedPostre.detalle && <p>{selectedPostre.detalle}</p>}

            <div className="postre-availability-note">
              Los postres suelen requerir aproximadamente 2 días de anticipación, pero igualmente consultanos disponibilidad para la fecha que necesitás.
            </div>

            {availableSizes.length > 0 ? (
              <div className="form-group">
                <label>Elegí el tamaño</label>
                <select
                  className="form-input"
                  value={selectedSize?.id || ""}
                  onChange={(event) => setSelectedSizeId(event.target.value)}
                  style={{
                    appearance: "none",
                    background:
                      "linear-gradient(135deg, var(--color-white-warm), var(--color-rose-light))",
                    border: "1px solid var(--color-rose-old)",
                    borderRadius: "999px",
                    boxShadow: "var(--shadow-soft)",
                    color: "var(--cocoa)",
                    cursor: "pointer",
                    fontWeight: 800,
                    minHeight: "48px",
                    padding: "0 44px 0 18px"
                  }}
                >
                  {availableSizes.map((size) => (
                    <option key={size.id} value={size.id}>
                      {size.nombre} — {size.porciones} — {formatPrice ? formatPrice(size.precio) : size.precio}
                    </option>
                  ))}
                </select>
                {selectedSize && (
                  <p>
                    {selectedSize.porciones} · {formatPrice ? formatPrice(selectedSize.precio) : selectedSize.precio}
                  </p>
                )}
              </div>
            ) : (
              <div className="postre-pricing-notice" role="status">
                {isPricingLoading
                  ? "Estamos cargando los tamaños y precios."
                  : POSTRES_PRICING_UNAVAILABLE_MESSAGE}
              </div>
            )}

            <label className="postre-date-field">
              <span>
                <CalendarDays size={17} />
                ¿Para qué fecha lo necesitás?
              </span>
              <input
                type="date"
                value={neededDate}
                onChange={(event) => setNeededDate(event.target.value)}
              />
            </label>

            <a
              className="primary-button whatsapp-button postre-whatsapp"
              href={buildPostreWhatsappHref(selectedPostre, selectedSize, neededDate)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              Consultar por WhatsApp
            </a>

            {selectedSize && onAddToCart && (
              <button className="primary-button" type="button" onClick={handleAddPostreToCart}>
                <ShoppingBag size={18} />
                Agregar a Mi pedido
              </button>
            )}
          </div>
        </article>

      </section>
    );
  }

  return (
    <section className="section page-section reveal-fade" id="postres" ref={sectionRef}>
      <div className="section-heading">
        <span>Postres por encargue</span>
        <h2>Los clásicos que nunca fallan</h2>
        <p>
          Elegí tu postre favorito, seleccioná el tamaño y reservalo para tu próxima fecha especial.
        </p>
        <p>
          Tené en cuenta que no todos los postres rinden igual. Por ejemplo, aquellos que tienen cremas o chocolate, son más rendidores que un postre liviano como un tiramisú o una tarta frutal. Nuestro cálculo es estimado, cortando porciones chicas. Por eso, te sugerimos siempre avisarnos la cantidad de comensales para que podamos asesorarte y elegir el tamaño correcto para vos.
        </p>
        <BackLink to="/" label="Volver al inicio" />
      </div>

      <div className="postres-grid">
        {postres.map((postre) => {
          const lowestPrice = getLowestPostrePrice(postre);
          const hasAvailableSizes = getAvailableSizes(postre).length > 0;

          return (
            <Link
              key={postre.id}
              className="postre-card"
              to={`/postres/${postre.id}`}
            >
              <div className={getProductImages(postre).length > 0 ? "postre-card-media" : "postre-card-media placeholder"}>
                <PostreImage postre={postre} priority={priorityImageIds.has(postre.id)} />
              </div>
              <div className="product-info">
                <h3>{postre.nombre}</h3>
                <p>{postre.descripcion}</p>
                {formatPrice && lowestPrice !== null && (
                  <strong>Desde {formatPrice(lowestPrice)}</strong>
                )}
                {hasAvailableSizes ? (
                  <span
                    style={selectSizeCtaStyle}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.background = "var(--color-rose-old)";
                      event.currentTarget.style.boxShadow = "var(--shadow-soft)";
                      event.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.background = selectSizeCtaStyle.background;
                      event.currentTarget.style.boxShadow = selectSizeCtaStyle.boxShadow;
                      event.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Seleccionar tamaño
                    <span aria-hidden="true">+</span>
                  </span>
                ) : (
                  <small className="postre-pricing-status">
                    {isPricingLoading
                      ? "Cargando tamaños y precios…"
                      : "Tamaños y precios temporalmente no disponibles"}
                  </small>
                )}
              </div>
            </Link>
          );
        })}
      </div>

    </section>
  );
}

export default PostresSection;
