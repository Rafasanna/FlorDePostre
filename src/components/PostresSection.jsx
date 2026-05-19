import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, MessageCircle, Sparkle } from "lucide-react";
import { postresBase } from "../data/postresData.js";
import { WHATSAPP_URL } from "../config.js";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import BackLink from "./BackLink.jsx";

const buildPostreWhatsappHref = (postre, date) => {
  const message = `Hola Flor de Postre ✨

Quiero consultar por un postre.

Postre: ${postre.nombre}

Fecha en la que lo necesito:
${date || "A definir"}

¿Me confirmás disponibilidad?`;

  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;
};

function PostreImage({ postre, large = false }) {
  if (postre.imagen) {
    return (
      <img
        src={postre.imagen}
        alt={postre.nombre}
        loading={large ? "eager" : "lazy"}
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

function PostresSection() {
  const sectionRef = useIntersectionObserver();
  const [neededDate, setNeededDate] = useState("");
  const { postreId } = useParams();
  const navigate = useNavigate();
  const selectedPostre = useMemo(
    () => postresBase.find((postre) => postre.id === postreId),
    [postreId]
  );

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
              href={buildPostreWhatsappHref(selectedPostre, neededDate)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              Consultar por WhatsApp
            </a>
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
        <BackLink to="/" label="Volver al inicio" />
      </div>

      <div className="postres-grid">
        {postresBase.map((postre) => (
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
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default PostresSection;
