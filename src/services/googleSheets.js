const FALSE_VALUES = new Set(["false", "no", "0", "agotado", "no disponible", "reservado"]);
const TRUE_VALUES = new Set(["true", "si", "sí", "1", "x", "destacado", "sin tacc", "disponible"]);

const normalizeHeader = (value) => value.trim().toLowerCase();

const normalizeText = (value) => String(value ?? "").trim();

const normalizeKey = (value) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

const slugify = (value) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseNumber = (value) => {
  const rawValue = normalizeText(value);
  if (!rawValue) return null;

  const cleaned = rawValue.replace(/[^\d,.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === "," || cleaned === ".") return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;

  if (lastComma > -1 && lastDot > -1) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = cleaned
      .replace(new RegExp(`\\${thousandsSeparator}`, "g"), "")
      .replace(decimalSeparator, ".");
  } else if (lastComma > -1) {
    const parts = cleaned.split(",");
    normalized = parts.length > 2 || parts.at(-1)?.length === 3 ? parts.join("") : cleaned.replace(",", ".");
  } else if (lastDot > -1) {
    const parts = cleaned.split(".");
    normalized = parts.length > 2 || parts.at(-1)?.length === 3 ? parts.join("") : cleaned;
  } else {
    normalized = cleaned;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
};

const parseBoolean = (value, defaultValue = false) => {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return defaultValue;
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return defaultValue;
};

const parseAvailability = (value) => !FALSE_VALUES.has(normalizeText(value).toLowerCase());

const parseStock = (value) => {
  const stock = parseNumber(value);
  return stock === null ? null : stock;
};

const REQUIRED_DAILY_HEADERS = [
  "ID interno (no tocar)",
  "Categoría",
  "Producto",
  "Descripción",
  "Precio"
].map(normalizeKey);

const REQUIRED_SIN_TACC_HEADERS = [
  "ID interno (no tocar)",
  "Producto",
  "Descripción",
  "Precio",
  "Imagen"
].map(normalizeKey);

const REQUIRED_POSTRES_HEADERS = [
  "ID interno (no tocar)",
  "Postre",
  "Descripción"
].map(normalizeKey);

const REQUIRED_POSTRES_SIZE_HEADERS = [
  "ID interno (no tocar)",
  "Tamaño",
  "Porciones",
  "Precio estimado"
].map(normalizeKey);

const REQUIRED_POSTRES_CONFIG_HEADERS = [
  "ID postre",
  "ID Tamaño",
  "Precio"
].map(normalizeKey);

const REQUIRED_CAMPAIGN_HEADERS = [
  "Activa",
  "Evento",
  "Fecha inicio",
  "Fecha fin",
  "Banner / texto corto",
  "Título visible"
].map(normalizeKey);

const REQUIRED_SPECIAL_HEADERS = [
  "Activo",
  "Evento",
  "ID interno (no tocar)",
  "Producto",
  "Descripción",
  "Precio"
].map(normalizeKey);

const REQUIRED_TORTA_SIZE_HEADERS = [
  "ID interno (no tocar)",
  "Tamaño",
  "Porciones"
].map(normalizeKey);

const TORTA_COBERTURA_HEADER_GROUPS = [
  ["ID interno (no tocar)"],
  ["Cobertura", "Nombre", "Opción"]
].map((group) => group.map(normalizeKey));

const TORTA_RELLENO_HEADER_GROUPS = [
  ["ID interno (no tocar)"],
  ["Relleno", "Nombre", "Opción"]
].map((group) => group.map(normalizeKey));

const TORTA_EXTRA_HEADER_GROUPS = [
  ["ID interno (no tocar)"],
  ["Extra", "Nombre", "Opción"]
].map((group) => group.map(normalizeKey));

const getCell = (row, ...keys) => {
  const normalizedRow = Object.entries(row).reduce((items, [key, value]) => {
    items[normalizeKey(key)] = value;
    return items;
  }, {});

  return keys.map(normalizeKey).map((key) => normalizedRow[key]).find((value) => value !== undefined);
};

export const parseCsv = (csvText) => {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i += 1;
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += char;
  }

  if (currentField || currentRow.length) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
};

