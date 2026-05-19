import BackLink from "../components/BackLink.jsx";

function ComoPedirPage() {
  return (
    <section className="section page-section">
      <div className="section-heading">
        <span>Atención personalizada</span>
        <h2>Cómo pedir</h2>
        <p>
          Armá tu pedido desde el menú digital y envianos la consulta por WhatsApp para confirmar disponibilidad, tiempos y entrega.
        </p>
        <BackLink to="/" label="Volver al inicio" />
      </div>

      <div className="steps page-steps">
        <article>
          <strong>01</strong>
          <h3>Menú</h3>
          <p>Agregá al carrito pastelería, opciones saladas y enviá tu pedido al instante.</p>
        </article>
        <article>
          <strong>02</strong>
          <h3>Postres por encargue</h3>
          <p>Elegí tu postre, el tamaño, la fecha deseada y envianos la consulta para reservar.</p>
        </article>
        <article>
          <strong>03</strong>
          <h3>Tortas a medida</h3>
          <p>Armá tu torta paso a paso y te confirmamos disponibilidad por WhatsApp.</p>
        </article>
      </div>
    </section>
  );
}

export default ComoPedirPage;
