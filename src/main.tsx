import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./shared/i18n/config";
import "./index.css";
import { Providers } from "./app/Providers";
import { router } from "./app/router";
import { MissingEnvScreen } from "./app/MissingEnvScreen";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const SUPABASE_URL = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Render a helpful setup screen instead of a blank page — this is what
  // happens on a fresh Vercel deploy before the env vars are configured.
  createRoot(rootElement).render(
    <StrictMode>
      <MissingEnvScreen />
    </StrictMode>
  );
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>
  );
}
