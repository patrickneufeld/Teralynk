import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true, // Adjust the origin header to match the target
        secure: false, // Allow HTTP (useful for local dev)
        rewrite: (path) => path.replace(/^\/api/, ''), // Optional: Rewrite the path if needed
      },
    },
    host: 'localhost', // Specify the dev server host
    port: 5173, // Specify the port
  },
  build: {
    outDir: 'dist', // Output directory for builds
  },
});
