import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
export async function localDatabase() {
  const db = new PGlite();
  await db.exec(
    await readFile(
      new URL("../migrations/001_admin_catalog.sql", import.meta.url),
      "utf8",
    ),
  );
  const query = (text, params = []) => {
    let promise;
    return {
      text,
      params,
      then(resolve, reject) {
        promise ||= db.query(text, params).then((r) => r.rows);
        return promise.then(resolve, reject);
      },
    };
  };
  const sql = (parts, ...values) =>
    query(
      parts.reduce((s, p, i) => s + (i ? `$${i}` : "") + p, ""),
      values,
    );
  sql.query = query;
  sql.transaction = (items) =>
    db.transaction(async (tx) => {
      const results = [];
      for (const q of items)
        results.push((await tx.query(q.text, q.params)).rows);
      return results;
    });
  return { db, sql };
}
export function request(
  handler,
  { url = "/api/admin/session", method = "GET", body, headers = {} } = {},
) {
  const req = {
    url,
    method,
    body,
    headers,
    socket: { remoteAddress: "127.0.0.1" },
  };
  const res = {
    headers: {},
    statusCode: 200,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  return handler(req, res).then(() => res);
}