export const csvToObjects = (csvText, requiredHeaders = REQUIRED_DAILY_HEADERS) => {
  const rows = parseCsv(csvText).filter((row) => row.some((field) => normalizeText(field)));
  if (rows.length < 2) return [];

  const headerIndex = rows.findIndex((row) => {
    const normalizedHeaders = row.map(normalizeKey);
    return requiredHeaders.every((header) => normalizedHeaders.includes(header));
  });

  if (headerIndex === -1 || headerIndex === rows.length - 1) return [];

  const headers = rows[headerIndex].map(normalizeHeader);

  return rows.slice(headerIndex + 1).map((row) =>
    headers.reduce((item, header, index) => {
      if (!header) return item;
      return {
        ...item,
        [header]: normalizeText(row[index])
      };
    }, {})
  );
};

const csvToObjectsByHeaderGroups = (csvText, headerGroups) => {
  const rows = parseCsv(csvText).filter((row) => row.some((field) => normalizeText(field)));
  if (rows.length < 2) return [];

  const headerIndex = rows.findIndex((row) => {
    const normalizedHeaders = row.map(normalizeKey);
    return headerGroups.every((group) => group.some((header) => normalizedHeaders.includes(header)));
  });

  if (headerIndex === -1 || headerIndex === rows.length - 1) return [];

  const headers = rows[headerIndex].map(normalizeHeader);

  return rows.slice(headerIndex + 1).map((row) =>
    headers.reduce((item, header, index) => {
      if (!header) return item;
      return {
        ...item,
        [header]: normalizeText(row[index])
      };
    }, {})
  );
};

export const normalizeDailyProduct = (row) => {
  const nombre = normalizeText(getCell(row, "Producto", "nombre"));
  const precio = parseNumber(getCell(row, "Precio", "precio"));
  const categoria = normalizeText(getCell(row, "Categoría", "categoria"));
  const sinTacc = parseBoolean(getCell(row, "Sin TACC", "sintacc", "sin_tacc")) || categoria.toLowerCase() === "sin tacc";

  if (!nombre || precio === null || !categoria) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    descripcion: normalizeText(getCell(row, "Descripción", "descripcion")),
    precio,
    categoria,
    imagen: normalizeText(getCell(row, "Imagen", "imagen")),
    disponible: parseAvailability(getCell(row, "Disponible", "disponible", "Estado", "estado")),
    stock: parseStock(getCell(row, "Stock", "stock")),
    reservado: parseBoolean(getCell(row, "Reservado", "reservado")),
    destacado: parseBoolean(getCell(row, "Destacado", "destacado")),
    sinTacc,
    esLimitado: parseBoolean(getCell(row, "esLimitado", "es limitado", "es_limitado")),
    etiqueta: normalizeText(getCell(row, "Etiqueta", "etiqueta")),
    precioAnterior: parseNumber(getCell(row, "Precio anterior", "precioAnterior", "precio_anterior")),
    precioOferta: parseNumber(getCell(row, "Precio oferta", "precioOferta", "precio_oferta")),
    tipoOferta: normalizeText(getCell(row, "Tipo oferta", "tipoOferta", "tipo_oferta")),
    fechaInicio: normalizeText(getCell(row, "Fecha inicio", "fechaInicio", "fecha_inicio")) || null,
    fechaFin: normalizeText(getCell(row, "Fecha fin", "fechaFin", "fecha_fin")) || null
  };
};

export const normalizeSinTaccProduct = (row) => {
  const nombre = normalizeText(getCell(row, "Producto", "nombre"));
  const precio = parseNumber(getCell(row, "Precio", "precio"));

  if (!nombre || precio === null) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    descripcion: normalizeText(getCell(row, "Descripción", "descripcion")),
    precio,
    categoria: "Sin TACC",
    imagen: normalizeText(getCell(row, "Imagen", "imagen")),
    disponible: parseAvailability(getCell(row, "Disponible", "disponible", "Estado", "estado")),
    stock: parseStock(getCell(row, "Stock", "stock")),
    reservado: parseBoolean(getCell(row, "Reservado", "reservado")),
    destacado: false,
    sinTacc: true,
    esLimitado: false,
    etiqueta: "",
    precioAnterior: null,
    precioOferta: null,
    tipoOferta: "",
    fechaInicio: null,
    fechaFin: null
  };
};

