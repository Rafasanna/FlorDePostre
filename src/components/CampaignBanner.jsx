function CampaignBanner({ campaign, onOpenSpecial }) {
  if (!campaign) return null;

  const handleClick = (event) => {
    event.preventDefault();
    onOpenSpecial?.();
  };

  return (
    <section className={`campaign-banner campaign-banner-${campaign.temaVisual || "rose"}`}>
      <div className="campaign-banner-copy">
        <span aria-hidden="true">🇦🇷</span>
        <p>
          <strong>{campaign.titulo}</strong>
          <span aria-hidden="true">•</span>
          {campaign.descripcion}
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
