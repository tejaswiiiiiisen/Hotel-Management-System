import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Respect the port assigned by the harness (falls back to Vite's default).
    port: process.env.PORT ? Number(process.env.PORT) : undefined,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
