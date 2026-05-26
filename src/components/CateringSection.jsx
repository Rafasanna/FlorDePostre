import { useMemo, useState } from "react";
import { Building2, Home, MessageCircle, Send, Sparkles, WheatOff } from "lucide-react";
import { WHATSAPP_URL } from "../config.js";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";
import BackLink from "./BackLink.jsx";

const makeWhatsappHref = (message) => `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`;

const cateringTabs = [
  {
    id: "informal",
    label: "Catering Informal",
    eyebrow: "Encuentros chicos",
    title: "Catering Informal",
    icon: Sparkles,
    cta: "Consultar por WhatsApp",
    message:
      "Hola Flor de Postre! Quiero consultar por Catering Informal.\n\nTipo de encuentro:\nCantidad aproximada de personas:\nFecha:\nIdea general:\n\n¿Me pasan opciones disponibles?",
    content: {
      intro: [
        "Propuestas pensadas para cumpleaños, bautismos, reuniones tranquilas, encuentros familiares y espacios laborales.",
        "Predominan las opciones finas, delicadas y pensadas para compartir."
      ],
      note: [
        "No trabajamos eventos grandes ni servicio tradicional de eventos.",
        "Cada propuesta se diseña de forma personalizada."
      ],
      cards: [
        {
          title: "Para picar / Entradas",
          text: "Ideal cuando ya existe un plato principal y se busca sumar una propuesta salada para acompañar o recibir invitados."
        },
        {
          title: "Propuesta más completa",
          text: "Pensada para quienes buscan una opción salada más amplia."
        }
      ],
      smallNote: "Los servicios salados se realizan para propuestas de hasta 60 personas."
    }
  },
  {
    id: "sin-tacc",
    label: "Línea Especial Sin TACC",
    eyebrow: "Línea especial",
    title: "Línea Especial Sin TACC",
    icon: WheatOff,
    cta: "Consultar opciones",
    message:
      "Hola Flor de Postre! Quiero consultar por la Línea Especial Sin TACC.\n\nTipo de pedido o propuesta:\nCantidad aproximada:\nFecha:\n\n¿Me cuentan qué opciones tienen disponibles?",
    content: {
      intro: [
        "Contamos con línea propia de productos Sin TACC para incorporar dentro de propuestas personalizadas, catering informal y pedidos especiales.",
        "Armamos cada consulta con el mismo cuidado artesanal, manteniendo una presentación delicada y pensada para compartir."
      ]
    }
  },
  {
    id: "empresas",
    label: "Desayunos para Empresas",
    eyebrow: "Empresas y equipos",
    title: "Desayunos para Empresas",
    icon: Building2,
    cta: "Consultar propuesta",
    message:
      "Hola Flor de Postre! Quiero consultar por Desayunos para Empresas.\n\nEmpresa / equipo:\nCantidad aproximada de personas:\nFecha:\nLugar de entrega:\nIdea o necesidad:\n\n¿Me pasan una propuesta?",
    content: {
      intro: [
        "Diseñamos desayunos personalizados para oficinas, reuniones laborales, equipos de trabajo, celebraciones corporativas y fechas especiales."
      ],
      note: [
        "Podemos trabajar propuestas de hasta 150 personas.",
        "Cada desayuno se diseña según las necesidades del cliente."
      ]
    }
  },
  {
    id: "domicilio",
    label: "Desayunos a Domicilio",
    eyebrow: "A domicilio",
    title: "Desayunos a Domicilio",
    icon: Home,
    cta: "Personalizar por WhatsApp",
    message:
      "Hola! Me gustaría consultar por un desayuno personalizado u otras opciones disponibles.",
    content: {
      intro: [
        "Una propuesta base pensada para regalar o compartir, con opciones dulces, saladas y bebidas."
      ],
      breakfast: [
        "1 bebida a elección (café, jugo exprimido o saquitos de té)",
        "1 yogurt artesanal con frutas y granola",
        "1 tartita o lingote según stock del día",
        "1 scon de queso",
        "1 sándwich de miga",
        "2 medialunas con jamón y queso",
        "1 alfajor o 1 dona",
        "1 tortita de coco, pastafrola o cuadrado de brownie/limón"
      ],
      price: "$31.500 + envío",
      note: [
        "Esta propuesta puede personalizarse.",
        "Podés agregar opciones, sacar productos o adaptar el contenido según lo que estés buscando.",
        "Si querés modificar algo, lo charlamos por WhatsApp."
      ]
    }
  }
];

