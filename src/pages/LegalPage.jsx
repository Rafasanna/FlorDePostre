import BackLink from "../components/BackLink.jsx";

function LegalPage({ title }) {
  return (
    <section className="section page-section legal-page">
      <div className="section-heading">
        <span>Información legal</span>
        <h2>{title}</h2>
        <p>Contenido pendiente de definir.</p>
        <BackLink to="/" label="Volver al inicio" />
      </div>
    </section>
  );
}

export default LegalPage;
