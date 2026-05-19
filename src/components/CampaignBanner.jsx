import { Link } from "react-router-dom";

function CampaignBanner({ campaign }) {
  if (!campaign) return null;

  return (
    <section className={`campaign-banner campaign-banner-${campaign.temaVisual || "rose"}`}>
      <div className="campaign-banner-copy">
        <span>Especial por tiempo limitado</span>
        <h2>{campaign.titulo}</h2>
        <p>{campaign.descripcion}</p>
        {campaign.textoBoton && campaign.linkBoton && (
          <Link className="primary-button" to={campaign.linkBoton}>
            {campaign.textoBoton}
          </Link>
        )}
      </div>
      {campaign.imagen && (
        <img src={campaign.imagen} alt="" aria-hidden="true" />
      )}
    </section>
  );
}

export default CampaignBanner;
