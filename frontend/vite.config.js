import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server runs on http://localhost:5173 — the origin allowed by the
// Django CORS_ALLOWED_ORIGINS setting.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
