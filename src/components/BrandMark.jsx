function FlowerLine({ className = "" }) {
  return (
    <svg className={`brand-flower-svg ${className}`} viewBox="0 0 120 120" aria-hidden="true">
      <path d="M61 15c13 0 18 9 21 19 10 0 20 5 22 17 3 15-7 22-17 27 1 12-7 24-21 26-12 2-20-5-25-14-12 1-25-7-27-21-2-13 6-22 16-27-2-13 7-27 23-29 3 0 5 0 8 2Z" />
      <path d="M43 36c13-6 27-3 35 8 8 10 8 25-2 36-11 12-29 13-42 1-10-10-10-25-1-37" />
      <path d="M57 42c11-1 21 8 21 20 0 10-7 19-17 21-11 2-21-5-24-16-2-11 5-22 16-25" />
      <path d="M59 54c7-1 13 4 14 11 1 6-4 12-11 13-7 1-13-4-14-11-1-7 4-13 11-13Z" />
    </svg>
  );
}

function BrandText() {
  return (
    <span className="brand-mark-text" aria-hidden="true">
      <span>Flor</span>
      <span>de</span>
      <span>Postre</span>
    </span>
  );
}

function BrandMark({ variant = "horizontal", className = "" }) {
  const isDecorative = variant === "flower";

  return (
    <span
      className={`brand-mark brand-mark-${variant} ${className}`}
      aria-hidden={isDecorative ? "true" : undefined}
      aria-label={isDecorative ? undefined : "Flor de Postre"}
    >
      {variant !== "flower" && <BrandText />}
      <FlowerLine />
    </span>
  );
}

export default BrandMark;
