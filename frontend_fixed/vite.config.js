import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Core Environment Variables
  const DEV_PORT = parseInt(env.VITE_DEV_PORT || '5173', 10);
  const API_URL = env.VITE_API_URL || 'http://localhost:5001';
  const WS_HOST = env.VITE_WS_HOST || '127.0.0.1';
  const isDev = mode === 'development';

  return {
    base: '/',
    mode: mode,

    plugins: [
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: ['@emotion/babel-plugin']
        },
        fastRefresh: true,
      })
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'process': 'process/browser',
        'buffer': 'buffer/',
        'stream': 'stream-browserify',
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },

    define: {
      global: {},
      'process.env': {
        ...Object.fromEntries(
          Object.entries(env).filter(([key]) => key.startsWith('VITE_'))
        ),
        NODE_ENV: JSON.stringify(mode)
      }
    },

    server: {
      host: WS_HOST,
      port: DEV_PORT,
      strictPort: true,
      open: !process.env.CI,

      cors: {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
        allowedHeaders: "*"
      },

      hmr: {
        host: WS_HOST,
        port: DEV_PORT,
        protocol: 'ws',
        clientPort: DEV_PORT,
        overlay: false
      },

      watch: {
        usePolling: true,
        interval: 100
      },

      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src * ws: wss: blob: data: 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *;"
      },

      proxy: {
        '/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      },

      setupMiddleware: (middleware, server) => {
        console.log('🔧 Setting up WebSocket mock server for development');
        
        server.ws.on('connection', (socket) => {
          console.log('✅ Mock WebSocket connection established');
          
          socket.on('message', (data) => {
            try {
              const message = JSON.parse(data);
              console.log('📩 Mock WebSocket received message:', message);
              
              socket.send(JSON.stringify({
                type: 'echo',
                data: message,
                timestamp: new Date().toISOString()
              }));
            } catch (err) {
              console.error('❌ Error processing WebSocket message:', err);
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process message',
                error: err.message
              }));
            }
          });
          
          const interval = setInterval(() => {
            try {
              socket.send(JSON.stringify({ 
                type: 'health', 
                status: 'ok',
                timestamp: new Date().toISOString()
              }));
            } catch (err) {
              console.error('❌ Error sending health status:', err);
              clearInterval(interval);
            }
          }, 5000);
          
          socket.on('close', () => {
            console.log('🛑 Mock WebSocket connection closed');
            clearInterval(interval);
          });
        });
      }
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'clsx',
        'lucide-react',
        '@emotion/react',
        'buffer',
        'process',
        'stream-browserify'
      ],
      esbuildOptions: {
        target: 'esnext',
        supported: {
          'top-level-await': true
        },
        loader: {
          '.js': 'jsx'
        }
      }
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isDev,
      target: 'esnext',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        input: isDev ? path.resolve(__dirname, 'dev.html') : path.resolve(__dirname, 'index.html'),
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['axios', 'clsx', 'lucide-react']
          },
          chunkFileNames: 'js/[name].[hash].js',
          entryFileNames: 'js/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      },
      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: true
        }
      }
    },

    css: {
      devSourcemap: true,
      modules: {
        scopeBehaviour: 'local',
        localsConvention: 'camelCase',
        generateScopedName: isDev ? '[name]__[local]__[hash:base64:5]' : '[hash:base64:8]'
      }
    },

    preview: {
      port: 4173,
      strictPort: true,
      cors: true
    },

    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      exclude: [],
    }
  };
});