export const normalizePostre = (row) => {
  const nombre = normalizeText(getCell(row, "Postre", "Producto", "nombre"));

  if (!nombre) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    descripcion: normalizeText(getCell(row, "Descripción", "descripcion")),
    imagen: normalizeText(getCell(row, "Imagen", "imagen")),
    disponible: parseBoolean(getCell(row, "Disponible", "disponible", "Estado", "estado"), true),
    destacado: parseBoolean(getCell(row, "Destacado", "destacado")),
    etiqueta: normalizeText(getCell(row, "Etiqueta", "etiqueta")),
    notas: normalizeText(getCell(row, "Notas", "notas"))
  };
};

export const normalizePostreTamano = (row) => {
  const nombre = normalizeText(getCell(row, "Tamaño", "Tamano", "Nombre", "nombre"));
  const precioEstimado = parseNumber(getCell(row, "Precio estimado", "Precio", "precioEstimado"));

  if (!nombre) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    porciones: normalizeText(getCell(row, "Porciones", "porciones")),
    precioEstimado,
    disponible: parseBoolean(getCell(row, "Disponible", "disponible", "Estado", "estado"), true),
    notas: normalizeText(getCell(row, "Notas", "notas"))
  };
};

export const normalizePostreConfig = (row) => {
  const postreId = normalizeText(getCell(row, "ID postre", "postreId", "idPostre"));
  const sizeId = normalizeText(getCell(row, "ID Tamaño", "ID Tamano", "sizeId", "idTamano"));
  const precio = parseNumber(getCell(row, "Precio", "precio"));

  if (!postreId || !sizeId || precio === null) return null;

  return {
    postreId,
    sizeId,
    precio,
    disponible: parseBoolean(getCell(row, "Disponible", "disponible"), true)
  };
};

export const normalizeCampaign = (row) => {
  const evento = normalizeText(getCell(row, "Evento", "evento"));
  if (!evento) return null;

  const activa = parseBoolean(getCell(row, "Activa", "activa"));
  const bannerText = normalizeText(getCell(row, "Banner / texto corto", "bannerText", "banner_text"));
  const titulo = normalizeText(getCell(row, "Título visible", "titulo", "título")) || evento;
  const descripcion = normalizeText(getCell(row, "Descripción", "descripcion")) || bannerText;
  const color = normalizeText(getCell(row, "Color sugerido", "color"));
  const decoracion = normalizeText(getCell(row, "Decoración", "decoracion"));

  return {
    id: slugify(evento),
    activa,
    active: activa,
    evento,
    fechaInicio: normalizeText(getCell(row, "Fecha inicio", "fechaInicio", "fecha_inicio")) || null,
    fechaFin: normalizeText(getCell(row, "Fecha fin", "fechaFin", "fecha_fin")) || null,
    bannerText,
    titulo,
    descripcion,
    color,
    decoracion,
    notas: normalizeText(getCell(row, "Notas", "notas")),
    textoBoton: "",
    linkBoton: "",
    temaVisual: color ? slugify(color) : "rose",
    productosEspeciales: []
  };
};

export const normalizeSpecialProduct = (row) => {
  const nombre = normalizeText(getCell(row, "Producto", "nombre"));
  const precio = parseNumber(getCell(row, "Precio", "precio"));

  if (!nombre || precio === null) return null;

  return {
    activo: parseBoolean(getCell(row, "Activo", "activo")),
    evento: normalizeText(getCell(row, "Evento", "evento")),
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    descripcion: normalizeText(getCell(row, "Descripción", "descripcion")),
    precio,
    categoria: "Especial",
    imagen: normalizeText(getCell(row, "Imagen", "imagen")),
    disponible: parseBoolean(getCell(row, "Disponible", "disponible", "Estado", "estado"), true),
    stock: parseStock(getCell(row, "Stock", "stock")),
    reservado: parseBoolean(getCell(row, "Reservado", "reservado")),
    destacado: false,
    sinTacc: false,
    esLimitado: true,
    etiqueta: normalizeText(getCell(row, "Etiqueta", "etiqueta")),
    precioAnterior: null,
    precioOferta: null,
    tipoOferta: "",
    fechaInicio: normalizeText(getCell(row, "Fecha inicio", "fechaInicio", "fecha_inicio")) || null,
    fechaFin: normalizeText(getCell(row, "Fecha fin", "fechaFin", "fecha_fin")) || null,
    notas: normalizeText(getCell(row, "Notas", "notas"))
  };
};

