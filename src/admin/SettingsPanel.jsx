import { useMemo, useState } from "react";
import { Plus, Save } from "lucide-react";
import { moneyInputToCents } from "../../shared/catalog.js";
import { validateSettings, breakfastPriceOf } from "../../shared/settings.js";
import CampaignBanner from "../components/CampaignBanner.jsx";

const cakeGroups = [
  ["tortaCoberturas", "Coberturas", "precio"],
  ["tortaTamanos", "Tamaños", "precioBaseEstimado"],
  ["tortaRellenos", "Rellenos", "precioExtra"],
  ["tortaExtras", "Extras y decoración", "precioExtra"],
];
const money = (cents) => cents == null ? "" : String(cents / 100);
const newId = (prefix) => `${prefix}-${Date.now().toString(36)}`;
function makeCampaignDraft(item) {
  return {
    ...structuredClone(item),
    bannerText: item.bannerText ?? "", descripcion: item.descripcion ?? "", decoracion: item.decoracion ?? "", notas: item.notas ?? "",
    colors: { fondo: "#faeeee", texto: "#392a2f", acento: "#b76575", badge: "#fff6f3", ...item.colors },
    evento: item.evento ?? item.titulo ?? "", titulo: item.titulo ?? item.evento ?? "",
    active: Boolean(item.active ?? item.activa), fechaInicio: item.fechaInicio ?? null, fechaFin: item.fechaFin ?? null,
  };
}
function makeDraft(catalog) {
  return {
    sizes: catalog.sizes.map((item, order) => ({ ...structuredClone(item), order: item.order ?? order })),
    cake: Object.fromEntries(cakeGroups.map(([key]) => [key, catalog.cake.filter((item) => item.dataset === key).map((item) => ({ ...structuredClone(item.data), disponible: item.data.disponible !== false }))])),
    campaigns: catalog.campaigns.map(makeCampaignDraft),
    rules: { ...structuredClone(catalog.rules), breakfastPrice: breakfastPriceOf(catalog.rules) },
  };
}

function SettingField({ label, children }) {
  return <label className="a-setting-field"><span>{label}</span>{children}</label>;
}

function campaignStatus(campaign, hasChanges) {
  if (!campaign.active) return { label: "Desactivada", kind: "off" };
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  if (campaign.fechaInicio && campaign.fechaFin && campaign.fechaInicio > campaign.fechaFin) return { label: "Revisá las fechas", kind: "off" };
  if (campaign.fechaInicio && today < campaign.fechaInicio) return { label: "Programada", kind: "scheduled" };
  if (campaign.fechaFin && today > campaign.fechaFin) return { label: "Finalizada", kind: "off" };
  return { label: hasChanges ? "Se mostraría hoy" : "Visible hoy", kind: "live" };
}

