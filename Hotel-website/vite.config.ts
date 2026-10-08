import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies /api to the Express backend, so the browser sees a
// single origin — fetch("/api/...") calls work unchanged and the session cookie
// is sent as same-origin. Set VITE_API_TARGET to point at a different backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
