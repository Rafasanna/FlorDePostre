import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useId,
  cloneElement,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  Flower2,
  Home,
  ImagePlus,
  LayoutGrid,
  LogOut,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  X,
  Archive,
  RotateCcw,
  Eye,
  EyeOff,
  Save,
  LoaderCircle,
} from "lucide-react";
import { demoAllowed, createDemoService } from "./demo.js";
import { adminRequest, createRealService } from "./client.js";
import {
  filterProducts,
  formatMoney,
  moneyInputToCents,
  validateProduct,
  validateCategory,
} from "../../shared/catalog.js";
import {
  cakePriceOptions,
  tortaExtras,
  getCakeExtraDisplay,
} from "../data/tortasData.js";
import { getEffectivePrice } from "../utils/seasonal.js";
import {
  getDisplayImageUrl,
  getResponsiveImageSrcSet,
} from "../utils/productImages.js";
import "./admin.css";
const labels = {
  daily: "Menú diario",
  sin_tacc: "Sin TACC",
  postre: "Postre por encargo",
  special: "Especial de campaña",
};
const nav = [
  ["home", "Inicio", Home],
  ["products", "Productos", Package],
  ["categories", "Categorías", LayoutGrid],
  ["settings", "Configuración", Settings],
];
const isDemo =
  import.meta.env.DEV &&
  __ADMIN_DEMO_ENABLED__ &&
  demoAllowed({
    enabled: __ADMIN_DEMO_ENABLED__,
    dev: import.meta.env.DEV,
    host: window.location.hostname,
  });
