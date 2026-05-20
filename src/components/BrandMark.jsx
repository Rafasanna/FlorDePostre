const BRAND_ASSETS = {
  official: "/images/flor-de-postre-logo-pink.png",
  flower: "/images/flor-de-postre-flower-pink.png",
  circle: "/images/flor-de-postre-logo-circle.png",
  horizontal: "/images/flor-de-postre-logo-pink.png"
};

function BrandMark({ variant = "horizontal", className = "" }) {
  const isDecorative = variant === "flower";
  const src = BRAND_ASSETS[variant] ?? BRAND_ASSETS.horizontal;

  return (
    <span
      className={`brand-mark brand-mark-${variant} ${className}`}
      aria-hidden={isDecorative ? "true" : undefined}
    >
      <img
        className="brand-mark-img"
        src={src}
        alt={isDecorative ? "" : "Flor de Postre"}
        loading={variant === "official" ? "eager" : "lazy"}
      />
    </span>
  );
}

export default BrandMark;
