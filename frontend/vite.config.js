import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001', // Default to local backend during development
        changeOrigin: true, // Adjust the origin header to match the target
        secure: false, // Allow HTTP (useful for local dev, but consider HTTPS for production)
        rewrite: (path) => path.replace(/^\/api/, ''), // Rewrite the path if needed (removes /api)
      },
    },
    host: 'localhost', // Specify the dev server host
    port: 5173, // Specify the port (default Vite port)
  },
  build: {
    outDir: 'dist', // Output directory for builds
  },
});