function Logo() {
  return (
    <img
      className="admin-logo"
      src="/images/flor-de-postre-logo-pink.png"
      alt="Flor de Postre"
    />
  );
}
function Button({ children, secondary = false, className = "", ...props }) {
  return (
    <button
      className={`a-btn ${secondary ? "a-secondary" : ""} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => {
      d.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`a-modal ${wide ? "a-modal-wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={title}
    >
      <div className="a-modal-head">
        <h2>{title}</h2>
        <Button secondary onClick={onClose} aria-label="Cerrar ventana">
          <X size={19} />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
function Field({ label, error, children, hint }) {
  const id = useId();
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="a-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": Boolean(error),
      })}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small id={`${id}-error`} className="a-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}

function MoneyInput({ value, onChange, ...props }) {
  const [raw, setRaw] = useState(value === null ? "" : String(value / 100));
  const last = useRef(value);
  useEffect(() => {
    if (!Object.is(last.current, value)) {
      setRaw(value === null ? "" : String(value / 100));
      last.current = value;
    }
  }, [value]);
  return (
    <input
      {...props}
      type="number"
      min="0.01"
      step="0.01"
      value={raw}
      onChange={(e) => {
        const next = moneyInputToCents(e.target.value);
        setRaw(e.target.value);
        last.current = next;
        onChange(next);
      }}
    />
  );
}
function Status({ product: p }) {
  return (
    <span
      className={`a-status ${p.archived ? "archived" : p.active ? "active" : "inactive"}`}
    >
      {p.archived
        ? "Archivado"
        : !p.active
          ? "Inactivo"
          : p.reserved
            ? "Reservado"
            : "Activo"}
    </span>
  );
}
function Photo({ image, name }) {
  if (image) {
    const src = getDisplayImageUrl(image, { width: 720, quality: "good" });
    const srcSet = getResponsiveImageSrcSet(image, [320, 480, 720, 960], {
      quality: "good",
    });
    return (
      <img
        className="a-photo"
        src={src}
        srcSet={srcSet || undefined}
        sizes="(max-width: 760px) calc(100vw - 72px), 360px"
        alt={name || ""}
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span className="a-photo a-placeholder">
      <Flower2 size={25} />
    </span>
  );
}
function ProductPreview({ p, catalog }) {
  const price = getEffectivePrice({
    precio: p.priceCents,
    precioOferta: p.offerPriceCents,
    disponible: p.active,
    fechaInicio: p.startDate,
    fechaFin: p.endDate,
  });
  return (
    <article className="a-preview">
      <div className="a-preview-image">
        <Photo image={p.images[0]?.url} name={p.name} />
        {p.featured && (
          <span className="a-tag">
            <Star size={13} /> Destacado
          </span>
        )}
      </div>
      <div className="a-preview-copy">
        <span className="a-eyebrow">
          {catalog.categories.find((c) => c.id === p.categoryId)?.name}
        </span>
        <h3>{p.name || "Nombre del producto"}</h3>
        <p>{p.description || "Descripción del producto"}</p>
        <Status product={p} />
        <strong>{formatMoney(price)}</strong>
        {p.kind === "postre" &&
          p.variants.map((v) => (
            <div className="a-preview-variant" key={v.sizeId}>
              <span>
                {catalog.sizes.find((s) => s.id === v.sizeId)?.name}
                {!v.active ? " · Inactivo" : ""}
              </span>
              <b>{formatMoney(v.priceCents)}</b>
            </div>
          ))}
        {p.startDate && (
          <small>
            Desde {p.startDate}
            {p.endDate ? ` hasta ${p.endDate}` : ""}
          </small>
        )}
      </div>
    </article>
  );
}
function ProductEditor({ product, catalog, service, onSaved, onClose }) {
  const creating = !product;
  const [p, setP] = useState(() =>
    product
      ? structuredClone(product)
      : {
          id: `producto-${crypto.randomUUID().slice(0, 8)}`,
          kind: "daily",
          name: "",
          description: "",
          categoryId:
            catalog.categories.find((c) => c.active && !c.parentId)?.id || "",
          priceCents: null,
          order: catalog.products.length,
          active: false,
          featured: false,
          reserved: false,
          campaignActive: true,
          archived: false,
          sinTacc: false,
          limited: false,
          stock: null,
          offerPriceCents: null,
          previousPriceCents: null,
          startDate: null,
          endDate: null,
          label: "",
          offerLabel: "",
          campaignId: null,
          variants: [],
          images: [],
        },
  );
  const [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [dirty, setDirty] = useState(false),
    [confirmArchive, setConfirmArchive] = useState(false);
  const set = (field, value) => {
    setDirty(true);
    setP((p) => ({ ...p, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };
  const close = () => {
    if (
      !dirty ||
      window.confirm("Tenés cambios sin guardar. ¿Querés descartarlos?")
    )
      onClose();
  };
  const save = async () => {
    setError("");
    setErrors({});
    try {
      const clean = validateProduct(p, catalog, {
        existing: product,
        demo: service.mode === "demo",
      });
      setBusy(true);
      const next = await service.saveProduct(clean, catalog.revision, creating);
      onSaved(next);
      onClose();
    } catch (e) {
      setErrors(e.errors || {});
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const upload = async (files) => {
    setError("");
    if (p.images.length + files.length > 12) {
      setError("Podés agregar hasta 12 fotos.");
      return;
    }
    setUploading(true);
    try {
      const added = [];
      for (const file of files) added.push(await service.upload(file));
      set("images", [...p.images, ...added]);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };
  const moveImage = (i, d) => {
    const next = [...p.images];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set("images", next);
  };
  const moneyField = (field, label, hint) => (
    <Field label={label} error={errors[field]} hint={hint}>
      <MoneyInput
        key={`${p.kind}-${field}`}
        value={p[field]}
        onChange={(value) => set(field, value)}
      />
    </Field>
  );
  const library = [
    ...new Map(
      [
        ...(catalog.assets || []),
        ...catalog.products.flatMap((x) => x.images),
      ].map((i) => [i.id, i]),
    ).values(),
  ].filter((i) => !p.images.some((img) => img.url === i.url));
  return (
    <section
      className="a-product-editor-page"
      aria-label={creating ? "Un nuevo producto" : "Editar producto"}
    >
      <div className="a-editor-page-head">
        <button className="a-editor-back" type="button" onClick={close}>
          <ArrowLeft size={17} /> Volver a productos
        </button>
        <span className="a-eyebrow">
          {creating ? "SUMÁ ALGO RICO" : "CUIDÁ CADA DETALLE"}
        </span>
        <h1>{creating ? "Nuevo producto" : p.name}</h1>
        <p>
          {creating
            ? "Completá la información y revisá cómo se verá antes de guardar."
            : "Editá la información y las fotos recorriendo esta página."}
        </p>
      </div>
      {error && (
        <div className="a-notice a-error" role="alert">
          {error}
        </div>
      )}
      <div className="a-editor-layout">
        <div className="a-editor-main">
          <fieldset
            disabled={busy || uploading || !service.writesEnabled}
            className="a-editor-body"
          >
            <section className="a-editor-section">
              <div className="a-editor-section-head">
                <span>01</span>
                <div>
                  <h2>Información del producto</h2>
                  <p>Nombre, descripción, precio y disponibilidad.</p>
                </div>
              </div>
              <div className="a-form-grid">
                <Field label="Nombre del producto" error={errors.name}>
                  <input
                    autoFocus
                    value={p.name}
                    maxLength={160}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Por ejemplo, Alfajor de pistacho"
                  />
                </Field>
                <Field
                  label="Tipo de producto"
                  error={errors.kind}
                  hint={
                    creating
                      ? "Elegí cómo se vende este producto."
                      : "No se puede cambiar después de crear el producto."
                  }
                >
                  <select
                    value={p.kind}
                    disabled={!creating}
                    onChange={(e) => {
                      set("kind", e.target.value);
                      set("priceCents", null);
                      set("variants", []);
                      set("offerPriceCents", null);
                      set("previousPriceCents", null);
                      set("campaignId", null);
                      set("sinTacc", e.target.value === "sin_tacc");
                    }}
                  >
                    {Object.entries(labels).map(([id, label]) => (
                      <option value={id} key={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="a-span">
                  <Field label="Descripción" error={errors.description}>
                    <textarea
                      rows={3}
                      maxLength={5000}
                      value={p.description}
                      onChange={(e) => set("description", e.target.value)}
                      placeholder="Contá qué lo hace especial…"
                    />
                  </Field>
                </div>
                <Field
                  label="Categoría o subcategoría"
                  error={errors.categoryId}
                >
                  <select
                    value={p.categoryId}
                    onChange={(e) => set("categoryId", e.target.value)}
                  >
                    <option value="">Elegí una categoría</option>
                    {catalog.categories
                      .filter((c) => c.active || c.id === p.categoryId)
                      .map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.parentId
                            ? `${catalog.categories.find((x) => x.id === c.parentId)?.name} / `
                            : ""}
                          {c.name}
                          {!c.active ? " (inactiva)" : ""}
                        </option>
                      ))}
                  </select>
                </Field>
                {p.kind !== "postre" ? (
                  moneyField(
                    "priceCents",
                    "Precio en pesos (ARS)",
                    "Precio por unidad. No se usa para las tortas personalizadas.",
                  )
                ) : (
                  <div className="a-notice">
                    El precio de este postre se define por tamaño, sin un precio
                    único.
                  </div>
                )}
                {p.kind === "special" && (
                  <div className="a-span">
                    <Field label="Campaña" error={errors.campaignId}>
                      <select
                        value={p.campaignId || ""}
                        onChange={(e) =>
                          set("campaignId", e.target.value || null)
                        }
                      >
                        <option value="">Elegí una campaña</option>
                        {catalog.campaigns.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.titulo || c.evento}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}
                {p.kind === "postre" && (
                  <section className="a-span a-variants">
                    <h3>Tamaños y precios</h3>
                    <p>
                      Usá los tamaños del catálogo y activá solamente los que
                      estén disponibles.
                    </p>
                    {errors.variants && (
                      <p className="a-error" role="alert">
                        {errors.variants}
                      </p>
                    )}
                    {p.variants.map((v, i) => (
                      <div className="a-variant" key={i}>
                        <Field label={`Tamaño ${i + 1}`}>
                          <select
                            value={v.sizeId}
                            onChange={(e) =>
                              set(
                                "variants",
                                p.variants.map((x, j) =>
                                  j === i
                                    ? { ...x, sizeId: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          >
                            <option value="">Elegí un tamaño</option>
                            {catalog.sizes.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                                {!s.active ? " · Inactivo" : ""}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label={`Precio del tamaño ${i + 1} (ARS)`}>
                          <MoneyInput
                            value={v.priceCents}
                            onChange={(value) =>
                              set(
                                "variants",
                                p.variants.map((x, j) =>
                                  j === i ? { ...x, priceCents: value } : x,
                                ),
                              )
                            }
                          />
                        </Field>
                        <label className="a-check">
                          <input
                            type="checkbox"
                            checked={v.active}
                            onChange={(e) =>
                              set(
                                "variants",
                                p.variants.map((x, j) =>
                                  j === i
                                    ? { ...x, active: e.target.checked }
                                    : x,
                                ),
                              )
                            }
                          />{" "}
                          Disponible
                        </label>
                        <Button
                          secondary
                          aria-label={`Quitar tamaño ${i + 1}`}
                          onClick={() =>
                            set(
                              "variants",
                              p.variants.filter((_, j) => i !== j),
                            )
                          }
                        >
                          <X size={17} />
                        </Button>
                      </div>
                    ))}
                    <Button
                      secondary
                      onClick={() =>
                        set("variants", [
                          ...p.variants,
                          { sizeId: "", priceCents: null, active: true },
                        ])
                      }
                    >
                      <Plus size={16} /> Agregar tamaño
                    </Button>
                    {!catalog.sizes.length && (
                      <p>
                        No hay tamaños importados todavía. No se inventarán
                        precios ni porciones.
                      </p>
                    )}
                  </section>
                )}
                <Field
                  label="Posición en la tienda"
                  error={errors.order}
                  hint="Define en qué orden se muestra. Los números más bajos aparecen primero."
                >
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    value={p.order}
                    onChange={(e) =>
                      set(
                        "order",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />
                </Field>
                <div className="a-span a-checks">
                  {[
                    ["active", "Producto activo"],
                    ["featured", "Mostrar como destacado"],
                    ["reserved", "Reservado"],
                    ["sinTacc", "Sin TACC"],
                    ["limited", "Edición limitada"],
                    ...(p.kind === "special"
                      ? [["campaignActive", "Habilitado en campaña"]]
                      : []),
                  ].map(([id, label]) => (
                    <label className="a-check" key={id}>
                      <input
                        type="checkbox"
                        checked={p[id]}
                        onChange={(e) => set(id, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <Field label="Etiqueta (opcional)" error={errors.label}>
                  <input
                    value={p.label}
                    maxLength={160}
                    onChange={(e) => set("label", e.target.value)}
                    placeholder="Nuevo, edición limitada…"
                  />
                </Field>
                <details className="a-span a-advanced">
                  <summary>Oferta y fechas de disponibilidad</summary>
                  <div className="a-form-grid">
                    {p.kind !== "postre" && (
                      <>
                        {moneyField(
                          "offerPriceCents",
                          "Precio de oferta (opcional)",
                        )}
                        {moneyField(
                          "previousPriceCents",
                          "Precio anterior (opcional)",
                        )}
                        <Field
                          label="Texto de oferta"
                          error={errors.offerLabel}
                        >
                          <input
                            value={p.offerLabel}
                            maxLength={160}
                            onChange={(e) => set("offerLabel", e.target.value)}
                          />
                        </Field>
                      </>
                    )}
                    {[
                      ["startDate", "Disponible desde"],
                      ["endDate", "Disponible hasta"],
                    ].map(([id, label]) => (
                      <Field label={label} error={errors[id]} key={id}>
                        <input
                          type="date"
                          value={p[id] || ""}
                          onChange={(e) => set(id, e.target.value || null)}
                        />
                      </Field>
                    ))}
                    <p className="a-span">
                      Sin fechas, no se limita por temporada. Un producto
                      reservado puede verse, pero no agregarse al pedido.
                    </p>
                  </div>
                </details>
              </div>
            </section>
            <section className="a-editor-section a-image-editor">
              <div className="a-editor-section-head">
                <span>02</span>
                <div>
                  <h2>Fotos del producto</h2>
                  <p>
                    La primera es la principal. Podés elegir hasta 12 fotos,
                    cambiar su orden y quitar asociaciones.
                  </p>
                </div>
              </div>
              <label className="a-upload">
                <ImagePlus size={30} />
                <strong>
                  {uploading
                    ? "Preparando fotografías…"
                    : "Elegir fotos del celular o computadora"}
                </strong>
                <span>JPG, PNG o WebP · hasta 2 MB por foto</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    upload([...e.target.files]);
                    e.target.value = "";
                  }}
                  aria-label="Subir fotografías"
                />
              </label>
              {errors.images && <p className="a-error">{errors.images}</p>}
              <div className="a-photo-grid">
                {p.images.map((img, i) => (
                  <article className="a-image-card" key={img.id}>
                    <Photo image={img.url} />
                    <span className="a-tag">
                      {i === 0 ? "Foto principal" : `Foto ${i + 1}`}
                    </span>
                    <Field label={`Texto alternativo foto ${i + 1}`}>
                      <input
                        maxLength={240}
                        value={img.alt}
                        onChange={(e) =>
                          set(
                            "images",
                            p.images.map((x, j) =>
                              j === i ? { ...x, alt: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </Field>
                    <div className="a-image-actions">
                      <Button
                        secondary
                        disabled={i === 0}
                        aria-label={`Mover foto ${i + 1} antes`}
                        onClick={() => moveImage(i, -1)}
                      >
                        <ArrowUp size={15} />
                      </Button>
                      <Button
                        secondary
                        disabled={i === p.images.length - 1}
                        aria-label={`Mover foto ${i + 1} después`}
                        onClick={() => moveImage(i, 1)}
                      >
                        <ArrowDown size={15} />
                      </Button>
                      {i > 0 && (
                        <Button
                          secondary
                          onClick={() =>
                            set("images", [
                              img,
                              ...p.images.filter((_, j) => j !== i),
                            ])
                          }
                        >
                          Principal
                        </Button>
                      )}
                      <Button
                        secondary
                        aria-label={`Quitar foto ${i + 1}`}
                        onClick={() =>
                          set(
                            "images",
                            p.images.filter((_, j) => j !== i),
                          )
                        }
                      >
                        <X size={16} />
                      </Button>
                    </div>
                    <label className="a-replace">
                      Reemplazar foto
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label={`Reemplazar foto ${i + 1}`}
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          e.target.value = "";
                          if (!file) return;
                          setUploading(true);
                          try {
                            const replacement = await service.upload(file);
                            set(
                              "images",
                              p.images.map((x, j) =>
                                j === i ? replacement : x,
                              ),
                            );
                          } catch (e) {
                            setError(e.message);
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                    </label>
                  </article>
                ))}
              </div>
              {library.length > 0 && (
                <details className="a-advanced">
                  <summary>Usar una foto de la biblioteca</summary>
                  <div className="a-library">
                    {library.map((img) => (
                      <button
                        type="button"
                        key={img.id}
                        onClick={() => {
                          if (p.images.length >= 12) {
                            setError("El máximo es 12 fotos.");
                            return;
                          }
                          set("images", [...p.images, img]);
                        }}
                        aria-label={`Usar foto ${img.alt || img.id}`}
                      >
                        <Photo image={img.url} name={img.alt} />
                      </button>
                    ))}
                  </div>
                </details>
              )}
              <small>
                Quitar una foto solo la desvincula de este producto. El archivo
                original se conserva.
              </small>
            </section>
          </fieldset>
          <div className="a-editor-footer">
            <div>
              {!creating && (
                <Button
                  secondary
                  onClick={() => setConfirmArchive(true)}
                  disabled={busy || uploading || !service.writesEnabled}
                >
                  {p.archived ? <RotateCcw size={16} /> : <Archive size={16} />}{" "}
                  {p.archived ? "Recuperar" : "Archivar"}
                </Button>
              )}
            </div>
            <div className="a-actions">
              <Button secondary onClick={close} disabled={busy}>
                Cancelar
              </Button>
              <Button
                onClick={save}
                disabled={busy || uploading || !service.writesEnabled}
              >
                {busy ? <LoaderCircle size={16} /> : <Save size={16} />}{" "}
                {service.mode === "demo"
                  ? "Guardar en demo"
                  : "Guardar producto"}
              </Button>
            </div>
          </div>
        </div>
        <aside className="a-editor-preview" aria-label="Vista previa">
          <span className="a-eyebrow">ASÍ SE VERÁ</span>
          <h2>Vista previa</h2>
          <p>Se actualiza mientras editás.</p>
          <ProductPreview p={p} catalog={catalog} />
        </aside>
      </div>
      {confirmArchive && (
        <Modal
          title={
            p.archived ? "Recuperar este producto" : "Archivar este producto"
          }
          onClose={() => setConfirmArchive(false)}
        >
          <p>
            {p.archived
              ? "Volverá al listado como inactivo para que puedas revisarlo."
              : "Se conservarán todos sus datos y fotos. Podrás recuperarlo desde el filtro Archivados."}
          </p>
          <div className="a-actions">
            <Button secondary onClick={() => setConfirmArchive(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                set("archived", !p.archived);
                set("active", false);
                setConfirmArchive(false);
              }}
            >
              Confirmar y seguir editando
            </Button>
          </div>
          <p className="a-muted">
            Aplicá la operación con el botón de guardar.
          </p>
        </Modal>
      )}
    </section>
  );
}
function CategoryEditor({ category, catalog, service, onClose, onSaved }) {
  const creating = !category,
    [c, setC] = useState(
      category
        ? { ...category }
        : {
            id: `categoria-${crypto.randomUUID().slice(0, 8)}`,
            name: "",
            parentId: null,
            order: catalog.categories.length,
            active: true,
          },
    ),
    [errors, setErrors] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (k, v) => setC((c) => ({ ...c, [k]: v }));
  return (
    <Modal
      title={creating ? "Nueva categoría" : "Editar categoría"}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            const clean = validateCategory(c, catalog.categories);
            setBusy(true);
            onSaved(
              await service.saveCategory(clean, catalog.revision, creating),
            );
            onClose();
          } catch (e) {
            setError(e.message);
            setErrors(e.errors || {});
          } finally {
            setBusy(false);
          }
        }}
      >
        {error && (
          <p className="a-error" role="alert">
            {error}
          </p>
        )}
        <Field label="Nombre de categoría" error={errors.name}>
          <input
            autoFocus
            value={c.name}
            maxLength={120}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field
          label="Categoría principal"
          error={errors.parentId}
          hint="Dejá Sin categoría principal para crear una categoría de primer nivel."
        >
          <select
            value={c.parentId || ""}
            onChange={(e) => set("parentId", e.target.value || null)}
          >
            <option value="">Sin categoría principal</option>
            {catalog.categories
              .filter((x) => !x.parentId && x.id !== c.id)
              .map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
        </Field>
        <Field
          label="Posición en la tienda"
          error={errors.order}
          hint="Los números más bajos aparecen primero."
        >
          <input
            type="number"
            min="0"
            value={c.order}
            onChange={(e) =>
              set(
                "order",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </Field>
        <label className="a-check">
          <input
            type="checkbox"
            checked={c.active}
            onChange={(e) => set("active", e.target.checked)}
          />{" "}
          Categoría activa
        </label>
        <div className="a-modal-footer">
          <Button secondary onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy || !service.writesEnabled}>
            {busy ? "Guardando…" : "Guardar categoría"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function CakeRules() {
  return (
    <section className="a-card a-rules">
      <h2>Tortas hechas a medida</h2>
      <p>
        Precios calculados, sin un precio único. Esta matriz conserva las reglas
        actuales y se presenta para consulta.
      </p>
      <div className="a-rules-grid">
        {cakePriceOptions.map((o) => (
          <article key={o.id}>
            <h3>
              {o.nombre} · {o.fillings} rellenos
            </h3>
            {o.sizes.map((s) => (
              <div key={s.nombre}>
                <span>
                  {s.nombre}
                  <small>{s.porciones}</small>
                </span>
                <strong>{formatMoney(s.price * 100)}</strong>
              </div>
            ))}
          </article>
        ))}
      </div>
      <details className="a-advanced">
        <summary>Adicionales y cálculo del total</summary>
        <p>
          Base según cobertura, cantidad de rellenos y tamaño + adicionales de
          rellenos + decoración.
        </p>
        {tortaExtras.map((e) => (
          <p key={e.id}>
            <b>{e.nombre}</b>:{" "}
            {getCakeExtraDisplay(e, null, (value) => formatMoney(value * 100))}
          </p>
        ))}
        <p>
          Pisos falsos se calcula sobre el precio base, con redondeo al peso.
          Los cambios de estas reglas requieren revisar juntos el configurador y
          el carrito.
        </p>
      </details>
    </section>
  );
}
export default function AdminApp() {
  const [session, setSession] = useState(null),
    [service, setService] = useState(null),
    [catalog, setCatalog] = useState(null),
    [section, setSection] = useState("home"),
    [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notConfigured, setNotConfigured] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false),
    [editor, setEditor] = useState(null),
    [categoryEditor, setCategoryEditor] = useState(null),
    [notice, setNotice] = useState(""),
    [rules, setRules] = useState(false),
    [resetConfirm, setResetConfirm] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "all",
    sort: "order",
  });
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [section, rules, editor]);
  const expire = (e) => {
    setError(e.message);
    if (e.status === 401) {
      setService(null);
      setSession(null);
      setCatalog(null);
    }
  };
  useEffect(() => {
    let active = true;
    adminRequest("session")
      .then((s) => {
        if (active) {
          setSession(s);
          setService(createRealService(s));
        }
      })
      .catch((e) => {
        if (active && e.status !== 401) {
          setError(e.message);
          setNotConfigured(e.status === 503);
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!service) return;
    let active = true;
    setBusy(true);
    service
      .read()
      .then((c) => {
        if (active) setCatalog(c);
      })
      .catch((e) => {
        if (active) expire(e);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [service]);
  const visible = useMemo(
    () => (catalog ? filterProducts(catalog.products, filters) : []),
    [catalog, filters],
  );
  const saved = (next) => {
    setCatalog(next);
    setNotice(
      service.mode === "demo"
        ? "Cambios guardados solo en esta demostración."
        : "Cambios guardados correctamente.",
    );
  };
  const refresh = async () => {
    setError("");
    setBusy(true);
    try {
      setCatalog(await service.read());
      setNotice("Catálogo actualizado.");
    } catch (e) {
      expire(e);
    } finally {
      setBusy(false);
    }
  };
  const filter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  if (!service)
    return (
      <main className="admin-root admin-login">
        <div className="a-login-art">
          <Logo />
          <img
            className="a-login-flower"
            src="/images/flor-de-postre-flower-pink.png"
            alt=""
          />
          <div>
            <span className="a-eyebrow">
              HECHO CON AMOR, TAMBIÉN POR DENTRO
            </span>
            <h1>
              Un espacio para
              <br />
              hacer florecer
              <br />
              <em>tu catálogo.</em>
            </h1>
            <p>
              Cuidá cada detalle de tus productos,
              <br />
              tan fácil como prepararlos con amor.
            </p>
          </div>
          <Link to="/">
            Volver a la tienda <ArrowUpRight size={16} />
          </Link>
        </div>
        <section className="a-login-form">
          <div className="a-login-mobile-logo">
            <Logo />
          </div>
          <span className="a-tag">
            <ShieldCheck size={14} /> Espacio de administración
          </span>
          <h2>Qué lindo verte por acá</h2>
          <p>Ingresá para cuidar el catálogo de Flor de Postre.</p>
          {error && (
            <div role="alert" className="a-notice">
              {error}
            </div>
          )}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const submittedEmail = String(formData.get("email") || "").trim();
              const submittedPassword = String(formData.get("password") || "");
              setBusy(true);
              setError("");
              try {
                await adminRequest("login", {
                  method: "POST",
                  body: { email: submittedEmail, password: submittedPassword },
                });
                const s = await adminRequest("session");
                setSession(s);
                setService(createRealService(s));
                setPassword("");
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <Field label="Correo electrónico">
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                value={email}
                disabled={checking || notConfigured}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </Field>
            <div className="a-field">
              <label htmlFor="admin-password">Contraseña</label>
              <div className="a-password-control">
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    import.meta.env.DEV ? "off" : "current-password"
                  }
                  maxLength={256}
                  required
                  value={password}
                  disabled={checking || notConfigured}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="a-password-toggle"
                  type="button"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  disabled={checking || notConfigured}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={busy || checking || notConfigured}>
              {checking
                ? "Verificando acceso…"
                : busy
                  ? "Ingresando…"
                  : "Ingresar al administrador"}
              <ChevronRight size={17} />
            </Button>
          </form>
          {isDemo && (
            <div className="a-demo-entry">
              <strong>Demostración local</strong>
              <p>
                Datos de ejemplo guardados en este navegador. Las fotos y los
                cambios no se publican. No es una autenticación real.
              </p>
              <Button
                secondary
                onClick={() => {
                  setService(createDemoService(window.localStorage));
                  setError("");
                  setSession({ user: { email: "Demo local" } });
                }}
              >
                Entrar a la demostración
              </Button>
            </div>
          )}
          <small>Ingresá para administrar el catálogo de Flor de Postre.</small>
          <Link className="a-login-mobile-back" to="/">
            Volver a la tienda
          </Link>
        </section>
      </main>
    );
  return (
    <div className="admin-root a-layout">
      <aside className="a-sidebar">
        <Logo />
        <span className="a-sidebar-caption">El taller de Flor</span>
        <nav aria-label="Administración">
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={section === id ? "selected" : ""}
              aria-current={section === id ? "page" : undefined}
              disabled={Boolean(editor)}
              onClick={() => {
                setSection(id);
                setRules(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {section === id && <span className="a-nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="a-sidebar-bottom">
          <Link to="/" target="_blank">
            Ver mi tienda <ArrowUpRight size={16} />
          </Link>
          <div>
            <Flower2 size={21} />
            <p>
              Pequeños detalles,
              <br />
              <b>cosas deliciosas.</b>
            </p>
          </div>
        </div>
      </aside>
      <div className="a-workspace">
        <header className="a-topbar">
          <span>
            Flor de Postre <i>/</i> {nav.find((n) => n[0] === section)?.[1]}
            {editor && (
              <>
                <i>/</i> {editor.product?.name || "Nuevo producto"}
              </>
            )}
          </span>
          <div>
            <span className="a-user">{session?.user?.email}</span>
            <Button
              secondary
              aria-label="Cerrar sesión"
              onClick={async () => {
                try {
                  await service.logout();
                  setService(null);
                  setSession(null);
                  setCatalog(null);
                  setError("");
                } catch (e) {
                  expire(e);
                }
              }}
            >
              <LogOut size={16} />
              <span>Salir</span>
            </Button>
          </div>
        </header>
        {service.mode === "demo" && (
          <div className="a-mode-banner">
            <span>
              <b>Demostración local</b> · Datos de ejemplo. Los cambios no se
              publican ni se envían a servicios reales.
            </span>
            <Button secondary onClick={() => setResetConfirm(true)}>
              <RotateCcw size={14} /> Reiniciar
            </Button>
          </div>
        )}
        <main className="a-content">
          {error && (
            <div className="a-notice a-error" role="alert">
              {error}
              <Button secondary onClick={refresh}>
                Volver a intentar
              </Button>
            </div>
          )}
          {notice && (
            <div className="a-success" role="status">
              <Check size={16} />
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {!catalog ? (
            <div className="a-empty">
              {busy ? <LoaderCircle size={30} /> : <Flower2 size={30} />}
              <p>
                {busy
                  ? "Preparando tu catálogo…"
                  : "No pudimos cargar el catálogo."}
              </p>
              {!busy && <Button onClick={refresh}>Volver a intentar</Button>}
            </div>
          ) : editor ? (
            <ProductEditor
              product={editor.product}
              catalog={catalog}
              service={service}
              onSaved={saved}
              onClose={() => setEditor(null)}
            />
          ) : (
            <>
              {section === "home" && (
                <>
                  <section className="a-welcome">
                    <div>
                      <span className="a-eyebrow">
                        TU CATÁLOGO, CON EL CUIDADO DE SIEMPRE
                      </span>
                      <h1>
                        Hola, Flor de Postre <span>✿</span>
                      </h1>
                      <p>Todo listo para darle tu toque al día.</p>
                      <Button
                        onClick={() => {
                          setSection("products");
                          setEditor({ product: null });
                        }}
                        disabled={!service.writesEnabled}
                      >
                        <Plus size={18} /> Crear un producto
                      </Button>
                    </div>
                    <img src="/images/flor-de-postre-flower-pink.png" alt="" />
                  </section>
                  <div className="a-stats">
                    {[
                      [
                        catalog.products.filter((p) => p.active && !p.archived)
                          .length,
                        "Productos activos",
                        Package,
                        "active",
                      ],
                      [
                        catalog.products.filter((p) => !p.active && !p.archived)
                          .length,
                        "Productos inactivos",
                        Eye,
                        "inactive",
                      ],
                      [
                        catalog.products.filter(
                          (p) => p.featured && !p.archived,
                        ).length,
                        "Destacados",
                        Star,
                        "featured",
                      ],
                      [
                        catalog.categories.length,
                        "Categorías",
                        LayoutGrid,
                        null,
                      ],
                    ].map(([count, label, Icon, status]) => (
                      <button
                        className="a-stat"
                        key={label}
                        onClick={() => {
                          setSection(status ? "products" : "categories");
                          if (status) filter("status", status);
                        }}
                      >
                        <span>
                          <Icon size={19} />
                          <ArrowUpRight size={16} />
                        </span>
                        <b>{count}</b>
                        <small>{label}</small>
                      </button>
                    ))}
                  </div>
                  <div className="a-home-grid">
                    <section className="a-card">
                      <div className="a-section-head">
                        <div>
                          <h2>Hechos para destacar</h2>
                          <p>Los favoritos de tu catálogo.</p>
                        </div>
                        <button
                          className="a-text-button"
                          onClick={() => {
                            setSection("products");
                            filter("status", "featured");
                          }}
                        >
                          Ver todos <ChevronRight size={15} />
                        </button>
                      </div>
                      {catalog.products
                        .filter((p) => p.featured && !p.archived)
                        .slice(0, 4)
                        .map((p) => (
                          <button
                            className="a-mini-product"
                            key={p.id}
                            onClick={() => {
                              setSection("products");
                              setEditor({ product: p });
                            }}
                          >
                            <Photo image={p.images[0]?.url} />
                            <span>
                              <b>{p.name}</b>
                              <small>
                                {
                                  catalog.categories.find(
                                    (c) => c.id === p.categoryId,
                                  )?.name
                                }
                              </small>
                            </span>
                            <strong>{formatMoney(p.priceCents)}</strong>
                            <ChevronRight size={16} />
                          </button>
                        ))}
                    </section>
                    <section className="a-note-card">
                      <span className="a-note-icon">
                        <Flower2 size={30} />
                      </span>
                      <h2>Cada detalle cuenta</h2>
                      <p>
                        Editá un producto para cambiar su foto, nombre,
                        descripción, categoría, precio y disponibilidad.
                      </p>
                      <Button secondary onClick={() => setSection("products")}>
                        Ir a productos <ArrowUpRight size={16} />
                      </Button>
                      <small>
                        Los precios de las tortas personalizadas se calculan con
                        sus propias reglas.
                      </small>
                      <button
                        className="a-text-button"
                        onClick={() => {
                          setSection("products");
                          setRules(true);
                        }}
                      >
                        Consultar reglas de tortas <ChevronRight size={15} />
                      </button>
                    </section>
                  </div>
                </>
              )}
              {section === "products" && (
                <>
                  <div className="a-page-title">
                    <div>
                      <span className="a-eyebrow">EL CORAZÓN DE TU TIENDA</span>
                      <h1>Mis productos</h1>
                      <p>Un lugar para cada cosa rica que hacés.</p>
                    </div>
                    <Button
                      onClick={() => setEditor({ product: null })}
                      disabled={!service.writesEnabled}
                    >
                      <Plus size={17} /> Nuevo producto
                    </Button>
                  </div>
                  <div className="a-list-heading">
                    <button
                      className={`a-text-button ${rules ? "" : "a-current"}`}
                      onClick={() => setRules(false)}
                    >
                      Catálogo
                    </button>
                    <button
                      className={`a-text-button ${rules ? "a-current" : ""}`}
                      onClick={() => setRules(true)}
                    >
                      Reglas de tortas
                    </button>
                    <Button
                      secondary
                      aria-label="Actualizar catálogo"
                      onClick={refresh}
                      disabled={busy}
                    >
                      <RotateCcw size={15} />
                    </Button>
                  </div>
                  {rules ? (
                    <CakeRules />
                  ) : (
                    <>
                      <section
                        className="a-filters"
                        aria-label="Filtros de productos"
                      >
                        <label className="a-search">
                          <Search size={18} />
                          <input
                            aria-label="Buscar productos"
                            value={filters.search}
                            placeholder="Buscar por nombre o descripción…"
                            onChange={(e) => filter("search", e.target.value)}
                          />
                        </label>
                        <select
                          aria-label="Filtrar categoría"
                          value={filters.category}
                          onChange={(e) => filter("category", e.target.value)}
                        >
                          <option value="">Todas las categorías</option>
                          {catalog.categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Filtrar estado"
                          value={filters.status}
                          onChange={(e) => filter("status", e.target.value)}
                        >
                          {Object.entries({
                            all: "Todos los estados",
                            active: "Activos",
                            inactive: "Inactivos",
                            featured: "Destacados",
                            reserved: "Reservados",
                            archived: "Archivados",
                          }).map(([id, label]) => (
                            <option value={id} key={id}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Ordenar productos"
                          value={filters.sort}
                          onChange={(e) => filter("sort", e.target.value)}
                        >
                          <option value="order">Posición en la tienda</option>
                          <option value="name">Nombre A–Z</option>
                          <option value="price">Menor precio</option>
                        </select>
                      </section>
                      <div className="a-result-count">
                        {visible.length}{" "}
                        {visible.length === 1 ? "producto" : "productos"}
                      </div>
                      <section
                        className="a-product-list"
                        aria-label="Listado de productos"
                      >
                        <div className="a-table-head">
                          <span>Producto</span>
                          <span>Categoría</span>
                          <span>Precio</span>
                          <span>Estado</span>
                          <span>Acciones</span>
                        </div>
                        {visible.map((p) => (
                          <article className="a-product-row" key={p.id}>
                            <div className="a-product-name">
                              <Photo image={p.images[0]?.url} name={p.name} />
                              <span>
                                <b>
                                  {p.name}{" "}
                                  {p.featured && (
                                    <Star className="a-star" size={14} />
                                  )}
                                </b>
                                <small>{labels[p.kind]}</small>
                              </span>
                            </div>
                            <span className="a-product-category">
                              {
                                catalog.categories.find(
                                  (c) => c.id === p.categoryId,
                                )?.name
                              }
                            </span>
                            <strong className="a-product-price">
                              {formatMoney(p.priceCents)}
                            </strong>
                            <Status product={p} />
                            <Button
                              secondary
                              aria-label={`Editar ${p.name}`}
                              onClick={() => setEditor({ product: p })}
                            >
                              Editar <ChevronRight size={14} />
                            </Button>
                          </article>
                        ))}
                        {visible.length === 0 && (
                          <div className="a-empty">
                            <Search size={28} />
                            <h3>No encontramos productos</h3>
                            <p>Probá otro nombre o cambiá los filtros.</p>
                            <Button
                              secondary
                              onClick={() =>
                                setFilters({
                                  search: "",
                                  category: "",
                                  status: "all",
                                  sort: "order",
                                })
                              }
                            >
                              Limpiar filtros
                            </Button>
                          </div>
                        )}
                      </section>
                    </>
                  )}
                </>
              )}
              {section === "categories" && (
                <>
                  <div className="a-page-title">
                    <div>
                      <span className="a-eyebrow">
                        CADA DELICIA EN SU LUGAR
                      </span>
                      <h1>Categorías</h1>
                      <p>Ordená el catálogo para que sea fácil de recorrer.</p>
                    </div>
                    <Button
                      onClick={() => setCategoryEditor({ category: null })}
                      disabled={!service.writesEnabled}
                    >
                      <Plus size={17} /> Nueva categoría
                    </Button>
                  </div>
                  <div className="a-category-grid">
                    {[...catalog.categories]
                      .sort((a, b) => a.order - b.order)
                      .map((c) => (
                        <article className="a-card a-category-card" key={c.id}>
                          <span className="a-category-icon">
                            <LayoutGrid size={23} />
                          </span>
                          {c.parentId && (
                            <small>
                              {
                                catalog.categories.find(
                                  (x) => x.id === c.parentId,
                                )?.name
                              }{" "}
                              /
                            </small>
                          )}
                          <h2>{c.name}</h2>
                          <p>
                            {
                              catalog.products.filter(
                                (p) => p.categoryId === c.id && !p.archived,
                              ).length
                            }{" "}
                            productos · Orden {c.order}
                          </p>
                          <div>
                            <span
                              className={`a-status ${c.active ? "active" : "inactive"}`}
                            >
                              {c.active ? "Activa" : "Inactiva"}
                            </span>
                            <Button
                              secondary
                              onClick={() => setCategoryEditor({ category: c })}
                            >
                              Editar <ChevronRight size={14} />
                            </Button>
                          </div>
                        </article>
                      ))}
                  </div>
                  <p className="a-muted">
                    Las subcategorías están preparadas para organizar productos.
                    En la web actual se conserva su categoría principal.
                  </p>
                </>
              )}
              {section === "settings" && (
                <>
                  <div className="a-page-title">
                    <div>
                      <span className="a-eyebrow">
                        UN ESPACIO QUE CRECE CON VOS
                      </span>
                      <h1>Configuración</h1>
                      <p>
                        Lo esencial para saber cómo está funcionando tu
                        catálogo.
                      </p>
                    </div>
                  </div>
                  <section className="a-card a-config">
                    <ShieldCheck size={30} />
                    <h2>Un espacio para lo que viene</h2>
                    <p>
                      Acá vamos a sumar nuevas herramientas cuando realmente
                      sean útiles para Flor de Postre.
                    </p>
                  </section>
                </>
              )}
            </>
          )}
          <footer className="a-footer">
            Flor de Postre <span>·</span> Hecho con amor, cuidado en cada
            detalle.
          </footer>
        </main>
      </div>
      {categoryEditor && catalog && (
        <CategoryEditor
          category={categoryEditor.category}
          catalog={catalog}
          service={service}
          onSaved={saved}
          onClose={() => setCategoryEditor(null)}
        />
      )}
      {resetConfirm && (
        <Modal
          title="Reiniciar demostración"
          onClose={() => setResetConfirm(false)}
        >
          <p>
            Se borrarán los cambios de ejemplo guardados en este navegador y se
            recuperará el catálogo de demostración.
          </p>
          <div className="a-actions">
            <Button secondary onClick={() => setResetConfirm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setCatalog(service.reset());
                setResetConfirm(false);
                setNotice("Demostración reiniciada.");
              }}
            >
              Reiniciar demo
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
