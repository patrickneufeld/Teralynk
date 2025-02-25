import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync("./certs/localhost-key.pem"),
      cert: fs.readFileSync("./certs/localhost-cert.pem"),
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5001",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
    host: "localhost",
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
});
