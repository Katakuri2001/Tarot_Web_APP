import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react()],
  resolve: {
    alias: {
      "@admin": path.resolve(__dirname, "admin/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, "admin.html"),
    },
    outDir: "admin/dist",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      "/api": "http://127.0.0.1:8787",
    },
  },
});
