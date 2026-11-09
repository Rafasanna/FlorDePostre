import { ValidationError, moneyOK } from "./catalog.js";

const idOK = (value) => typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(value);
const text = (value, max = 500) => typeof value === "string" && value.trim().length > 0 && value.length <= max;
const optionalText = (value, max = 500) => typeof value === "string" && value.length <= max;
const pesos = (value, allowZero = true) => Number.isFinite(value) && value >= (allowZero ? 0 : 0.01) && moneyOK(Math.round(value * 100), allowZero) && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001;
const date = (value) => value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value);
const fields = ["tortaTamanos", "tortaCoberturas", "tortaRellenos", "tortaExtras"];

export function validateSettings(input, catalog) {
  const errors = {};
  if (!input || typeof input !== "object") throw new ValidationError({ settings: "Configuración inválida." });
  const checkList = (list, name, original, validate) => {
    if (!Array.isArray(list) || list.length > 100 || new Set(list.map((x) => x?.id)).size !== list.length || original.some((x) => !list.some((y) => y.id === x.id))) {
      errors[name] = "Conservá los registros existentes; desactivá los que no quieras mostrar.";
      return;
    }
    list.forEach((item, index) => {
      if (!item || !idOK(item.id) || !validate(item)) errors[`${name}.${index}`] = "Revisá este registro.";
    });
  };
  checkList(input.sizes, "sizes", catalog.sizes, (s) => text(s.name, 120) && optionalText(s.portions, 160) && optionalText(s.notes, 500) && typeof s.active === "boolean" && (s.estimatedPriceCents === null || moneyOK(s.estimatedPriceCents)) && Number.isSafeInteger(s.order) && s.order >= 0);
  if (catalog.products.some((p) => p.kind === "postre" && p.active && !p.archived && !p.variants.some((variant) => variant.active && input.sizes?.some((size) => size.id === variant.sizeId && size.active))))
    errors.sizes = "Un postre activo quedaría sin tamaños disponibles.";
  for (const dataset of fields) {
    const original = catalog.cake.filter((x) => x.dataset === dataset);
    checkList(input.cake?.[dataset], dataset, original, (item) => {
      if (!text(item.nombre, 160) || typeof item.disponible !== "boolean" || !optionalText(item.descripcion ?? "", 500) || !optionalText(item.etiqueta ?? "", 160) || !optionalText(item.notas ?? "", 500)) return false;
      if (dataset === "tortaTamanos") return optionalText(item.porciones ?? "", 160) && pesos(item.precioBaseEstimado ?? 0);
      if (dataset === "tortaCoberturas") return pesos(item.precio ?? 0);
      return pesos(item.precioExtra ?? 0);
    });
  }
  checkList(input.campaigns, "campaigns", catalog.campaigns, (c) => {
    if (!text(c.evento, 160) || !text(c.titulo, 160) || !optionalText(c.bannerText, 500) || !optionalText(c.descripcion, 1000) || !optionalText(c.decoracion, 40) || !optionalText(c.notas, 500) || typeof c.active !== "boolean" || !date(c.fechaInicio) || !date(c.fechaFin) || (c.fechaInicio && c.fechaFin && c.fechaInicio > c.fechaFin)) return false;
    if (!c.colors || !["fondo", "texto", "acento", "badge"].every((key) => /^#[0-9a-fA-F]{6}$/.test(c.colors[key]))) return false;
    const existing = catalog.campaigns.find((x) => x.id === c.id);
    if (existing && existing.evento !== c.evento && catalog.products.some((p) => p.campaignId === c.id)) return false;
    return true;
  });
  if (Array.isArray(input.campaigns) && input.campaigns.filter((c) => c.active).length > 1) errors.campaigns = "Activá una sola campaña a la vez.";
  const rules = input.rules;
  if (!rules || !Array.isArray(rules.cakePriceOptions) || !Array.isArray(rules.extraRules) || rules.cakePriceOptions.length > 30 || new Set(rules.cakePriceOptions.map((x) => x.id)).size !== rules.cakePriceOptions.length || catalog.rules.cakePriceOptions?.some((x) => !rules.cakePriceOptions.some((y) => y.id === x.id))) errors.rules = "Matriz de tortas inválida.";
  else for (const option of rules.cakePriceOptions) {
    if (!idOK(option.id) || !text(option.nombre, 160) || !optionalText(option.descripcion ?? "", 500) || !idOK(option.coberturaId) || !input.cake?.tortaCoberturas?.some((c) => c.id === option.coberturaId) || !Number.isSafeInteger(option.fillings) || option.fillings < 1 || option.fillings > 5 || !Array.isArray(option.sizes) || option.sizes.length === 0 || option.sizes.length > 30 || new Set(option.sizes.map((s) => s.nombre)).size !== option.sizes.length || option.sizes.some((s) => !text(s.nombre, 120) || !input.cake?.tortaTamanos?.some((size) => size.nombre === s.nombre) || !text(s.porciones, 160) || !pesos(s.price, false))) errors.rules = "Revisá los precios, tamaños y rellenos de la matriz.";
  }
  if (!Array.isArray(rules?.extraRules) || rules.extraRules.length > 100 || new Set(rules.extraRules.map((entry) => entry?.id)).size !== rules.extraRules.length || catalog.rules.extraRules?.some((entry) => !rules.extraRules.some((candidate) => candidate.id === entry.id)) || rules.extraRules.some((entry) => {
    const rule = entry?.rule || entry;
    return !idOK(entry?.id) || !input.cake?.tortaExtras?.some((extra) => extra.id === entry.id) || !Array.isArray(rule?.match) || !["fixed", "percent", "from"].includes(rule?.type) || (rule.type === "percent" ? !Number.isFinite(rule.percent) || rule.percent < 0 || rule.percent > 1 : !pesos(rule.amount ?? 0));
  })) errors.extraRules = "Reglas de adicionales inválidas.";
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return {
    sizes: input.sizes.map((s) => ({ id: s.id, name: s.name.trim(), portions: s.portions, notes: s.notes, active: s.active, estimatedPriceCents: s.estimatedPriceCents, order: s.order })),
    cake: Object.fromEntries(fields.map((key) => [key, input.cake[key].map((item) => ({ ...item, nombre: item.nombre.trim() }))])),
    campaigns: input.campaigns.map((c) => ({ id: c.id, evento: c.evento.trim(), titulo: c.titulo.trim(), bannerText: c.bannerText, descripcion: c.descripcion, decoracion: c.decoracion, notas: c.notas, colors: c.colors, active: c.active, activa: c.active, fechaInicio: c.fechaInicio, fechaFin: c.fechaFin, color: c.color ?? "", temaVisual: c.temaVisual ?? "rose", textoBoton: c.textoBoton ?? "", linkBoton: c.linkBoton ?? "", productosEspeciales: [] })),
    rules: { version: 2, cakePriceOptions: rules.cakePriceOptions, extraRules: rules.extraRules },
  };
}
