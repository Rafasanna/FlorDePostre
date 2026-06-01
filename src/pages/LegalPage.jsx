import BackLink from "../components/BackLink.jsx";

const termsSections = [
  {
    title: "Funcionamiento del sitio",
    content:
      "La web funciona como catálogo digital y herramienta de armado de pedidos. Los pedidos se coordinan y confirman personalmente por WhatsApp o de manera presencial en el local."
  },
  {
    title: "Disponibilidad de productos",
    content:
      "Todos los productos están sujetos a disponibilidad, producción diaria, temporada y capacidad de elaboración."
  },
  {
    title: "Precios",
    content:
      "Los precios publicados en la web corresponden a los valores vigentes al momento de la consulta."
  },
  {
    title: "Confirmación del pedido",
    content:
      "El envío del pedido desde la web no implica aceptación automática. Todos los pedidos son revisados, coordinados y confirmados manualmente según disponibilidad, fecha, cantidades y detalles del encargo."
  },
  {
    title: "Pedidos por encargo y personalizados",
    content:
      "Algunos productos se elaboran por pedido, reserva o personalización. En estos casos, pueden requerirse tiempos de anticipación específicos que serán coordinados con cada cliente."
  },
  {
    title: "Entregas y retiros",
    content:
      "Las fechas, horarios, modalidad de entrega o retiro se coordinan personalmente por WhatsApp o en el local, según disponibilidad y organización del pedido."
  },
  {
    title: "Información proporcionada por el cliente",
    content:
      "Es responsabilidad del cliente verificar que los datos enviados sean correctos, incluyendo nombre, teléfono, fecha solicitada, productos, cantidades y cualquier información necesaria para la coordinación."
  },
  {
    title: "Imágenes y presentación de productos",
    content:
      "Las imágenes son ilustrativas o representativas de los productos. Al tratarse de elaboración artesanal, pueden existir pequeñas variaciones de presentación, decoración o terminación."
  },
  {
    title: "Propiedad intelectual",
    content:
      "El contenido del sitio, incluyendo diseño, textos, imágenes, marca, identidad visual y material gráfico, pertenece a Flor de Postre y no podrá utilizarse, reproducirse ni distribuirse sin autorización."
  }
];

function LegalPage({ title }) {
  const isTermsPage = title.toLowerCase().includes("términos");

  return (
    <section className="section page-section legal-page">
      <div className="section-heading">
        <span>Información legal</span>
        <h2>{title}</h2>
        <BackLink to="/" label="Volver al inicio" />
      </div>

      {isTermsPage ? (
        <div className="legal-content">
          {termsSections.map((section) => (
            <article key={section.title} className="legal-block">
              <h3>{section.title}</h3>
              <p>{section.content}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="legal-content">
          <article className="legal-block">
            <p>Contenido pendiente de definir.</p>
          </article>
        </div>
      )}
    </section>
  );
}

export default LegalPage;
