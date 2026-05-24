const normalizeCampaignColor = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CAMPAIGN_COLOR_STYLES = {
  "celeste pastel": {
    background: "#CFEAF7",
    borderBlockColor: "rgba(127, 183, 217, 0.34)"
  },
  "rosa principal": {
    background: "#F9DCE9",
    borderBlockColor: "rgba(240, 187, 220, 0.38)"
  },
  "verde oliva suave": {
    background: "#E7EAD9",
    borderBlockColor: "rgba(177, 186, 149, 0.42)"
  },
  crema: {
    background: "#FFF5E8",
    borderBlockColor: "rgba(232, 207, 174, 0.44)"
  },
  "lavanda suave": {
    background: "#ECE4F7",
    borderBlockColor: "rgba(187, 166, 217, 0.34)"
  },
  "rojo suave verde": {
    background: "linear-gradient(90deg, #F7D9D9 0%, #F7E7E7 48%, #E3ECD8 100%)",
    borderBlockColor: "rgba(177, 186, 149, 0.38)"
  }
};

function CampaignBanner({ campaign, onOpenSpecial }) {
  if (!campaign) return null;

  const campaignColorStyle = CAMPAIGN_COLOR_STYLES[normalizeCampaignColor(campaign.color)];

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
