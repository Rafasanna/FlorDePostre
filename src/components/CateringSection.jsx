import { Coffee, MessageCircle, Send, Sparkles, WheatOff } from "lucide-react";
import { useIntersectionObserver } from "../hooks/useIntersectionObserver.js";

function CateringSection({ cateringHref }) {
  const sectionRef = useIntersectionObserver();

  return (
    <section className="catering-page section page-section reveal-fade" id="catering" ref={sectionRef}>
      <div className="catering-hero">
        <div className="section-heading">
          <span>Propuestas personalizadas</span>
          <h2>Nuestro Catering</h2>
          <p>
            Propuestas dulces y saladas pensadas para encuentros especiales, reuniones de trabajo, cumpleaños, bautismos y momentos para compartir.
          </p>
          <p>
            En Flor de Postre trabajamos propuestas personalizadas, cuidando la presentación, el detalle y la experiencia de cada cliente.
          </p>
        </div>

        <div className="catering-note">
          <Sparkles size={20} />
          <p>
            No realizamos eventos grandes ni servicio tradicional de eventos. Cada propuesta se arma según las necesidades de cada cliente.
          </p>
        </div>

        <a className="primary-button whatsapp-button catering-main-cta" href={cateringHref} target="_blank" rel="noreferrer">
          <Send size={18} />
          Consultar por WhatsApp
        </a>
      </div>

      <div className="catering-page-block">
        <div className="section-heading compact">
          <span>Encuentros chicos</span>
          <h2>Catering informal</h2>
          <p>
            Opciones pensadas para cumpleaños, bautismos, reuniones familiares, encuentros tranquilos o espacios laborales donde predominan las propuestas finas, delicadas y para compartir.
          </p>
        </div>

        <div className="catering-grid two-columns">
          <article className="catering-card">
            <h3>Para picar / Entradas</h3>
            <p>Ideal cuando ya existe un plato principal y se busca sumar una propuesta salada para acompañar, compartir o recibir invitados.</p>
          </article>
          <article className="catering-card">
            <h3>Propuesta más completa</h3>
            <p>Pensada para quienes buscan una opción salada más amplia o completa.</p>
          </article>
        </div>

        <p className="catering-small-note">Los servicios salados se realizan para propuestas de hasta 60 personas.</p>
      </div>

      <div className="catering-page-block catering-feature-card">
        <Coffee size={22} />
        <div>
          <div className="section-heading compact">
            <span>Empresas y equipos</span>
            <h2>Desayunos para empresas</h2>
            <p>
              Diseñamos desayunos personalizados para reuniones laborales, equipos de trabajo, oficinas, celebraciones corporativas y fechas especiales.
            </p>
          </div>
          <p className="catering-small-note">Podemos preparar propuestas para hasta 150 personas. Cada desayuno se diseña de forma personalizada según las necesidades de cada cliente.</p>
          <a className="primary-button whatsapp-button" href={cateringHref} target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            Consultar propuesta
          </a>
        </div>
      </div>

      <div className="catering-page-block sin-tacc-block">
        <WheatOff size={22} />
        <div className="section-heading compact">
          <span>Línea especial</span>
          <h2>Opciones Sin TACC</h2>
          <p>
            Contamos con línea propia de productos Sin TACC para incorporar dentro de propuestas personalizadas, eventos pequeños y pedidos especiales.
          </p>
        </div>
      </div>

      <div className="catering-page-block catering-feature-card">
        <Coffee size={22} />
        <div>
          <div className="section-heading compact">
            <span>A domicilio</span>
            <h2>Desayunos a domicilio</h2>
            <p>
              Ofrecemos desayunos a domicilio con propuestas predeterminadas donde cada cliente puede elegir qué incluir dentro de las opciones disponibles.
            </p>
          </div>
          <p className="catering-small-note">También es posible agregar, sacar o modificar opciones. Si querés algo diferente, podemos charlarlo por WhatsApp.</p>
          <a className="primary-button whatsapp-button" href={cateringHref} target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            Personalizar por WhatsApp
          </a>
        </div>
      </div>

      <div className="catering-final-cta">
        <span>Consulta personalizada</span>
        <h2>¿Charlamos tu idea?</h2>
        <p>Cada propuesta se diseña según la ocasión, la cantidad de personas y lo que estés buscando.</p>
        <a className="primary-button whatsapp-button" href={cateringHref} target="_blank" rel="noreferrer">
          <Send size={18} />
          Consultar por WhatsApp
        </a>
      </div>
    </section>
  );
}

export default CateringSection;
