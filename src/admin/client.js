import { readImage } from "./demo.js";
export async function adminRequest(
  path,
  { method = "GET", body, csrfToken } = {},
) {
  const response = await fetch(`/api/admin/${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(path === "images/upload" ? 30000 : 15000),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Object.assign(
      new Error("El servidor de administración no está disponible."),
      { status: 503 },
    );
  }
  if (!response.ok)
    throw Object.assign(
      new Error(data.error || "No pudimos completar la operación."),
      { status: response.status, errors: data.fields },
    );
  return data;
}
export function createRealService(session) {
  const csrfToken = session.csrfToken;
  const read = () => adminRequest("catalog");
  return {
    mode: "real",
    writesEnabled: session.writesEnabled === true,
    read,
    saveProduct: async (product, revision, creating) => {
      await adminRequest(creating ? "products" : `products/${product.id}`, {
        method: creating ? "POST" : "PUT",
        csrfToken,
        body: { product, revision },
      });
      return read();
    },
    saveCategory: async (category, revision, creating) => {
      await adminRequest(
        creating ? "categories" : `categories/${category.id}`,
        {
          method: creating ? "POST" : "PUT",
          csrfToken,
          body: { category, revision },
        },
      );
      return read();
    },
    upload: async (file) =>
      adminRequest("images/upload", {
        method: "POST",
        csrfToken,
        body: { file: await readImage(file) },
      }),
    logout: () =>
      adminRequest("logout", { method: "POST", csrfToken, body: {} }),
  };
}
