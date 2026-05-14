import { Instagram, MapPin, MessageCircle, Heart } from "lucide-react";
import { INSTAGRAM_URL, WHATSAPP_URL } from "../config.js";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-info">
        <strong>Flor de Postre</strong>
        <p>Pastelería, desayunos y catering artesanal.</p>
        <p className="footer-address">
          <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
          3 de febrero 85
        </p>
      </div>
      
      <div className="footer-credits">
        <p>Página creada y diseñada por <strong>Rafaela Sanna</strong> <Heart size={12} style={{ display: 'inline', color: 'var(--rose-500)' }} /></p>
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
    </footer>
  );
}

export default Footer;
