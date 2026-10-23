import { createHash, randomUUID } from "node:crypto";
import { fail } from "./security.js";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export function decodeImage(data) {
  if (typeof data !== "string" || data.length > MAX_IMAGE_BYTES * 1.4)
    fail(422, "La foto debe pesar hasta 2 MB.");
  const m = data.match(
    /^data:image\/(jpeg|png|webp);base64,([a-zA-Z0-9+/=]+)$/,
  );
  if (!m) fail(422, "Elegí una foto JPG, PNG o WebP.");
  const bytes = Buffer.from(m[2], "base64");
  const valid =
    m[1] === "jpeg"
      ? bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
      : m[1] === "png"
        ? bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP";
  if (!valid || bytes.length > MAX_IMAGE_BYTES)
    fail(422, "La foto está dañada o tiene un formato inválido.");
  return { bytes, mime: `image/${m[1]}`, format: m[1] };
}
export const signCloudinary = (params, secret) =>
  createHash("sha256")
    .update(
      Object.keys(params)
        .sort()
        .map((k) => `${k}=${params[k]}`)
        .join("&") + secret,
    )
    .digest("hex");
export async function uploadImage(sql, env, data, actor, fetcher = fetch) {
  if (
    !/^[a-zA-Z0-9_-]+$/.test(env.CLOUDINARY_CLOUD_NAME || "") ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET ||
    !env.CLOUDINARY_UPLOAD_PRESET
  )
    fail(503, "La carga de imágenes todavía no está configurada.");
  const image = decodeImage(data),
    id = randomUUID();
  const params = {
    timestamp: Math.floor(Date.now() / 1000),
    public_id: `flor-de-postre/catalog/${id}`,
    overwrite: "false",
    upload_preset: env.CLOUDINARY_UPLOAD_PRESET,
  };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.set(k, String(v));
  form.set("api_key", env.CLOUDINARY_API_KEY);
  form.set("signature", signCloudinary(params, env.CLOUDINARY_API_SECRET));
  form.set(
    "file",
    new Blob([image.bytes], { type: image.mime }),
    `foto.${image.format}`,
  );
  const response = await fetcher(
    `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: form, signal: AbortSignal.timeout(20000) },
  );
  if (!response.ok) fail(502, "No pudimos subir la foto. Intentá nuevamente.");
  const asset = await response.json();
  if (
    asset.public_id !== params.public_id ||
    !asset.secure_url?.startsWith(
      `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`,
    ) ||
    !["jpg", "jpeg", "png", "webp"].includes(asset.format) ||
    !Number.isSafeInteger(asset.bytes) ||
    asset.bytes > MAX_IMAGE_BYTES
  )
    fail(502, "La imagen no pudo verificarse.");
  await sql.transaction([
    sql`INSERT INTO images(id,public_id,url,width,height,bytes,format) VALUES(${id},${asset.public_id},${asset.secure_url},${asset.width},${asset.height},${asset.bytes},${asset.format})`,
    sql`INSERT INTO audit_log(admin_id,action,entity_id) VALUES(${actor},'image.upload',${id})`,
  ]);
  return { id, publicId: asset.public_id, url: asset.secure_url, alt: "" };
}
