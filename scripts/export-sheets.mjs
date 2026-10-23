import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const sources = {
  menuDiario: "VITE_SHEET_MENU_URL",
  sinTacc: "VITE_SHEET_SIN_TACC_URL",
  postres: "VITE_SHEET_POSTRES_URL",
  postresTamanos: "VITE_SHEET_POSTRES_TAMANOS_URL",
  postresConfig: "VITE_SHEET_POSTRES_CONFIG_URL",
  campaigns: "VITE_SHEET_CAMPANAS_URL",
  specialProducts: "VITE_SHEET_ESPECIALES_URL",
  tortaTamanos: "VITE_SHEET_TORTAS_TAMANOS_URL",
  tortaCoberturas: "VITE_SHEET_TORTAS_COBERTURAS_URL",
  tortaRellenos: "VITE_SHEET_TORTAS_RELLENOS_URL",
  tortaExtras: "VITE_SHEET_TORTAS_EXTRAS_URL",
};

const output = resolve(process.argv[2] || ".local/sheets-snapshot");

try {
  await mkdir(output, { recursive: false });
  const counts = {};
  for (const [dataset, key] of Object.entries(sources)) {
    let url;
    try {
      url = new URL(process.env[key]);
    } catch {
      throw new Error(`Falta configurar ${key}.`);
    }
    if (
      url.protocol !== "https:" ||
      !["docs.google.com", "drive.google.com"].includes(url.hostname)
    )
      throw new Error(`${key} no apunta a una URL HTTPS de Google Sheets.`);

    const response = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(`No se pudo descargar ${dataset} (${response.status}).`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length || bytes.length > 5 * 1024 * 1024)
      throw new Error(`${dataset} tiene un tamaño inesperado.`);
    const preview = bytes.subarray(0, 300).toString("utf8").toLowerCase();
    if (preview.includes("<!doctype html") || preview.includes("<html"))
      throw new Error(`${dataset} devolvió HTML en lugar de CSV.`);
    await writeFile(join(output, `${dataset}.csv`), bytes, { flag: "wx" });
    counts[dataset] = bytes.toString("utf8").split(/\r?\n/).filter(Boolean).length;
  }
  console.log(
    JSON.stringify(
      {
        status: "Respaldo local descargado; Google Sheets no fue modificado.",
        output,
        csvLineCounts: counts,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
