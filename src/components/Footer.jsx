import { Clock, Instagram, MapPin, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { INSTAGRAM_URL, WHATSAPP_URL } from "../config.js";
import BrandMark from "./BrandMark.jsx";

const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=3%20de%20Febrero%2075";
const RAFAELA_WHATSAPP_MESSAGE = "¡Hola Rafaela! Vi tu trabajo en Flor de Postre y me gustaría consultarte por una página web 😊";
const RAFAELA_WHATSAPP_URL = `https://wa.me/54344660818?text=${encodeURIComponent(RAFAELA_WHATSAPP_MESSAGE)}`;

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-info">
        <BrandMark variant="flower" className="footer-flower-detail" />
        <strong>Flor de Postre</strong>
        <p>Pastelería, desayunos y catering artesanal.</p>
        <a className="footer-address" href={MAPS_URL} target="_blank" rel="noreferrer">
          <MapPin size={15} />
          <span>3 de Febrero 75</span>
        </a>
      </div>

      <div className="footer-hours" aria-label="Horarios de atención">
        <div className="footer-hours-title">
          <Clock size={15} />
          <strong>Horarios</strong>
        </div>
        <div className="footer-schedule">
          <p>
            <span>Lunes a viernes</span>
            7:30 hs a 13:00 hs<br />
            16:30 hs a 20:30 hs
          </p>
          <p>
            <span>Sábados</span>
            9:00 hs a 13:30 hs<br />
            16:30 hs a 20:30 hs
          </p>
        </div>
      </div>

      <div className="footer-links">
        <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">
          <Instagram size={17} />
          Instagram
        </a>
        <a href={`${WHATSAPP_URL}?text=Hola%20Flor%20de%20postre%2C%20les%20queria%20consultar%20por..`} target="_blank" rel="noreferrer">
          <MessageCircle size={17} />
          WhatsApp
        </a>
      </div>

      <nav className="footer-legal" aria-label="Enlaces legales">
        <Link to="/terminos-y-condiciones">Términos y condiciones</Link>
        <span aria-hidden="true">·</span>
        <Link to="/politicas-de-privacidad">Políticas de privacidad</Link>
      </nav>

      <p className="footer-credits">
        Diseño & desarrollo web ·{" "}
        <a href={RAFAELA_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
          Rafaela Sanna
        </a>
      </p>
    </footer>
  );
}

export default Footer;
