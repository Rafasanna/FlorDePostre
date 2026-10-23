import React, { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

const AdminApp = lazy(() => import("./admin/AdminApp.jsx"));
function Root() {
  const { pathname } = useLocation();
  return /^\/admin(?:\/|$)/.test(pathname) ? (
    <Suspense
      fallback={<main style={{ padding: 40 }}>Cargando administración…</main>}
    >
      <AdminApp />
    </Suspense>
  ) : (
    <App />
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
);
