import { test, expect } from "@playwright/test";
const image = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6eLkAAAAASUVORK5CYII=",
  "base64",
);
test.beforeEach(async ({ context }) => {
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    return ["127.0.0.1", "localhost"].includes(u.hostname)
      ? route.continue()
      : route.abort();
  });
});
async function demo(page) {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Qué lindo verte por acá" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Entrar a la demostración", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Hola, Flor de Postre" }),
  ).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Administración" });
  await expect(
    navigation.getByRole("button", { name: "Categorías", exact: true }),
  ).toBeVisible();
  await expect(
    navigation.getByRole("button", { name: "Fotos", exact: true }),
  ).toHaveCount(0);
}
async function products(page) {
  await page
    .getByRole("navigation", { name: "Administración" })
    .getByRole("button", { name: "Productos", exact: true })
    .click();
}
async function fillProduct(page, name) {
  await page
    .getByRole("button", { name: "Nuevo producto", exact: true })
    .click();
  const dialog = page.getByRole("region", { name: "Un nuevo producto" });
  await dialog.getByLabel("Nombre del producto", { exact: true }).fill(name);
  await dialog
    .getByLabel("Precio en pesos (ARS)", { exact: true })
    .fill("1234.50");
  await expect(dialog.getByLabel("Stock", { exact: false })).toHaveCount(0);
  return dialog;
}
test("demo CRUD, errores, búsqueda, filtros, archivo y recuperación", async ({
  page,
}) => {
  await demo(page);
  await products(page);
  let dialog = await fillProduct(page, "Prueba dulce única");
  await dialog.getByLabel("Producto activo", { exact: true }).check();
  await expect(
    dialog.getByRole("heading", { name: "Vista previa", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Prueba dulce única" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Buscar productos" })
    .fill("prueba dulce unica");
  await expect(
    page.getByLabel("Listado de productos").getByRole("article"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Editar Prueba dulce única", exact: true })
    .click();
  dialog = page.getByRole("region", { name: "Editar producto" });
  await dialog.getByLabel("Precio en pesos (ARS)", { exact: true }).fill("-10");
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await expect(
    dialog
      .getByRole("alert")
      .filter({ hasText: "Indicá un precio mayor a cero" }),
  ).toBeVisible();
  await dialog
    .getByLabel("Precio en pesos (ARS)", { exact: true })
    .fill("2000.123");
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await expect(
    dialog
      .getByRole("alert")
      .filter({ hasText: "Indicá un precio mayor a cero" }),
  ).toBeVisible();
  await dialog
    .getByLabel("Precio en pesos (ARS)", { exact: true })
    .fill("2000");
  await dialog.getByLabel("Producto activo", { exact: true }).uncheck();
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await page.getByLabel("Filtrar estado").selectOption("inactive");
  await expect(
    page.getByLabel("Listado de productos").getByRole("article"),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Editar Prueba dulce única", exact: true })
    .click();
  dialog = page.getByRole("region", { name: "Editar producto" });
  await dialog.getByRole("button", { name: "Archivar", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Archivar este producto" })
    .getByRole("button", { name: "Confirmar y seguir editando" })
    .click();
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await expect(
    page.getByText("No encontramos productos", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Filtrar estado").selectOption("archived");
  await page
    .getByRole("button", { name: "Editar Prueba dulce única", exact: true })
    .click();
  dialog = page.getByRole("region", { name: "Editar producto" });
  await dialog.getByRole("button", { name: "Recuperar", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Recuperar este producto" })
    .getByRole("button", { name: "Confirmar y seguir editando" })
    .click();
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await page.getByLabel("Filtrar estado").selectOption("inactive");
  await expect(
    page.getByLabel("Listado de productos").getByRole("article"),
  ).toHaveCount(1);
  await page.reload();
  await page
    .getByRole("button", { name: "Entrar a la demostración", exact: true })
    .click();
  await products(page);
  await page
    .getByRole("textbox", { name: "Buscar productos" })
    .fill("Prueba dulce única");
  await expect(
    page.getByLabel("Listado de productos").getByRole("article"),
  ).toHaveCount(1);
});
test("fotos se previsualizan, reordenan, reemplazan y desvinculan sin tráfico externo", async ({
  page,
}) => {
  await demo(page);
  await products(page);
  const dialog = await fillProduct(page, "Prueba de fotos");
  await dialog.getByLabel("Subir fotografías").setInputFiles([
    { name: "foto1.png", mimeType: "image/png", buffer: image },
    { name: "foto2.png", mimeType: "image/png", buffer: image },
  ]);
  await expect(
    dialog.getByText("Foto principal", { exact: true }),
  ).toBeVisible();
  await expect(dialog.locator(".a-image-card")).toHaveCount(2);
  await dialog.getByRole("button", { name: "Mover foto 2 antes" }).click();
  await dialog.getByLabel("Texto alternativo foto 1").fill("Mi foto principal");
  await dialog.getByLabel("Reemplazar foto 2").setInputFiles({
    name: "reemplazo.png",
    mimeType: "image/png",
    buffer: image,
  });
  await expect(dialog.locator(".a-image-card")).toHaveCount(2);
  await dialog.getByRole("button", { name: "Quitar foto 2" }).click();
  await expect(dialog.locator(".a-image-card")).toHaveCount(1);
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Buscar productos" })
    .fill("Prueba de fotos");
  await page
    .getByRole("button", { name: "Editar Prueba de fotos", exact: true })
    .click();
  await expect(page.getByLabel("Texto alternativo foto 1")).toHaveValue(
    "Mi foto principal",
  );
});
test("productos y secciones siempre abren desde el comienzo", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 500 });
  await demo(page);
  await products(page);
  const edit = page.getByRole("button", { name: /^Editar / }).last();
  await edit.scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await edit.click();
  await expect(
    page.getByRole("region", { name: "Editar producto" }),
  ).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole("button", { name: "Volver a productos" }).click();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page
    .getByRole("navigation", { name: "Administración" })
    .getByRole("button", { name: "Categorías", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Categorías" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
test("productos y resúmenes responden suavemente al puntero", async ({
  page,
}) => {
  await demo(page);
  const stat = page.getByRole("button", { name: /Productos activos/ });
  const statBefore = await stat.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await stat.hover();
  await expect
    .poll(() =>
      stat.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .not.toBe(statBefore);
  await products(page);
  const row = page
    .getByLabel("Listado de productos")
    .getByRole("article")
    .first();
  const rowBefore = await row.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  await row.hover();
  await expect
    .poll(() =>
      row.evaluate((element) => getComputedStyle(element).backgroundColor),
    )
    .not.toBe(rowBefore);
});
test("postres exigen tamaños y precios válidos; los IDs técnicos permanecen ocultos", async ({
  page,
}) => {
  await demo(page);
  await products(page);
  const dialog = await fillProduct(page, "Postre de prueba");
  await dialog.getByLabel("Tipo de producto").selectOption("postre");
  await dialog.getByLabel("Producto activo", { exact: true }).check();
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await expect(
    dialog.getByText(
      "Agregá al menos un tamaño activo antes de activar este postre.",
      { exact: true },
    ),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Agregar tamaño" }).click();
  await dialog.getByLabel("Tamaño 1", { exact: true }).selectOption("demo-18");
  await dialog
    .getByLabel("Precio del tamaño 1 (ARS)", { exact: true })
    .fill("35000");
  await expect(dialog.getByLabel("ID permanente", { exact: true })).toHaveCount(
    0,
  );
  await dialog.getByRole("button", { name: "Guardar en demo" }).click();
  await expect(dialog).toHaveCount(0);
});
test("categorías y subcategorías funcionan en demo", async ({ page }) => {
  await demo(page);
  await page
    .getByRole("navigation", { name: "Administración" })
    .getByRole("button", { name: "Categorías", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Nueva categoría", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Nueva categoría" });
  await dialog.getByLabel("Nombre de categoría").fill("Sabores de prueba");
  await dialog.getByLabel("Categoría principal").selectOption("alfajores");
  await dialog.getByRole("button", { name: "Guardar categoría" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Sabores de prueba" }),
  ).toBeVisible();
});
for (const width of [320, 390, 768, 1440])
  test(`panel responsive a ${width}px, sin desbordamiento`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await demo(page);
    await page.screenshot({
      path: `review/admin/home-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await products(page);
    await expect(
      page.getByRole("heading", { name: "Mis productos" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `review/admin/products-${width}.png`,
      fullPage: width === 1440 ? false : true,
    });
    const dialog = await fillProduct(page, "Producto móvil");
    expect(
      await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.screenshot({
      path: `review/admin/editor-${width}.png`,
      fullPage: false,
    });
  });
test("build de producción permanece cerrado aunque la demo se intente habilitar", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:4191/admin");
  await expect(
    page.getByRole("heading", { name: "Qué lindo verte por acá" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar a la demostración", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Ingresar al administrador",
      exact: true,
    }),
  ).toBeDisabled();
  await page.screenshot({
    path: "review/admin/login-production.png",
    fullPage: true,
  });
});
test("web pública mantiene rutas, catálogo local y pedido sin cargar el administrador", async ({
  page,
}) => {
  const adminAssets = [];
  page.on("request", (req) => {
    if (req.url().includes("AdminApp")) adminAssets.push(req.url());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Flor de Postre", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar a la demostración" }),
  ).toHaveCount(0);
  expect(adminAssets).toHaveLength(0);
  await page
    .getByRole("button", { name: "Menú principal", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Menú principal" })
    .getByRole("link", { name: "Postres", exact: true })
    .click();
  await expect(page).toHaveURL(/\/postres/);
  await expect(
    page.getByRole("heading", { name: "Los clásicos que nunca fallan" }),
  ).toBeVisible();
});

test("regresión contra versión estable: rutas, catálogo, carrito, WhatsApp y tortas", async ({
  context,
}) => {
  const current = await context.newPage(),
    baseline = await context.newPage();
  const errors = [];
  current.on("pageerror", (e) => errors.push(e.message));
  for (const route of [
    "/",
    "/postres",
    "/tortas-personalizadas",
    "/como-pedir",
    "/pedido",
  ]) {
    await Promise.all([
      current.goto(`http://127.0.0.1:4191${route}`),
      baseline.goto(`http://127.0.0.1:4192${route}`),
    ]);
    await Promise.all([
      expect(current.locator("main")).toBeVisible(),
      expect(baseline.locator("main")).toBeVisible(),
    ]);
    const text = async (page) => {
      const content = await page.locator(".site-shell").innerText();
      if (route !== "/") return content;
      // El único cambio público autorizado es mover Sin TACC al final.
      const categories = await page.locator(".category-filter").innerText();
      return content.replace(categories, "[filtros de categorías]");
    };
    if (route === "/") {
      await Promise.all([
        expect(current.locator(".product-card").first()).toBeVisible(),
        expect(baseline.locator(".product-card").first()).toBeVisible(),
      ]);
      await expect(current.locator(".category-filter button")).toHaveText([
        "Todos",
        "Alfajores",
        "Cookies",
        "Budines",
        "Lingotes",
        "Mini tartas",
        "Otros dulces",
        "Salado",
        "Bandejas",
        "Sin TACC",
      ]);
    }
    expect(await text(current)).toBe(await text(baseline));
    if (route === "/tortas-personalizadas") {
      await Promise.all([
        current.getByRole("button", { name: "Diseñar mi torta" }).click(),
        baseline.getByRole("button", { name: "Diseñar mi torta" }).click(),
      ]);
      expect(await current.locator("body").innerText()).toBe(
        await baseline.locator("body").innerText(),
      );
    }
  }
  // Navegar dentro de cada SPA conserva el carrito en memoria.
  for (const page of [current, baseline]) {
    await page.goto(
      page === current ? "http://127.0.0.1:4191" : "http://127.0.0.1:4192",
    );
    const card = page
      .locator(".product-card")
      .filter({
        has: page.getByRole("heading", {
          name: "Alfajor santafesino",
          exact: true,
        }),
      })
      .first();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Agregar", exact: true }).click();
    await expect(
      page.getByRole("dialog", { name: "Carrito de compras" }),
    ).toBeVisible();
  }
  const publicCart = async (page) =>
    page.getByRole("dialog", { name: "Carrito de compras" }).innerText();
  expect(await publicCart(current)).toBe(await publicCart(baseline));
  const wa = async (page) =>
    page
      .getByRole("dialog", { name: "Carrito de compras" })
      .locator('a[href*="wa.me"]')
      .getAttribute("href");
  expect(await wa(current)).toBe(await wa(baseline));
  expect(errors).toEqual([]);
  await current.close();
  await baseline.close();
});
