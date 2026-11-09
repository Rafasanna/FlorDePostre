import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { moneyInputToCents } from "../../shared/catalog.js";
import { validateSettings } from "../../shared/settings.js";

const cakeGroups = [
  ["tortaCoberturas", "Coberturas", "precio"],
  ["tortaTamanos", "Tamaños", "precioBaseEstimado"],
  ["tortaRellenos", "Rellenos", "precioExtra"],
  ["tortaExtras", "Extras y decoración", "precioExtra"],
];
const money = (cents) => cents == null ? "" : String(cents / 100);
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}`;
function makeDraft(catalog) {
  return {
    sizes: catalog.sizes.map((item, order) => ({ ...structuredClone(item), order: item.order ?? order })),
    cake: Object.fromEntries(cakeGroups.map(([key]) => [key, catalog.cake.filter((item) => item.dataset === key).map((item) => ({ ...structuredClone(item.data), disponible: item.data.disponible !== false }))])),
    campaigns: catalog.campaigns.map((item) => ({
      ...structuredClone(item),
      bannerText: item.bannerText ?? "", descripcion: item.descripcion ?? "", decoracion: item.decoracion ?? "", notas: item.notas ?? "",
      colors: { fondo: "#faeeee", texto: "#392a2f", acento: "#b76575", badge: "#fff6f3", ...item.colors },
      evento: item.evento ?? item.titulo ?? "", titulo: item.titulo ?? item.evento ?? "",
      active: Boolean(item.active ?? item.activa), fechaInicio: item.fechaInicio ?? null, fechaFin: item.fechaFin ?? null,
    })),
    rules: structuredClone(catalog.rules),
  };
}

function SettingField({ label, children }) {
  return <label className="a-setting-field"><span>{label}</span>{children}</label>;
}

export default function SettingsPanel({ catalog, service, onSaved, kind }) {
  const [draft, setDraft] = useState(() => makeDraft(catalog));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (next) => setDraft(next);
  const changeCake = (group, index, field, value) => {
    setDraft((previous) => {
      const next = structuredClone(previous);
      const item = next.cake[group][index];
      const oldName = item.nombre;
      item[field] = value;
      if (group === "tortaTamanos" && field === "nombre") {
        next.rules.cakePriceOptions.forEach((option) => option.sizes.forEach((size) => { if (size.nombre === oldName) size.nombre = value; }));
      }
      if (group === "tortaExtras" && field === "precioExtra") {
        const entry = next.rules.extraRules.find((candidate) => candidate.id === item.id);
        const rule = entry?.rule || entry;
        if (rule?.type === "fixed") rule.amount = value;
      }
      return next;
    });
  };
  const extraRule = (id) => {
    const entry = draft.rules.extraRules.find((item) => item.id === id);
    return entry?.rule || entry;
  };
  const addCake = (group) => {
    const id = newId(group.replace("torta", "").toLowerCase());
    setDraft((previous) => ({ ...previous, cake: { ...previous.cake, [group]: [...previous.cake[group], {
      id, nombre: "", descripcion: "", etiqueta: "", notas: "", disponible: false,
      ...(group === "tortaTamanos" ? { porciones: "", precioBaseEstimado: 0 } : group === "tortaCoberturas" ? { precio: 0 } : { precioExtra: 0 }),
    }] } }));
  };
  const changeSize = (index, field, value) => setDraft((previous) => {
    const next = structuredClone(previous); next.sizes[index][field] = value; return next;
  });
  const changeCampaign = (index, field, value) => setDraft((previous) => {
    const next = structuredClone(previous);
    if (field === "active" && value) next.campaigns.forEach((item) => { item.active = false; });
    next.campaigns[index][field] = value;
    return next;
  });
  const changeOption = (index, field, value) => setDraft((previous) => {
    const next = structuredClone(previous); next.rules.cakePriceOptions[index][field] = value; return next;
  });
  const changePercent = (id, value) => setDraft((previous) => {
    const next = structuredClone(previous);
    const entry = next.rules.extraRules.find((item) => item.id === id);
    if (entry) (entry.rule || entry).percent = value / 100;
    return next;
  });
  const changeMatrix = (optionIndex, sizeName, field, value) => setDraft((previous) => {
    const next = structuredClone(previous);
    const option = next.rules.cakePriceOptions[optionIndex];
    const index = option.sizes.findIndex((size) => size.nombre === sizeName);
    if (field === "price" && value === "") {
      if (index >= 0) option.sizes.splice(index, 1);
    } else if (index >= 0) option.sizes[index][field] = field === "price" ? Number(value) : value;
    else option.sizes.push({ nombre: sizeName, price: Number(value), porciones: draft.cake.tortaTamanos.find((size) => size.nombre === sizeName)?.porciones || "Porciones a confirmar" });
    return next;
  });
  const save = async () => {
    setError("");
    setSaving(true);
    try {
      validateSettings(draft, catalog);
      const next = await service.saveSettings(draft, catalog.revision);
      onSaved(next);
      setDraft(makeDraft(next));
    } catch (e) {
      setError(e.errors ? Object.values(e.errors)[0] : e.message);
    } finally { setSaving(false); }
  };
  return <div className="a-settings-panel">
    <div className="a-page-title"><div>
      <span className="a-eyebrow">CONFIGURACIÓN DEL CATÁLOGO</span>
      <h1>{kind === "cakes" ? "Tortas personalizadas" : kind === "sizes" ? "Tamaños de postres" : "Campañas y banners"}</h1>
      <p>{kind === "cakes" ? "Editá opciones, disponibilidad y precios del configurador." : kind === "sizes" ? "Estos tamaños se usan al configurar el precio de cada postre." : "Definí el contenido y las fechas del banner de la tienda."}</p>
    </div><button className="a-btn" type="button" onClick={save} disabled={saving || !service.writesEnabled}><Save size={16}/>{saving ? "Guardando…" : "Guardar cambios"}</button></div>
    {error && <p className="a-notice a-error" role="alert">{error}</p>}
    {kind === "cakes" && <>
      <section className="a-card a-setting-section"><div className="a-section-head"><h2>Modelos y precios finales</h2><button className="a-btn a-secondary" type="button" onClick={() => setDraft((previous) => ({ ...previous, rules: { ...previous.rules, cakePriceOptions: [...previous.rules.cakePriceOptions, { id: newId("modelo"), coberturaId: previous.cake.tortaCoberturas[0]?.id || "", nombre: "", descripcion: "", fillings: 2, sizes: [] }] } }))}><Plus size={15}/> Agregar modelo</button></div><p>Estos son los importes que paga la clienta según cobertura, cantidad de rellenos y tamaño. Un tamaño sin precio no aparece en ese modelo.</p>
        {draft.rules.cakePriceOptions.map((option, index) => <article className="a-setting-item" key={option.id}>
          <div className="a-setting-grid">
            <SettingField label="Nombre"><input value={option.nombre} onChange={(e) => changeOption(index, "nombre", e.target.value)}/></SettingField>
            <SettingField label="Cobertura"><select value={option.coberturaId} onChange={(e) => changeOption(index, "coberturaId", e.target.value)}>{draft.cake.tortaCoberturas.map((cover) => <option key={cover.id} value={cover.id}>{cover.nombre || cover.id}</option>)}</select></SettingField>
            <SettingField label="Rellenos incluidos"><input type="number" min="1" max="5" value={option.fillings} onChange={(e) => changeOption(index, "fillings", Number(e.target.value))}/></SettingField>
          </div>
          <SettingField label="Descripción"><input value={option.descripcion ?? ""} onChange={(e) => changeOption(index, "descripcion", e.target.value)}/></SettingField>
          <div className="a-matrix-grid">{draft.cake.tortaTamanos.map((size) => {
            const price = option.sizes.find((row) => row.nombre === size.nombre);
            return <div key={size.id}>
              <SettingField label={`${size.nombre || "Nuevo tamaño"} · precio final (ARS)`}><input type="number" min="0" step="0.01" value={price?.price ?? ""} onChange={(e) => changeMatrix(index, size.nombre, "price", e.target.value)}/></SettingField>
              {price && <SettingField label="Porciones en este modelo"><input value={price.porciones} onChange={(e) => changeMatrix(index, size.nombre, "porciones", e.target.value)}/></SettingField>}
            </div>;
          })}</div>
        </article>)}
      </section>
      {cakeGroups.map(([group, title, priceField]) => <section className="a-card a-setting-section" key={group}><div className="a-section-head"><div><h2>{title}</h2><p>{group === "tortaTamanos" ? "El precio base estimado es informativo; los importes finales están arriba." : group === "tortaExtras" ? "Se muestra el precio que cobra el configurador. Pisos falsos se cobra como porcentaje del precio base." : ""}</p></div><button className="a-btn a-secondary" type="button" onClick={() => addCake(group)}><Plus size={15}/> Agregar</button></div>
        {draft.cake[group].map((item, index) => <article className="a-setting-item" key={item.id}><div className="a-setting-grid">
          <SettingField label="Nombre"><input value={item.nombre} onChange={(e) => changeCake(group, index, "nombre", e.target.value)}/></SettingField>
          {group === "tortaTamanos" && <SettingField label="Porciones"><input value={item.porciones ?? ""} onChange={(e) => changeCake(group, index, "porciones", e.target.value)}/></SettingField>}
          {group === "tortaExtras" && extraRule(item.id)?.type === "percent" ? <SettingField label="Porcentaje sobre la torta"><input type="number" min="0" max="100" step="0.01" value={(extraRule(item.id)?.percent ?? 0) * 100} onChange={(e) => changePercent(item.id, Number(e.target.value))}/></SettingField> : <SettingField label={group === "tortaTamanos" ? "Precio base estimado (ARS)" : "Precio extra (ARS)"}><input type="number" min="0" step="0.01" value={group === "tortaExtras" && extraRule(item.id)?.type === "fixed" ? extraRule(item.id).amount : item[priceField] ?? 0} onChange={(e) => changeCake(group, index, priceField, Number(e.target.value))}/></SettingField>}
          <label className="a-check"><input type="checkbox" checked={item.disponible} onChange={(e) => changeCake(group, index, "disponible", e.target.checked)}/> Disponible</label>
        </div><SettingField label="Descripción"><input value={item.descripcion ?? ""} onChange={(e) => changeCake(group, index, "descripcion", e.target.value)}/></SettingField><SettingField label="Notas internas"><input value={item.notas ?? ""} onChange={(e) => changeCake(group, index, "notas", e.target.value)}/></SettingField></article>)}
      </section>)}
    </>}
    {kind === "sizes" && <section className="a-card a-setting-section"><div className="a-section-head"><div><h2>Tamaños disponibles</h2><p>Los precios de venta de cada postre se editan dentro del producto.</p></div><button className="a-btn a-secondary" type="button" onClick={() => set({ ...draft, sizes: [...draft.sizes, { id: newId("postre-size"), name: "", portions: "", active: false, estimatedPriceCents: null, notes: "", order: draft.sizes.length }] })}><Plus size={15}/> Agregar</button></div>
      {draft.sizes.map((size, index) => <article className="a-setting-item" key={size.id}><div className="a-setting-grid"><SettingField label="Tamaño"><input value={size.name} onChange={(e) => changeSize(index, "name", e.target.value)}/></SettingField><SettingField label="Porciones"><input value={size.portions} onChange={(e) => changeSize(index, "portions", e.target.value)}/></SettingField><SettingField label="Precio estimado (ARS)"><input type="number" min="0" step="0.01" value={money(size.estimatedPriceCents)} onChange={(e) => changeSize(index, "estimatedPriceCents", moneyInputToCents(e.target.value))}/></SettingField><label className="a-check"><input type="checkbox" checked={size.active} onChange={(e) => changeSize(index, "active", e.target.checked)}/> Disponible</label></div><SettingField label="Notas"><input value={size.notes} onChange={(e) => changeSize(index, "notes", e.target.value)}/></SettingField></article>)}
    </section>}
    {kind === "campaigns" && <section className="a-card a-setting-section"><div className="a-section-head"><div><h2>Campañas</h2><p>Solo una campaña puede estar activa. Las fechas también controlan cuándo se muestra.</p></div><button className="a-btn a-secondary" type="button" onClick={() => set({ ...draft, campaigns: [...draft.campaigns, { id: newId("campana"), evento: "", titulo: "", bannerText: "", descripcion: "", decoracion: "", notas: "", active: false, activa: false, fechaInicio: null, fechaFin: null, colors: { fondo: "#faeeee", texto: "#392a2f", acento: "#b76575", badge: "#fff6f3" } }] })}><Plus size={15}/> Agregar</button></div>
      {draft.campaigns.map((campaign, index) => <article className="a-setting-item" key={campaign.id}><div className="a-setting-grid"><SettingField label="Evento"><input value={campaign.evento} onChange={(e) => changeCampaign(index, "evento", e.target.value)}/></SettingField><SettingField label="Título visible"><input value={campaign.titulo} onChange={(e) => changeCampaign(index, "titulo", e.target.value)}/></SettingField><label className="a-check"><input type="checkbox" checked={campaign.active} onChange={(e) => changeCampaign(index, "active", e.target.checked)}/> Activa</label></div>
        <div className="a-setting-grid"><SettingField label="Fecha inicio"><input type="date" value={campaign.fechaInicio ?? ""} onChange={(e) => changeCampaign(index, "fechaInicio", e.target.value || null)}/></SettingField><SettingField label="Fecha fin"><input type="date" value={campaign.fechaFin ?? ""} onChange={(e) => changeCampaign(index, "fechaFin", e.target.value || null)}/></SettingField><SettingField label="Decoración"><input value={campaign.decoracion} onChange={(e) => changeCampaign(index, "decoracion", e.target.value)}/></SettingField></div>
        <SettingField label="Texto corto del banner"><input value={campaign.bannerText} onChange={(e) => changeCampaign(index, "bannerText", e.target.value)}/></SettingField><SettingField label="Descripción"><textarea value={campaign.descripcion} onChange={(e) => changeCampaign(index, "descripcion", e.target.value)}/></SettingField><SettingField label="Notas internas"><input value={campaign.notas} onChange={(e) => changeCampaign(index, "notas", e.target.value)}/></SettingField>
        <div className="a-setting-grid">{["fondo", "texto", "acento", "badge"].map((color) => <SettingField key={color} label={`Color ${color}`}><input type="color" value={campaign.colors[color]} onChange={(e) => setDraft((previous) => { const next = structuredClone(previous); next.campaigns[index].colors[color] = e.target.value; return next; })}/></SettingField>)}</div>
      </article>)}
    </section>}
    <div className="a-setting-actions"><button className="a-btn" type="button" onClick={save} disabled={saving || !service.writesEnabled}><Save size={16}/>{saving ? "Guardando…" : "Guardar cambios"}</button></div>
  </div>;
}
