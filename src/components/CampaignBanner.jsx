const CAMPAIGN_COLOR_FALLBACKS = {
  fondo: "#FFE5EE",
  texto: "#4B342F",
  acento: "#F0BBDC",
  badge: "#FFCFED"
};

function CampaignBanner({ campaign, onOpenSpecial }) {
  if (!campaign) return null;

  const colors = {
    ...CAMPAIGN_COLOR_FALLBACKS,
    ...(campaign.colors || {})
  };
  const campaignColorStyle = {
    "--campaign-background": colors.fondo,
    "--campaign-text": colors.texto,
    "--campaign-accent": colors.acento,
    "--campaign-badge": colors.badge
  };

  const handleClick = (event) => {
    event.preventDefault();
    onOpenSpecial?.();
  };

  return (
    <section
      className={`campaign-banner campaign-banner-${campaign.temaVisual || "rose"}`}
      style={campaignColorStyle}
    >
      <div className="campaign-banner-copy">
        <span aria-hidden="true">{campaign.decoracion || "🇦🇷"}</span>
        <p>
          <strong>{campaign.titulo}</strong>
          <span aria-hidden="true">•</span>
          {campaign.bannerText || campaign.descripcion}
        </p>
      </div>
      {campaign.textoBoton && campaign.linkBoton && (
        <a className="campaign-banner-link" href={campaign.linkBoton} onClick={handleClick}>
          {campaign.textoBoton}
        </a>
      )}
    </section>
  );
}

export default CampaignBanner;
