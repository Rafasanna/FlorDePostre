import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MessageCircle, ShoppingBag, Sparkle } from "lucide-react";
import { postresBase } from "../data/postresData.js";
import { WHATSAPP_URL } from "../config.js";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import BackLink from "./BackLink.jsx";

const getAvailableSizes = (postre) => postre.sizes?.filter((size) => size.disponible !== false) || [];

const getLowestPostrePrice = (postre) => {
  const prices = getAvailableSizes(postre).map((size) => size.precio).filter(Number.isFinite);
  return prices.length ? Math.min(...prices) : null;
};

const selectSizeCtaStyle = {
  alignItems: "center",
  alignSelf: "flex-start",
  background: "#B8C19A",
  borderRadius: "999px",
  boxShadow: "0 8px 18px rgba(77, 56, 47, 0.08)",
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

function PostreImage({ postre, large = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(postre.imagen) && !imageFailed;

  useEffect(() => {
    setImageFailed(false);
  }, [postre.imagen]);

  if (hasImage) {
    return (
      <img
        src={postre.imagen}
        alt={postre.nombre}
        loading={large ? "eager" : "lazy"}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="postre-placeholder">
      <Sparkle size={large ? 30 : 24} />
      <span>Flor de Postre</span>
    </div>
  );
}

function PostresSection({ postres = postresBase, formatPrice, onAddToCart }) {
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
          <div className={selectedPostre.imagen ? "postre-detail-media" : "postre-detail-media placeholder"}>
            <PostreImage postre={selectedPostre} large />
          </div>

          <div className="postre-detail-copy">
            <span>Postres por encargue</span>
            <h1>{selectedPostre.nombre}</h1>
            <p>{selectedPostre.descripcion}</p>
            {selectedPostre.detalle && <p>{selectedPostre.detalle}</p>}

            <div className="postre-availability-note">
              Los postres suelen requerir aproximadamente 2 días de anticipación, pero igualmente consultanos disponibilidad para la fecha que necesitás.
            </div>

            {availableSizes.length > 0 && (
              <div className="form-group">
                <label>Elegí el tamaño</label>
                <select
                  className="form-input"
                  value={selectedSize?.id || ""}
                  onChange={(event) => setSelectedSizeId(event.target.value)}
                  style={{
                    appearance: "none",
                    background:
                      "linear-gradient(135deg, rgba(255, 254, 253, 0.96), rgba(255, 250, 243, 0.94))",
                    border: "1px solid rgba(177, 186, 149, 0.58)",
                    borderRadius: "999px",
                    boxShadow: "0 10px 22px rgba(77, 56, 47, 0.07)",
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

        <p className="product-disclaimer">
          Las imágenes son ilustrativas. Al tratarse de productos artesanales, pueden existir pequeñas variaciones en presentación, decoración o detalles. 🌸
        </p>
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
          Tené en cuenta que no todos los postres rinden igual. Los postres con chocolate o crema suelen rendir más que algunas tartas frutales.
        </p>
        <BackLink to="/" label="Volver al inicio" />
      </div>

      <div className="postres-grid">
        {postres.map((postre) => (
          <Link
            key={postre.id} 
            className="postre-card"
            to={`/postres/${postre.id}`}
          >
            <div className={postre.imagen ? "postre-card-media" : "postre-card-media placeholder"}>
              <PostreImage postre={postre} />
            </div>
            <div className="product-info">
              <h3>{postre.nombre}</h3>
              <p>{postre.descripcion}</p>
              {formatPrice && getLowestPostrePrice(postre) !== null && (
                <strong>Desde {formatPrice(getLowestPostrePrice(postre))}</strong>
              )}
              <span
                style={selectSizeCtaStyle}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#AAB68A";
                  event.currentTarget.style.boxShadow = "0 12px 22px rgba(77, 56, 47, 0.12)";
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
            </div>
          </Link>
        ))}
      </div>

      <p className="product-disclaimer">
        Las imágenes son ilustrativas. Al tratarse de productos artesanales, pueden existir pequeñas variaciones en presentación, decoración o detalles. 🌸
      </p>
    </section>
  );
}

export default PostresSection;