export const normalizeTortaTamano = (row) => {
  const nombre = normalizeText(getCell(row, "Tamaño", "Tamano", "Nombre", "nombre"));
  const precioBaseEstimado = parseNumber(
    getCell(row, "Precio", "Precio base", "Precio base estimado", "precioBaseEstimado")
  );

  if (!nombre || precioBaseEstimado === null) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    porciones: normalizeText(getCell(row, "Porciones", "porciones")),
    precioBaseEstimado,
    disponible: parseBoolean(getCell(row, "Disponible", "disponible"), true)
  };
};

export const normalizeTortaCobertura = (row) => {
  const nombre = normalizeText(getCell(row, "Cobertura", "Nombre", "Opción", "Opcion", "nombre"));
  const precio = parseNumber(getCell(row, "Precio", "Precio extra", "precio"));

  if (!nombre) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    descripcion: normalizeText(getCell(row, "Descripción", "descripcion")),
    precio: precio ?? 0,
    disponible: parseBoolean(getCell(row, "Disponible", "disponible"), true),
    etiqueta: normalizeText(getCell(row, "Etiqueta", "etiqueta"))
  };
};

export const normalizeTortaRelleno = (row) => {
  const nombre = normalizeText(getCell(row, "Relleno", "Nombre", "Opción", "Opcion", "nombre"));
  const precioExtra = parseNumber(getCell(row, "Precio", "Precio extra", "precio"));

  if (!nombre) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    descripcion: normalizeText(getCell(row, "Descripción", "descripcion")),
    precioExtra: precioExtra ?? 0,
    disponible: parseBoolean(getCell(row, "Disponible", "disponible"), true),
    etiqueta: normalizeText(getCell(row, "Etiqueta", "etiqueta"))
  };
};

export const normalizeTortaExtra = (row) => {
  const nombre = normalizeText(getCell(row, "Extra", "Nombre", "Opción", "Opcion", "nombre"));
  const precioExtra = parseNumber(getCell(row, "Precio", "Precio extra", "precio"));

  if (!nombre) return null;

  return {
    id: normalizeText(getCell(row, "ID interno (no tocar)", "id")) || slugify(nombre),
    nombre,
    descripcion: normalizeText(getCell(row, "Descripción", "descripcion")),
    precioExtra: precioExtra ?? 0,
    disponible: parseBoolean(getCell(row, "Disponible", "disponible"), true),
    etiqueta: normalizeText(getCell(row, "Etiqueta", "etiqueta"))
  };
};

export const fetchCsv = async (url) => {
  const response = await fetch(url);
  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] Fetch status: ${response.status}`);
  }

  if (!response.ok) {
    throw new Error(`No se pudo cargar Google Sheets (${response.status})`);
  }
  return response.text();
};

export const fetchDailyProductsFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_MENU_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_MENU_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const rows = parseCsv(csvText);
  const objects = csvToObjects(csvText);
  const products = objects.map(normalizeDailyProduct).filter(Boolean);

  if (import.meta.env.DEV) {
    console.info("[Google Sheets] CSV recibido (primeros 200 caracteres):", csvText.slice(0, 200));
    console.info(`[Google Sheets] Filas parseadas: ${rows.length}`);
    console.info(`[Google Sheets] Productos válidos: ${products.length}`);
    console.info("[Google Sheets] Primer producto normalizado:", products[0] || null);
  }

  if (import.meta.env.DEV && products.length > 0) {
    console.info(`[Google Sheets] Menú diario cargado: ${products.length} productos.`);
  }

  return products;
};

export const fetchSinTaccProductsFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_SIN_TACC_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_SIN_TACC_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const rows = parseCsv(csvText);
  const objects = csvToObjects(csvText, REQUIRED_SIN_TACC_HEADERS);
  const products = objects.map(normalizeSinTaccProduct).filter(Boolean);

  if (import.meta.env.DEV) {
    console.info("[Google Sheets] Sin TACC CSV recibido (primeros 200 caracteres):", csvText.slice(0, 200));
    console.info(`[Google Sheets] Sin TACC filas parseadas: ${rows.length}`);
    console.info(`[Google Sheets] Sin TACC productos válidos: ${products.length}`);
    console.info("[Google Sheets] Sin TACC primer producto normalizado:", products[0] || null);
  }

  if (import.meta.env.DEV && products.length > 0) {
    console.info(`[Google Sheets] Sin TACC cargado: ${products.length} productos.`);
  }

  return products;
};

export const fetchPostresFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_POSTRES_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_POSTRES_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const rows = parseCsv(csvText);
  const objects = csvToObjects(csvText, REQUIRED_POSTRES_HEADERS);
  const postres = objects.map(normalizePostre).filter(Boolean);

  if (import.meta.env.DEV) {
    console.info("[Google Sheets] Postres CSV recibido (primeros 200 caracteres):", csvText.slice(0, 200));
    console.info(`[Google Sheets] Postres filas parseadas: ${rows.length}`);
    console.info(`[Google Sheets] Postres válidos: ${postres.length}`);
    console.info("[Google Sheets] Postres primer item normalizado:", postres[0] || null);
  }

  if (import.meta.env.DEV && postres.length > 0) {
    console.info(`[Google Sheets] postres cargados: ${postres.length}`);
  }

  return postres;
};

export const fetchPostresTamanosFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_POSTRES_TAMANOS_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_POSTRES_TAMANOS_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjects(csvText, REQUIRED_POSTRES_SIZE_HEADERS);
  const tamanos = objects
    .map(normalizePostreTamano)
    .filter((tamano) => tamano && tamano.disponible !== false);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] tamaños postres cargados: ${tamanos.length}`);
  }

  return tamanos;
};

