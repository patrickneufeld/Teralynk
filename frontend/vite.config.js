// ================================================
// ✅ FILE: /frontend/vite.config.js
// Final hardened Vite config with complete proxy + CSP + log forwarding
// ================================================

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const isAnalyze = process.env.ANALYZE === 'true';

  const DEV_PORT = parseInt(env.VITE_DEV_PORT || '5173', 10);
  const API_URL = env.VITE_API_URL || 'http://localhost:5001';
  const WS_HOST = env.VITE_WS_HOST || '127.0.0.1';

  return {
    base: '/',
    mode,

    define: {
      global: 'globalThis',
      'process.env': {
        ...Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith('VITE_'))),
        NODE_ENV: JSON.stringify(mode),
        BUILD_TIME: JSON.stringify(new Date().toISOString())
      }
    },

    plugins: [
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true
        },
        protocolImports: true
      }),

      nodeResolve({
        browser: true,
        preferBuiltins: false
      }),

      commonjs({
        requireReturnsDefault: true,
        transformMixedEsModules: true,
        include: [/node_modules/, /\.js$/, /\.jsx$/],
        esmExternals: true,
        skipPreflightCheck: true
      }),

      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: ['@emotion/babel-plugin'],
          presets: [
            ['@babel/preset-env', { targets: 'defaults', modules: false, bugfixes: true, loose: true }],
            '@babel/preset-react'
          ]
        },
        fastRefresh: isDev
      }),

      isAnalyze &&
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true
        }),

      {
        name: 'custom-dev-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            console.log(`[DevServer] ${req.method} ${req.url}`);

            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
              });
              res.end();
              return;
            }

            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.setHeader(
              'Content-Security-Policy',
              "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' * ws: wss: blob: data:; img-src 'self' * data: blob:; frame-src 'self' *; base-uri 'self'; form-action 'self'; worker-src 'self' blob:"
            );
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'DENY');
            res.setHeader('X-XSS-Protection', '1; mode=block');
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
            res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

            next();
          });
        }
      }
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        process: 'process/browser',
        buffer: 'buffer/',
        util: 'util/',
        stream: 'stream-browserify',
        crypto: 'crypto-browserify',
        http: 'stream-http',
        https: 'https-browserify',
        zlib: 'browserify-zlib',
        path: 'path-browserify',
        fs: false,
        net: false,
        tls: false
      },
      extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json'],
      mainFields: ['browser', 'module', 'main'],
      preserveSymlinks: true
    },

    server: {
      host: WS_HOST,
      port: DEV_PORT,
      strictPort: true,
      open: !process.env.CI,
      cors: true,
      hmr: {
        host: WS_HOST,
        port: DEV_PORT,
        protocol: 'ws',
        timeout: 120000,
        overlay: true,
        clientPort: DEV_PORT
      },
      watch: {
        usePolling: true,
        interval: 100,
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**']
      },
      proxy: {
        '^/api': {
          target: API_URL,
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => {
            const passthroughs = ['/api/logs', '/api/logs/', '/api/logs/activity', '/api/audit/log'];
            if (passthroughs.includes(path)) {
              console.log(`[Proxy] ✅ Passing through without rewrite: ${path}`);
              return path;
            }
            const rewritten = path.replace(/^\/api/, '');
            console.log(`[Proxy] 🔁 Rewriting ${path} → ${rewritten}`);
            return rewritten;
          }
        }
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
        'stream-browserify',
        'crypto-browserify',
        'util',
        'events',
        'querystring',
        'url',
        'path-browserify',
        'stream-http',
        'https-browserify',
        'browserify-zlib',
        'assert',
        'uuid'
      ],
      esbuildOptions: {
        target: 'esnext',
        supported: { 'top-level-await': true },
        loader: {
          '.js': 'jsx',
          '.ts': 'tsx',
          '.jsx': 'jsx',
          '.tsx': 'tsx'
        },
        define: {
          global: 'globalThis',
          'process.env.NODE_ENV': JSON.stringify(mode)
        },
        platform: 'browser'
      }
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isDev,
      target: 'esnext',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1600,
      minify: 'terser',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['axios', 'clsx', 'lucide-react'],
            router: ['react-router-dom'],
            emotion: ['@emotion/react', '@emotion/styled']
          }
        }
      },
      terserOptions: {
        compress: {
          drop_console: !isDev,
          drop_debugger: true,
          pure_funcs: isDev ? [] : ['console.log', 'console.info', 'console.debug']
        }
      }
    }
  };
});
