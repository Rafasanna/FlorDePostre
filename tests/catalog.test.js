import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProduct,
  moneyInputToCents,
  validateCategory,
  filterProducts,
} from "../shared/catalog.js";
import {
  demoSeed,
  createDemoService,
  demoAllowed,
  validateFile,
} from "../src/admin/demo.js";
import {
  getCakeSizePrice,
  getCakeExtraPrice,
  getCakeFillingPrice,
  cakePriceOptions,
} from "../src/data/tortasData.js";
import { getEffectivePrice, isProductVisible } from "../src/utils/seasonal.js";
import {
  getDisplayImageUrl,
  getResponsiveImageSrcSet,
} from "../src/utils/productImages.js";
import { publicDatasets } from "../shared/public-catalog.js";
import * as sheets from "../src/services/googleSheets.js";
import {
  normalizeSnapshot,
  definitions,
  splitSQL,
} from "../scripts/catalog-import.js";
import { csvFixtures } from "./fixtures.js";

test("valida los distintos modelos sin colapsarlos a un precio único", () => {
  const c = demoSeed();
  for (const p of c.products)
    assert.doesNotThrow(() =>
      validateProduct(p, c, { existing: p, demo: true }),
    );
  const p = c.products[0];
  for (const bad of [
    { priceCents: -1 },
    { priceCents: 1.2 },
    { order: -1 },
    { active: "true" },
    { id: "duplicado con espacios" },
    {
      images: [
        { id: "x", url: "javascript:alert(1)", alt: "", publicId: null },
      ],
    },
  ])
    assert.throws(() => validateProduct({ ...p, ...bad }, c, { existing: p }));
  assert.throws(() => validateProduct(p, c));
  assert.throws(() =>
    validateProduct({ ...p, id: "new-id" }, c, { existing: p }),
  );
  const postre = c.products.find((p) => p.kind === "postre");
  assert.throws(() =>
    validateProduct({ ...postre, priceCents: 100 }, c, { existing: postre }),
  );
  assert.throws(() =>
    validateProduct(
      { ...postre, variants: [postre.variants[0], postre.variants[0]] },
      c,
      { existing: postre },
    ),
  );
  assert.throws(() =>
    validateProduct({ ...postre, variants: [] }, c, { existing: postre }),
  );
  assert.doesNotThrow(() =>
    validateProduct({ ...postre, variants: [], active: false }, c, {
      existing: postre,
    }),
  );
});
test("ofertas y fechas inválidas son rechazadas antes de guardar", () => {
  const c = demoSeed(),
    p = c.products[0];
  for (const bad of [
    { offerPriceCents: p.priceCents + 1 },
    { startDate: "2026-02-30" },
    { startDate: "2026-12-01", endDate: "2026-01-01" },
    { stock: -2 },
    { stock: 1.2 },
    { priceCents: NaN },
  ])
    assert.throws(() => validateProduct({ ...p, ...bad }, c, { existing: p }));
});
test("buscar sin acentos, filtrar y ordenar, sin incluir archivados", () => {
  const c = demoSeed(),
    p = c.products[0];
  assert.ok(filterProducts(c.products, { search: "CLASICO" }).length);
  assert.ok(
    filterProducts(c.products, { category: p.categoryId }).every(
      (x) => x.categoryId === p.categoryId,
    ),
  );
  assert.ok(
    filterProducts(c.products, { status: "featured" }).every((x) => x.featured),
  );
  assert.deepEqual(filterProducts([{ ...p, archived: true }], {}), []);
  const sorted = filterProducts(c.products, { sort: "name" });
  assert.equal(
    sorted[0].name,
    [...sorted].sort((a, b) => a.name.localeCompare(b.name, "es"))[0].name,
  );
});
test("demo persiste, activa, desactiva, archiva, recupera y bloquea IDs duplicados", async () => {
  let memory = null;
  const storage = {
    getItem: () => memory,
    setItem: (_k, v) => {
      memory = v;
    },
    removeItem: () => {
      memory = null;
    },
  };
  const service = createDemoService(storage);
  let c = await service.read();
  const p = c.products[0];
  c = await service.saveProduct({ ...p, active: false }, c.revision, false);
  assert.equal(c.products[0].active, false);
  c = await service.saveProduct(
    { ...p, archived: true, active: false },
    c.revision,
    false,
  );
  assert.equal(c.products[0].archived, true);
  await assert.rejects(service.saveProduct(p, c.revision, true));
  c = await service.saveProduct(
    { ...p, archived: false, active: false },
    c.revision,
    false,
  );
  assert.equal(c.products[0].archived, false);
  c = await service.saveProduct({ ...p, active: true }, c.revision, false);
  assert.equal(c.products[0].active, true);
  assert.equal((await createDemoService(storage).read()).revision, c.revision);
  await assert.rejects(service.saveProduct(p, c.revision - 1, false));
});
test("demo requiere configuración explícita, desarrollo y loopback; archivos con límites", () => {
  assert.ok(demoAllowed({ enabled: true, dev: true, host: "localhost" }));
  for (const overrides of [
    { dev: false },
    { enabled: false },
    { host: "example.com" },
    { host: "192.168.0.10" },
  ])
    assert.equal(
      demoAllowed({
        enabled: true,
        dev: true,
        host: "localhost",
        ...overrides,
      }),
      false,
    );
  assert.throws(() => validateFile({ type: "image/svg+xml", size: 10 }));
  assert.throws(() => validateFile({ type: "image/png", size: 3e6 }));
});
test("categorías y subcategorías no aceptan duplicados, ciclos o tercer nivel", () => {
  const cats = [
    { id: "root", name: "Raíz", parentId: null, order: 0, active: true },
    { id: "child", name: "Hija", parentId: "root", order: 1, active: true },
  ];
  assert.throws(() =>
    validateCategory({ ...cats[0], parentId: "child" }, cats),
  );
  assert.throws(() =>
    validateCategory(
      {
        id: "third",
        name: "Tercera",
        parentId: "child",
        order: 0,
        active: true,
      },
      cats,
    ),
  );
  assert.throws(() => validateCategory({ ...cats[0], id: "another" }, cats));
});
test("matriz real de tortas y adicionales conserva overrides y redondeo", () => {
  for (const option of cakePriceOptions)
    for (const size of option.sizes)
      assert.equal(getCakeSizePrice(option.id, size.nombre).price, size.price);
  assert.equal(getCakeSizePrice("fondant-3-rellenos", "18 cm"), null);
  assert.equal(
    getCakeExtraPrice({ id: "extra-pisos-falsos", precioExtra: 15000 }, 38900),
    9725,
  );
  assert.equal(getCakeExtraPrice({ id: "extra-pisos-falsos" }, 38901), 9725);
  assert.equal(
    getCakeExtraPrice({ id: "extra-imprimible", precioExtra: 3000 }, 38900),
    5000,
  );
  assert.equal(getCakeFillingPrice({ precioExtra: 4500 }), 4500);
  assert.equal(
    38900 +
      getCakeFillingPrice({ precioExtra: 4500 }) +
      getCakeExtraPrice({ id: "extra-pisos-falsos" }, 38900),
    53125,
  );
});
test("Sheets mantiene sus normalizadores, oferta y disponibilidad", () => {
  const p = sheets.normalizeDailyProduct({
    "ID interno (no tocar)": "abc",
    Producto: "Alfajor",
    Precio: "$4.500,50",
    Categoría: "Alfajores",
    Reservado: "sí",
    Disponible: "no",
    imagenes: "https://a.example/1.jpg,https://a.example/2.jpg",
  });
  assert.equal(p.precio, 4500.5);
  assert.equal(p.reservado, true);
  assert.equal(p.disponible, false);
  assert.equal(p.imagenes.length, 2);
  const active = { ...p, disponible: true, precioOferta: 4000 };
  assert.equal(getEffectivePrice(active), 4000);
  assert.equal(
    isProductVisible(
      { ...p, fechaInicio: "2026-01-01", fechaFin: "2026-01-02" },
      new Date("2026-10-01"),
    ),
    false,
  );
  assert.deepEqual(
    sheets.parseCsv('a,b\n"uno, dos","con ""comillas""\ny línea"')[1],
    ["uno, dos", 'con "comillas"\ny línea'],
  );
});
test("importación offline preserva IDs, relaciones, inactivos y precios; bloquea pérdidas silenciosas", () => {
  const files = csvFixtures(),
    withUnavailableVariant = {
      ...files,
      postresConfig: `${files.postresConfig.replace("ID postre,ID Tamaño,Precio", "ID postre,ID Tamaño,Precio,Disponible")}\npostre,size-sin-precio,,No`,
    },
    { catalog, datasets, omissions } = normalizeSnapshot(
      withUnavailableVariant,
    );
  assert.equal(Object.keys(datasets).length, 11);
  assert.equal(catalog.products[0].priceCents, 450050);
  assert.equal(
    catalog.products.find((p) => p.kind === "special").campaignActive,
    false,
  );
  assert.equal(publicDatasets(catalog).specialProducts[0].activo, false);
  assert.deepEqual(omissions, [
    {
      dataset: "postresConfig",
      row: 2,
      reason: "unavailable-without-price",
      postreId: "postre",
      sizeId: "size-sin-precio",
    },
  ]);
  const duplicatedAcrossKinds = normalizeSnapshot({
    ...files,
    sinTacc: files.sinTacc.replace("sin-tacc,", "alfajor,"),
  });
  assert.deepEqual(
    duplicatedAcrossKinds.identities.map(({ kind, publicId, internalId }) => ({
      kind,
      publicId,
      internalId,
    })),
    [
      { kind: "daily", publicId: "alfajor", internalId: "daily-alfajor" },
      {
        kind: "sin_tacc",
        publicId: "alfajor",
        internalId: "sin_tacc-alfajor",
      },
    ],
  );
  assert.deepEqual(
    publicDatasets(duplicatedAcrossKinds.catalog).menuDiario.map((p) => p.id),
    ["alfajor"],
  );
  assert.deepEqual(
    publicDatasets(duplicatedAcrossKinds.catalog).sinTacc.map((p) => p.id),
    ["alfajor"],
  );
  for (const changes of [
    {
      postresConfig: files.postresConfig.replace(
        "postre,size-18",
        "unknown,size-18",
      ),
    },
    { menuDiario: files.menuDiario.replace("alfajor,Alfajores", ",Alfajores") },
    { menuDiario: files.menuDiario.replace('"4.500,50"', "4500.1234") },
    { postres: undefined },
    { menuDiario: "invalid,headers\nfoo,bar" },
  ])
    assert.throws(() => normalizeSnapshot({ ...files, ...changes }));
  assert.ok(Object.keys(definitions).every((k) => Array.isArray(datasets[k])));
});
test("SQL se separa conservando funciones y literales", () => {
  assert.deepEqual(
    splitSQL(
      "BEGIN; select 'a;b'; -- comment\n DO $$ BEGIN PERFORM 1; END $$; COMMIT;",
    ),
    ["select 'a;b'", "DO $$ BEGIN PERFORM 1; END $$"],
  );
});

