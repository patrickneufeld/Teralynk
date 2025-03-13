// ✅ File: /Users/patrick/Projects/Teralynk/frontend/vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// ✅ Export the Vite config
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    open: true,
    cors: true,
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
    target: "esnext",
  },

  define: {
    global: {}, // ✅ Fixes AWS SDK issue
  },

  preview: {
    port: 4173,
    strictPort: true,
  },
});
