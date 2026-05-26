import { Clock, Instagram, MapPin, MessageCircle } from "lucide-react";
import { INSTAGRAM_URL, WHATSAPP_URL } from "../config.js";
import BrandMark from "./BrandMark.jsx";

const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=3%20de%20Febrero%2075";
const RAFAELA_WHATSAPP_URL = "https://wa.me/5493446608118?text=Hola%20Rafa!%20Estoy%20interesado%20en%20una%20pagina%20web%20para%20mi%20negocio..";

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

      <p className="footer-credits">
        Pagina diseñada y desarrollada por{" "}
        <a href={RAFAELA_WHATSAPP_URL} target="_blank" rel="noreferrer">
          Rafaela Sanna
        </a>
      </p>
    </footer>
  );
}

export default Footer;
