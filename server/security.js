import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const hashToken = (value) =>
  createHash("sha256").update(value).digest("hex");
export const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
export const isProduction = (env) =>
  env.VERCEL_ENV !== "development" &&
  (env.NODE_ENV === "production" || Boolean(env.VERCEL));
export function assertConfigured(env) {
  if (
    env.ADMIN_ENABLED !== "true" ||
    !env.DATABASE_URL ||
    !env.APP_ORIGIN ||
    !env.SESSION_SECRET ||
    env.SESSION_SECRET.length < 32
  )
    fail(503, "Administración sin configurar.");
  const u = new URL(env.APP_ORIGIN);
  if (isProduction(env) && u.protocol !== "https:")
    fail(503, "Administración sin configurar.");
}
export function assertOrigin(req, env) {
  if (req.headers.origin !== new URL(env.APP_ORIGIN).origin)
    fail(403, "Origen no autorizado.");
  if (req.headers["sec-fetch-site"] === "cross-site")
    fail(403, "Origen no autorizado.");
  if (!(req.headers["content-type"] || "").startsWith("application/json"))
    fail(415, "Se requiere JSON.");
}
export async function passwordHash(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${salt}$${key.toString("hex")}`;
}
const dummyHash = "scrypt$00000000000000000000000000000000$" + "00".repeat(64);
export async function verifyPassword(password, encoded = dummyHash) {
  const [, salt, hex] = String(encoded).split("$");
  const valid =
    /^[a-f0-9]{32}$/.test(salt || "") && /^[a-f0-9]{128}$/.test(hex || "");
  const key = await scrypt(password, valid ? salt : "0".repeat(32), 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return valid && timingSafeEqual(key, Buffer.from(hex, "hex"));
}
export const cookieName = (env) =>
  isProduction(env) ? "__Host-fdp_admin" : "fdp_admin";
export const sessionCookie = (token, env, maxAge = 28800) =>
  `${cookieName(env)}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isProduction(env) ? "; Secure" : ""}`;
export const csrfFor = (token, env) =>
  createHmac("sha256", env.SESSION_SECRET)
    .update(`csrf:${token}`)
    .digest("hex");
export function cookieToken(req, env) {
  const value = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${cookieName(env)}=`))
    ?.split("=")[1];
  return /^[a-f0-9]{64}$/.test(value || "") ? value : null;
}
export async function requireSession(req, sql, env, mutation = false) {
  const token = cookieToken(req, env);
  if (!token) fail(401, "Iniciá sesión para continuar.");
  const [session] =
    await sql`SELECT a.id,a.email FROM admin_sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=${hashToken(token)} AND s.expires_at>now() AND a.active=true`;
  if (!session) fail(401, "Tu sesión venció. Volvé a ingresar.");
  if (mutation) {
    const supplied = req.headers["x-csrf-token"] || "",
      expected = csrfFor(token, env);
    if (
      !/^[a-f0-9]{64}$/.test(supplied) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
    )
      fail(403, "Volvé a ingresar para confirmar la operación.");
  }
  return { ...session, token, csrfToken: csrfFor(token, env) };
}
export async function limitLogin(req, sql, env, email) {
  // En Vercel x-real-ip es administrado por la plataforma; nunca confiar en x-forwarded-for arbitrario.
  const ip = env.VERCEL
    ? req.headers["x-real-ip"] || "unknown"
    : req.socket?.remoteAddress || "local";
  const keys = [`ip:${ip}`, `account:${email}`].map((k) =>
    createHmac("sha256", env.SESSION_SECRET).update(k).digest("hex"),
  );
  for (const [index, key] of keys.entries()) {
    const [r] =
      await sql`INSERT INTO login_limits(key,attempts,expires_at) VALUES(${key},1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_limits.expires_at<=now() THEN 1 ELSE login_limits.attempts+1 END,expires_at=CASE WHEN login_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE login_limits.expires_at END RETURNING attempts`;
    if (r.attempts > (index === 0 ? 20 : 5))
      fail(
        429,
        "Demasiados intentos. Esperá 15 minutos antes de volver a ingresar.",
      );
  }
}
export async function login(req, sql, env, body) {
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !password || password.length > 256)
    fail(401, "Correo o contraseña incorrectos.");
  await limitLogin(req, sql, env, email);
  const [admin] =
    await sql`SELECT id,email,password_hash,active FROM admins WHERE email=${email}`;
  const matches = await verifyPassword(password, admin?.password_hash);
  if (!admin?.active || !matches) {
    await sql`INSERT INTO audit_log(action,detail) VALUES('auth.failed',${JSON.stringify({ accountHash: hashToken(email) })}::jsonb)`;
    fail(401, "Correo o contraseña incorrectos.");
  }
  const token = randomBytes(32).toString("hex");
  await sql.transaction([
    sql`DELETE FROM admin_sessions WHERE expires_at<=now()`,
    sql`DELETE FROM login_limits WHERE expires_at<=now()`,
    sql`INSERT INTO admin_sessions(token_hash,admin_id,expires_at) VALUES(${hashToken(token)},${admin.id},now()+interval '8 hours')`,
    sql`INSERT INTO audit_log(admin_id,action) VALUES(${admin.id},'auth.login')`,
  ]);
  return { ...admin, token, csrfToken: csrfFor(token, env) };
}
