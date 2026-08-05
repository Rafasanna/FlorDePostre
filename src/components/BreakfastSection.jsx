import { Home, MessageCircle } from "lucide-react";
import { WHATSAPP_URL } from "../config.js";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";

const makeWhatsappHref = (message) => `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;

const breakfast = [
  "1 bebida a elección (café, jugo exprimido o saquitos de té)",
  "1 yogurt artesanal con frutas y granola",
  "1 tartita o lingote según stock del día",
  "1 scon de queso",
  "1 sándwich de miga",
  "2 medialunas con jamón y queso",
  "1 alfajor o 1 dona",
  "1 tortita de coco, pastafrola o cuadrado de brownie/limón"
];

const notes = [
  "Esta propuesta puede personalizarse.",
  "Podés agregar opciones, sacar productos o adaptar el contenido según lo que estés buscando.",
  "Si querés modificar algo, lo charlamos por WhatsApp."
];

function BreakfastSection() {
  const sectionRef = useIntersectionObserver();

  return (
    <section className="catering-page section page-section reveal-fade" id="desayunos" ref={sectionRef}>
      <article className="catering-panel">
        <div className="catering-panel-header">
          <div className="catering-panel-icon">
            <Home size={22} />
          </div>
          <div className="section-heading">
            <span>A domicilio</span>
            <h2>Desayunos a Domicilio</h2>
            <p>Una propuesta base pensada para regalar o compartir, con opciones dulces, saladas y bebidas.</p>
          </div>
        </div>

        <div className="breakfast-box">
          <div>
            <span>Propuesta estándar</span>
            <h3>Incluye</h3>
          </div>
          <ul>
            {breakfast.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a
            className="breakfast-price"
            href={makeWhatsappHref("Hola! Quiero consultar por el desayuno de $31.500 + envío.")}
            target="_blank"
            rel="noreferrer"
          >
            $31.500 + envío
          </a>
        </div>

        <div className="catering-personalize-note">
          {notes.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <a
          id="catering-whatsapp-cta"
          className="primary-button whatsapp-button catering-panel-cta"
          href={makeWhatsappHref("Hola! Me gustaría consultar por un desayuno personalizado u otras opciones disponibles.")}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={18} />
          Personalizar por WhatsApp
        </a>
      </article>
    </section>
  );
}

export default BreakfastSection;
