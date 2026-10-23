import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { definitions, normalizeSnapshot } from "./catalog-import.js";
const [input, output = ".local/prepared"] = process.argv.slice(2);
if (!input) {
  console.error(
    "Uso: npm run admin:prepare-import -- carpeta-de-csv [carpeta-de-salida-nueva]",
  );
  process.exit(1);
}
try {
  const files = {},
    manifest = { version: 1, createdAt: new Date().toISOString(), files: {} };
  for (const name of Object.keys(definitions)) {
    const data = await readFile(join(resolve(input), `${name}.csv`));
    files[name] = data.toString("utf8");
    manifest.files[name] = {
      sha256: createHash("sha256").update(data).digest("hex"),
      bytes: data.length,
    };
  }
  const prepared = normalizeSnapshot(files);
  manifest.counts = Object.fromEntries(
    Object.entries(prepared.datasets).map(([key, values]) => [
      key,
      values.length,
    ]),
  );
  manifest.omissions = prepared.omissions;
  manifest.identityMappings = prepared.identities;
  manifest.snapshotHash = createHash("sha256")
    .update(JSON.stringify(manifest.files))
    .digest("hex");
  // No sobrescribe respaldos anteriores. Nunca hace fetch ni importa variables .env.
  await mkdir(resolve(output), { recursive: false });
  await mkdir(join(resolve(output), "backup"));
  for (const name of Object.keys(definitions))
    await copyFile(
      join(resolve(input), `${name}.csv`),
      join(resolve(output), "backup", `${name}.csv`),
    );
  await writeFile(
    join(resolve(output), "manifest.json"),
    JSON.stringify(manifest, null, 2),
    { flag: "wx" },
  );
  await writeFile(
    join(resolve(output), "catalog.json"),
    JSON.stringify({ ...prepared, manifest }, null, 2),
    { flag: "wx" },
  );
  console.log(
    JSON.stringify(
      {
        status: "Preparado localmente; sin conexión ni escrituras externas.",
        snapshotHash: manifest.snapshotHash,
        counts: manifest.counts,
        output: resolve(output),
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