test("los formularios no redondean entradas de más de dos decimales ni aceptan formas malformadas", () => {
  assert.equal(moneyInputToCents("1234.56"), 123456);
  assert.ok(Number.isNaN(moneyInputToCents("1234.567")));
  assert.equal(moneyInputToCents("1.10"), 110);
  assert.equal(moneyInputToCents(""), null);
  const c = demoSeed(),
    p = c.products[0];
  for (const bad of [
    { id: "torta-personalizada" },
    { images: [null] },
    { images: [false] },
  ])
    assert.throws(
      () => validateProduct({ ...p, ...bad }, c, { existing: p }),
      (e) => e.name === "ValidationError",
    );
  const postre = c.products.find((p) => p.kind === "postre");
  assert.throws(
    () =>
      validateProduct({ ...postre, variants: [null] }, c, { existing: postre }),
    (e) => e.name === "ValidationError",
  );
  assert.throws(
    () => validateCategory(null, c.categories),
    (e) => e.name === "ValidationError",
  );
  assert.throws(
    () =>
      validateCategory(
        { id: "x", name: 3, parentId: null, order: 1, active: true },
        c.categories,
      ),
    (e) => e.name === "ValidationError",
  );
});

test("Cloudinary entrega imágenes responsivas con tamaño, calidad y formato automáticos", () => {
  const original =
    "https://res.cloudinary.com/flor/image/upload/v7/catalogo/alfajor.jpg";
  assert.equal(
    getDisplayImageUrl(original, { width: 720, quality: "good" }),
    "https://res.cloudinary.com/flor/image/upload/c_limit,w_720/q_auto:good/f_auto/v7/catalogo/alfajor.jpg",
  );
  assert.equal(
    getDisplayImageUrl(
      "https://res.cloudinary.com/flor/image/upload/f_auto,q_auto:eco,w_300,c_limit/v7/catalogo/alfajor.jpg",
      { width: 960, quality: "best" },
    ),
    "https://res.cloudinary.com/flor/image/upload/c_limit,w_960/q_auto:best/f_auto/v7/catalogo/alfajor.jpg",
  );
  const srcSet = getResponsiveImageSrcSet(original, [960, 320, 720, 320], {
    quality: "good",
  });
  assert.match(srcSet, /c_limit,w_320\/q_auto:good\/f_auto\/.* 320w/);
  assert.match(srcSet, /c_limit,w_720\/q_auto:good\/f_auto\/.* 720w/);
  assert.match(srcSet, /c_limit,w_960\/q_auto:good\/f_auto\/.* 960w/);
  assert.equal(
    getDisplayImageUrl("https://example.com/foto.jpg"),
    "https://example.com/foto.jpg",
  );
  assert.equal(
    getResponsiveImageSrcSet("https://example.com/foto.jpg", [320]),
    "",
  );
});