function CateringSection() {
  const sectionRef = useIntersectionObserver();
  const [activeTabId, setActiveTabId] = useState(cateringTabs[0].id);
  const activeTab = useMemo(
    () => cateringTabs.find((tab) => tab.id === activeTabId) || cateringTabs[0],
    [activeTabId]
  );
  const ActiveIcon = activeTab.icon;

  return (
    <section className="catering-page section page-section reveal-fade" id="catering" ref={sectionRef}>
      <div className="catering-hero">
        <div className="section-heading">
          <span>Propuestas personalizadas</span>
          <h2>Nuestro Catering</h2>
          <p>
            Propuestas dulces y saladas pensadas para encuentros especiales, desayunos, reuniones y momentos para compartir.
          </p>
          <p>
            Elegí el tipo de consulta y revisá una guía simple para saber qué podemos armar.
          </p>
          <BackLink to="/" label="Volver al inicio" />
        </div>
      </div>

      <div className="catering-tabs" role="tablist" aria-label="Tipos de catering">
        {cateringTabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = tab.id === activeTab.id;

          return (
            <button
              key={tab.id}
              className={isActive ? "active" : ""}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`catering-panel-${tab.id}`}
              id={`catering-tab-${tab.id}`}
              onClick={() => setActiveTabId(tab.id)}
            >
              <TabIcon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <article
        className="catering-panel"
        id={`catering-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`catering-tab-${activeTab.id}`}
      >
        <div className="catering-panel-header">
          <div className="catering-panel-icon">
            <ActiveIcon size={22} />
          </div>
          <div className="section-heading">
            <span>{activeTab.eyebrow}</span>
            <h2>{activeTab.title}</h2>
            {activeTab.content.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>

        {activeTab.content.note && activeTab.id !== "domicilio" && (
          <div className="catering-note">
            <Sparkles size={20} />
            <div>
              {activeTab.content.note.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}

        {activeTab.content.cards && (
          <div className="catering-grid two-columns">
            {activeTab.content.cards.map((card) => (
              <article className="catering-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        )}

        {activeTab.content.smallNote && (
          <p className="catering-small-note">{activeTab.content.smallNote}</p>
        )}

        {activeTab.content.breakfast && (
          <div className="breakfast-box">
            <div>
              <span>Propuesta estándar</span>
              <h3>Incluye</h3>
            </div>
            <ul>
              {activeTab.content.breakfast.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {activeTab.id === "domicilio" ? (
              <a
                className="breakfast-price"
                href={makeWhatsappHref("Hola! Quiero consultar por el desayuno de $31.500 + envío.")}
                target="_blank"
                rel="noreferrer"
              >
                {activeTab.content.price}
              </a>
            ) : (
              <strong className="breakfast-price">{activeTab.content.price}</strong>
            )}
          </div>
        )}

        {activeTab.id === "domicilio" && activeTab.content.note && (
          <div className="catering-personalize-note">
            {activeTab.content.note.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}

        <a
          className="primary-button whatsapp-button catering-panel-cta"
          href={makeWhatsappHref(activeTab.message)}
          target="_blank"
          rel="noreferrer"
        >
          {activeTab.id === "domicilio" ? <MessageCircle size={18} /> : <Send size={18} />}
          {activeTab.cta}
        </a>
      </article>
    </section>
  );
}

export default CateringSection;
