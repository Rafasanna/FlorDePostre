// Shared palette for JavaScript values that must be concrete colors (for example, Sheets fallbacks).
export const BRAND_COLORS = Object.freeze({
  roseOld: "#F0BBDC",
  roseLight: "#FFE5EE",
  rose: "#FFCFED",
  sage: "#B1BA95",
  text: "#4A3530",
  textMuted: "#6B5550",
  white: "#FFFFFF",
  whiteWarm: "#FFFCFB"
});

export const CAMPAIGN_COLOR_FALLBACKS = Object.freeze({
  fondo: BRAND_COLORS.roseLight,
  texto: BRAND_COLORS.text,
  acento: BRAND_COLORS.roseOld,
  badge: BRAND_COLORS.rose
});
