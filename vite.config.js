import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const demo =
    command === "serve" &&
    mode !== "production" &&
    env.NODE_ENV !== "production" &&
    !env.VERCEL &&
    env.ADMIN_DEMO_MODE === "local";
  return {
    plugins: [
      react(),
      {
        name: "local-admin-api",
        configureServer(server) {
          server.middlewares.use("/api", async (req, res, next) => {
            if (
              !req.url.startsWith("/admin") &&
              !req.url.startsWith("/catalog")
            )
              return next();
            req.url = "/api" + req.url;
            try {
              let data = "";
              for await (const chunk of req) {
                data += chunk;
                if (Buffer.byteLength(data) > 3000000) {
                  res.statusCode = 413;
                  res.end("{}");
                  return;
                }
              }
              req.body = data;
              res.status = (code) => {
                res.statusCode = code;
                return res;
              };
              res.json = (body) => {
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(body));
              };
              const mod = await server.ssrLoadModule(
                req.url.startsWith("/api/admin")
                  ? "/server/admin-handler.js"
                  : "/server/public-handler.js",
              );
              const handler = req.url.startsWith("/api/admin")
                ? mod.createAdminHandler({ env })
                : mod.createPublicHandler({ env });
              await handler(req, res);
            } catch {
              res.statusCode = 500;
              res.end("{}");
            }
          });
        },
      },
    ],
    define: { __ADMIN_DEMO_ENABLED__: JSON.stringify(demo) },
    build: { outDir: process.env.ADMIN_BUILD_DIR || "dist" },
  };
});