export const fetchPostresConfigFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_POSTRES_CONFIG_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_POSTRES_CONFIG_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjects(csvText, REQUIRED_POSTRES_CONFIG_HEADERS);
  const configs = objects
    .map(normalizePostreConfig)
    .filter((config) => config && config.disponible !== false);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] configuraciones postres cargadas: ${configs.length}`);
  }

  return configs;
};

export const fetchCampaignsFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_CAMPANAS_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_CAMPANAS_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjects(csvText, REQUIRED_CAMPAIGN_HEADERS);
  const sheetCampaigns = objects.map(normalizeCampaign).filter(Boolean);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] campañas cargadas: ${sheetCampaigns.length}`);
  }

  return sheetCampaigns;
};

export const fetchSpecialProductsFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_ESPECIALES_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_ESPECIALES_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjects(csvText, REQUIRED_SPECIAL_HEADERS);
  const products = objects.map(normalizeSpecialProduct).filter(Boolean);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] productos especiales cargados: ${products.length}`);
  }

  return products;
};

export const fetchTortaTamanosFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_TORTAS_TAMANOS_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_TORTAS_TAMANOS_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjects(csvText, REQUIRED_TORTA_SIZE_HEADERS);
  const tamanos = objects
    .map(normalizeTortaTamano)
    .filter((tamano) => tamano && tamano.disponible !== false);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] tamaños de torta cargados: ${tamanos.length}`);
  }

  return tamanos;
};

export const fetchTortaCoberturasFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_TORTAS_COBERTURAS_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_TORTAS_COBERTURAS_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjectsByHeaderGroups(csvText, TORTA_COBERTURA_HEADER_GROUPS);
  const coberturas = objects
    .map(normalizeTortaCobertura)
    .filter((cobertura) => cobertura && cobertura.disponible !== false);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] coberturas cargadas: ${coberturas.length}`);
  }

  return coberturas;
};

export const fetchTortaRellenosFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_TORTAS_RELLENOS_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_TORTAS_RELLENOS_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjectsByHeaderGroups(csvText, TORTA_RELLENO_HEADER_GROUPS);
  const rellenos = objects
    .map(normalizeTortaRelleno)
    .filter((relleno) => relleno && relleno.disponible !== false);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] rellenos cargados: ${rellenos.length}`);
  }

  return rellenos;
};

export const fetchTortaExtrasFromSheet = async () => {
  const url = import.meta.env.VITE_SHEET_TORTAS_EXTRAS_URL;
  if (import.meta.env.DEV) {
    console.info("[Google Sheets] VITE_SHEET_TORTAS_EXTRAS_URL:", url);
  }

  if (!url) return [];

  const csvText = await fetchCsv(url);
  const objects = csvToObjectsByHeaderGroups(csvText, TORTA_EXTRA_HEADER_GROUPS);
  const extras = objects
    .map(normalizeTortaExtra)
    .filter((extra) => extra && extra.disponible !== false);

  if (import.meta.env.DEV) {
    console.info(`[Google Sheets] extras cargados: ${extras.length}`);
  }

  return extras;
};