export default function SettingsPanel({ catalog, service, onSaved, kind }) {
  const [draft, setDraft] = useState(() => makeDraft(catalog));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveFeedback, setSaveFeedback] = useState(null);
  const savedCampaigns = useMemo(() => new Map(catalog.campaigns.map((item) => { const campaign = makeCampaignDraft(item); return [campaign.id, campaign]; })), [catalog.campaigns]);
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
  const changeCampaign = (index, field, value) => {
    setSaveFeedback(null);
    setDraft((previous) => {
      const next = structuredClone(previous);
      if (field === "active" && value) next.campaigns.forEach((item) => { item.active = false; });
      const campaign = next.campaigns[index];
      if (field === "titulo" && !catalog.campaigns.some((item) => item.id === campaign.id) && (!campaign.evento || campaign.evento === campaign.titulo)) campaign.evento = value;
      next.campaigns[index][field] = value;
      if (field === "bannerText") next.campaigns[index].descripcion = value;
      return next;
    });
  };
  const changeCampaignColor = (index, color, value) => {
    setSaveFeedback(null);
    setDraft((previous) => { const next = structuredClone(previous); next.campaigns[index].colors[color] = value; return next; });
  };
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
  const save = async (campaignId = null) => {
    setError("");
    setSaveFeedback(null);
    setSaving(true);
    try {
      validateSettings(draft, catalog);
      const next = await service.saveSettings(draft, catalog.revision);
      onSaved(next);
      setDraft(makeDraft(next));
      if (campaignId) setSaveFeedback({ campaignId, kind: "success", message: "Cambios guardados. Revisá la barra en el inicio de la tienda." });
    } catch (e) {
      const message = e.errors ? Object.values(e.errors)[0] : e.message;
      setError(message);
      if (campaignId) setSaveFeedback({ campaignId, kind: "error", message });
    } finally { setSaving(false); }
  };
  return <div className="a-settings-panel">
    <div className="a-page-title"><div>
      <span className="a-eyebrow">CONFIGURACIÓN DEL CATÁLOGO</span>
      <h1>{kind === "cakes" ? "Tortas personalizadas" : kind === "sizes" ? "Tamaños de postres" : kind === "breakfast" ? "Desayunos a domicilio" : "Campañas y banners"}</h1>
      <p>{kind === "cakes" ? "Editá opciones, disponibilidad y precios del configurador." : kind === "sizes" ? "Estos tamaños se usan al configurar el precio de cada postre." : kind === "breakfast" ? "Actualizá el precio de la propuesta estándar que se muestra en la web." : "Editá la franja que aparece debajo del menú en la página de inicio."}</p>
    </div>{kind !== "campaigns" && <button className="a-btn" type="button" onClick={() => save()} disabled={saving || !service.writesEnabled}><Save size={16}/>{saving ? "Guardando…" : "Guardar cambios"}</button>}</div>
    {error && kind !== "campaigns" && <p className="a-notice a-error" role="alert">{error}</p>}
    {kind === "cakes" && <>
      <section className="a-card a-setting-section"><div className="a-section-head"><h2>Modelos y precios finales</h2><button className="a-btn a-secondary" type="button" onClick={() => setDraft((previous) => ({ ...previous, rules: { ...previous.rules, cakePriceOptions: [...previous.rules.cakePriceOptions, { id: newId("modelo"), coberturaId: previous.cake.tortaCoberturas[0]?.id || "", nombre: "", descripcion: "", fillings: 2, sizes: [] }] } }))}><Plus size={15}/> Agregar modelo</button></div><p>Estos son los importes que paga la clienta según cobertura, cantidad de rellenos y tamaño. Un tamaño sin precio no aparece en ese modelo.</p>
        {draft.rules.cakePriceOptions.map((option, index) => <article className="a-setting-item a-model-card" key={option.id}>
          <div className="a-model-heading">
            <span>Modelo {index + 1}</span>
            <h3>{option.nombre || "Modelo nuevo"} <small>· {option.fillings} rellenos</small></h3>
          </div>
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
        {draft.cake[group].map((item, index) => <article className={`a-setting-item ${group === "tortaRellenos" ? "a-option-card" : ""}`} key={item.id}><div className="a-setting-grid">
          <SettingField label="Nombre"><input value={item.nombre} onChange={(e) => changeCake(group, index, "nombre", e.target.value)}/></SettingField>
          {group === "tortaTamanos" && <SettingField label="Porciones"><input value={item.porciones ?? ""} onChange={(e) => changeCake(group, index, "porciones", e.target.value)}/></SettingField>}
          {group === "tortaExtras" && extraRule(item.id)?.type === "percent" ? <SettingField label="Porcentaje sobre la torta"><input type="number" min="0" max="100" step="0.01" value={(extraRule(item.id)?.percent ?? 0) * 100} onChange={(e) => changePercent(item.id, Number(e.target.value))}/></SettingField> : <SettingField label={group === "tortaTamanos" ? "Precio base estimado (ARS)" : "Precio extra (ARS)"}><input type="number" min="0" step="0.01" value={group === "tortaExtras" && extraRule(item.id)?.type === "fixed" ? extraRule(item.id).amount : item[priceField] ?? 0} onChange={(e) => changeCake(group, index, priceField, Number(e.target.value))}/></SettingField>}
          <label className="a-check"><input type="checkbox" checked={item.disponible} onChange={(e) => changeCake(group, index, "disponible", e.target.checked)}/> Disponible</label>
        </div><SettingField label="Descripción"><input value={item.descripcion ?? ""} onChange={(e) => changeCake(group, index, "descripcion", e.target.value)}/></SettingField><SettingField label="Notas internas"><input value={item.notas ?? ""} onChange={(e) => changeCake(group, index, "notas", e.target.value)}/></SettingField></article>)}
      </section>)}
    </>}
    {kind === "breakfast" && <section className="a-card a-setting-section"><div className="a-section-head"><div><h2>Propuesta estándar</h2><p>El detalle de lo que incluye se mantiene igual. El precio se muestra como “+ envío” y también se usa en el mensaje de WhatsApp.</p></div></div>
      <article className="a-setting-item"><div className="a-setting-grid"><SettingField label="Precio del desayuno (ARS)"><input type="number" min="1" step="1" inputMode="numeric" value={draft.rules.breakfastPrice ?? ""} onChange={(e) => setDraft((previous) => ({ ...previous, rules: { ...previous.rules, breakfastPrice: e.target.value === "" ? undefined : Number(e.target.value) } }))}/></SettingField></div></article>
    </section>}
    {kind === "sizes" && <section className="a-card a-setting-section"><div className="a-section-head"><div><h2>Tamaños disponibles</h2><p>Los precios de venta de cada postre se editan dentro del producto.</p></div><button className="a-btn a-secondary" type="button" onClick={() => set({ ...draft, sizes: [...draft.sizes, { id: newId("postre-size"), name: "", portions: "", active: false, estimatedPriceCents: null, notes: "", order: draft.sizes.length }] })}><Plus size={15}/> Agregar</button></div>
      {draft.sizes.map((size, index) => <article className="a-setting-item a-model-card" key={size.id}>
        <div className="a-model-heading">
          <span>Tamaño {index + 1}</span>
          <h3>{size.name || "Nuevo tamaño"}{size.portions && <small> · {size.portions}</small>}</h3>
        </div>
        <div className="a-setting-grid"><SettingField label="Tamaño"><input value={size.name} onChange={(e) => changeSize(index, "name", e.target.value)}/></SettingField><SettingField label="Porciones"><input value={size.portions} onChange={(e) => changeSize(index, "portions", e.target.value)}/></SettingField><SettingField label="Precio estimado (ARS)"><input type="number" min="0" step="0.01" value={money(size.estimatedPriceCents)} onChange={(e) => changeSize(index, "estimatedPriceCents", moneyInputToCents(e.target.value))}/></SettingField><label className="a-check"><input type="checkbox" checked={size.active} onChange={(e) => changeSize(index, "active", e.target.checked)}/> Disponible</label></div>
        <SettingField label="Notas"><input value={size.notes} onChange={(e) => changeSize(index, "notes", e.target.value)}/></SettingField>
      </article>)}
    </section>}
    {kind === "campaigns" && <section className="a-card a-setting-section a-campaign-section"><div className="a-section-head"><div><h2>Campañas</h2><p>La campaña activada aparece como una barra debajo del menú, solo en el inicio y durante las fechas indicadas. Los cambios se publican al guardar.</p></div><button className="a-btn a-secondary" type="button" onClick={() => set({ ...draft, campaigns: [...draft.campaigns, { id: newId("campana"), evento: "", titulo: "", bannerText: "", descripcion: "", decoracion: "", notas: "", active: false, activa: false, fechaInicio: null, fechaFin: null, colors: { fondo: "#faeeee", texto: "#392a2f", acento: "#b76575", badge: "#fff6f3" } }] })}><Plus size={15}/> Agregar campaña</button></div>
      {draft.campaigns.map((campaign, index) => {
        const savedCampaign = savedCampaigns.get(campaign.id);
        const hasChanges = !savedCampaign || JSON.stringify(campaign) !== JSON.stringify(savedCampaign);
        const status = campaignStatus(campaign, hasChanges);
        return <article className="a-campaign-card" key={campaign.id} aria-labelledby={`campaign-heading-${campaign.id}`}>
          <div className="a-campaign-heading">
            <div><span className="a-campaign-number">Campaña {index + 1}</span><h3 id={`campaign-heading-${campaign.id}`}>{campaign.titulo || "Campaña nueva"}</h3></div>
            <div className="a-campaign-badges"><span className={`a-campaign-status a-campaign-status-${status.kind}`}>{status.label}</span>{hasChanges && <span className="a-campaign-status a-campaign-status-unsaved">Sin guardar</span>}</div>
          </div>
          <div className="a-campaign-preview"><span className="a-campaign-preview-label">Así se vería la barra en la tienda</span><div inert><CampaignBanner campaign={{ ...campaign, titulo: campaign.titulo || "Título de la barra" }} /></div></div>
          <div className="a-campaign-fields"><h4>Lo que aparece en la barra</h4><p>Escribí el título y el mensaje. Vas a ver los cambios arriba antes de guardar.</p>
            <SettingField label="Título de la barra"><input value={campaign.titulo} onChange={(e) => changeCampaign(index, "titulo", e.target.value)}/></SettingField>
            <SettingField label="Mensaje de la barra (opcional)"><input value={campaign.bannerText || campaign.descripcion} onChange={(e) => changeCampaign(index, "bannerText", e.target.value)}/></SettingField>
            <SettingField label="Ícono de la barra (opcional)"><input value={campaign.decoracion} onChange={(e) => changeCampaign(index, "decoracion", e.target.value)}/></SettingField>
          </div>
          <div className="a-campaign-fields"><h4>Productos especiales</h4><p>Al crear la campaña, este nombre se completa con el título. Podés cambiarlo para vincular productos del mismo evento. No aparece en la barra.</p>
            <SettingField label="Nombre del evento"><input value={campaign.evento} onChange={(e) => changeCampaign(index, "evento", e.target.value)}/></SettingField>
          </div>
          <div className="a-campaign-fields"><h4>Publicación</h4><p>Solo una campaña puede estar activada a la vez. Si dejás las fechas vacías, se muestra mientras esté activada.</p>
            <div className="a-setting-grid"><SettingField label="Fecha inicio"><input type="date" value={campaign.fechaInicio ?? ""} onChange={(e) => changeCampaign(index, "fechaInicio", e.target.value || null)}/></SettingField><SettingField label="Fecha fin"><input type="date" value={campaign.fechaFin ?? ""} onChange={(e) => changeCampaign(index, "fechaFin", e.target.value || null)}/></SettingField><label className="a-check"><input type="checkbox" checked={campaign.active} onChange={(e) => changeCampaign(index, "active", e.target.checked)}/> Activar campaña</label></div>
          </div>
          <div className="a-campaign-fields"><h4>Colores de la barra</h4><div className="a-setting-grid">{[["fondo", "Fondo"], ["texto", "Texto"], ["acento", "Bordes"], ["badge", "Fondo del ícono"]].map(([color, label]) => <SettingField key={color} label={label}><input type="color" value={campaign.colors[color]} onChange={(e) => changeCampaignColor(index, color, e.target.value)}/></SettingField>)}</div></div>
          {(hasChanges || saveFeedback?.campaignId === campaign.id) && <div className="a-campaign-actions">
            {saveFeedback?.campaignId === campaign.id ? <span className={saveFeedback.kind === "error" ? "a-error" : "a-campaign-saved"} role={saveFeedback.kind === "error" ? "alert" : undefined}>{saveFeedback.message}</span> : <span>Estos cambios todavía no aparecen en la tienda.</span>}
            {hasChanges && <button className="a-btn" type="button" onClick={() => save(campaign.id)} disabled={saving || !service.writesEnabled}><Save size={16}/>{saving ? "Guardando…" : "Guardar cambios"}</button>}
          </div>}
        </article>;
      })}
    </section>}
    {kind !== "campaigns" && <div className="a-setting-actions"><button className="a-btn" type="button" onClick={() => save()} disabled={saving || !service.writesEnabled}><Save size={16}/>{saving ? "Guardando…" : "Guardar cambios"}</button></div>}
  </div>;
}
