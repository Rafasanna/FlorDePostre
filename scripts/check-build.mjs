import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
const directory = resolve(process.argv[2] || "dist");
const files = (await readdir(resolve(directory, "assets"))).filter((f) =>
  /\.(js|css)$/.test(f),
);
const content = (
  await Promise.all(
    files.map((f) => readFile(resolve(directory, "assets", f), "utf8")),
  )
).join("\n");
const forbidden = [
  /postgres(?:ql)?:\/\//i,
  /CLOUDINARY_API_SECRET/,
  /SESSION_SECRET/,
  /scrypt\$[a-f0-9]{32}\$/,
  /@neondatabase\/serverless/,
  /ALLOW_DATABASE_WRITES/,
];
const failures = forbidden.filter((re) => re.test(content)).map(String);
// Busca valores de secretos locales si llegaran a existir. Nunca muestra el valor.
try {
  for (const line of (await readFile(".env.local", "utf8")).split(/\r?\n/)) {
    const m = line.match(
      /^(DATABASE_URL|SESSION_SECRET|CLOUDINARY_API_SECRET|ADMIN_PASSWORD)=(.*)$/,
    );
    if (
      m &&
      m[2].replace(/^['"]|['"]$/g, "").length > 8 &&
      content.includes(m[2].replace(/^['"]|['"]$/g, ""))
    )
      failures.push(`${m[1]} expuesto`);
  }
} catch {}
// La rama de demostración debe quedar eliminada del build incluso si ADMIN_DEMO_MODE=local.
if (content.includes("Entrar a la demostración"))
  failures.push("Entrada de demo compilada en producción");
if (failures.length) {
  console.error(JSON.stringify({ safe: false, failures }, null, 2));
  process.exit(1);
}
console.log(
  `Build verificado: ${files.length} assets, sin código servidor/secretos ni entrada a demo.`,
);
