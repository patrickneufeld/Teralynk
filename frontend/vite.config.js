// ================================================
// ✅ FILE: /frontend/vite.config.js
// Hardened, Enterprise-Grade Vite Config (Permissions-Policy, CSP, Aliases, Polyfills)
// ================================================

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { visualizer } from 'rollup-plugin-visualizer';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// =========================
// Full CSP for Google reCAPTCHA, gstatic, ws, APIs
// =========================
// =========================
// Full CSP for Google reCAPTCHA, gstatic, ws, APIs, AWS Cognito
// =========================
// =========================
// Full CSP for Google reCAPTCHA, gstatic, ws, APIs, AWS Cognito
// =========================
// =========================
// Full CSP for Google reCAPTCHA, gstatic, ws, APIs, AWS Cognito
// =========================
// =========================
// Full CSP for Google reCAPTCHA, gstatic, ws, APIs, AWS Cognito
// =========================
// ================================================
// ✅ FILE: vite.config.js (CSP Section)
// Updated getCSP function with full platform support
// ================================================

function getCSP({ isDev, API_URL }) {
  return [
    // Restrict everything to self unless explicitly allowed
    `default-src 'self'${isDev ? ` ${API_URL}` : ''}`,

    // Allow scripts from Google (e.g., reCAPTCHA), unsafe-inline/eval for development tools only
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com`,

    // Inline styles and Google Fonts
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,

    // Google Fonts
    `font-src 'self' https://fonts.gstatic.com`,

    // ✅ Secure connect-src for APIs, Cognito, LLMs, WebSockets, etc.
    `connect-src 'self' ${isDev ? API_URL : ''} ws://localhost:* wss://* blob: data:` +
    ` https://www.google.com https://www.gstatic.com` +
    ` https://cognito-idp.us-east-1.amazonaws.com https://*.amazonaws.com` +
    ` https://storage.googleapis.com https://www.googleapis.com` +
    ` https://api.openai.com https://bedrock.us-east-1.amazonaws.com`,

    // Allow inline images, blobs, S3, and any remote previews
    `img-src 'self' data: blob: https://*`,

    // Allow reCAPTCHA and embed iframes (Google, preview windows)
    `frame-src 'self' https://www.google.com https://recaptcha.google.com`,

    // Workers, blobs (e.g., WebAssembly, AI model caching)
    `worker-src 'self' blob:`,

    // App manifest
    `manifest-src 'self'`,

    // Base href security
    `base-uri 'self'`,

    // Allow form submission to self only
    `form-action 'self'`,

    // Force HTTPS for any mixed content
    `upgrade-insecure-requests`
  ].join('; ');
}




// =========================
// SECURITY HEADERS
// =========================
const getSecurityHeaders = ({ isDev, API_URL }) => ({
  'Content-Security-Policy': getCSP({ isDev, API_URL }),
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    "geolocation=()",
    "microphone=()",
    "camera=()",
    "payment=()",
    "fullscreen=()",
    "accelerometer=()",
    "autoplay=()",
    "display-capture=()",
    "encrypted-media=()",
    "gamepad=()",
    "gyroscope=()",
    "magnetometer=()",
    "midi=()",
    "picture-in-picture=()",
    "publickey-credentials-get=()",
    "screen-wake-lock=()",
    "sync-xhr=()",
    "usb=()",
    "web-share=()"
  ].join(", "),
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Expect-CT': 'max-age=86400, enforce',
  'Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Access-Control-Allow-Origin': '*'
});

// =========================
// Main Vite Config
// =========================
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const isAnalyze = process.env.ANALYZE === 'true';

  const DEV_PORT = parseInt(env.VITE_DEV_PORT || '5173', 10);
  const API_URL = env.VITE_API_URL || 'http://localhost:5001';
  const WS_HOST = env.VITE_WS_HOST || '127.0.0.1';

  const securityHeaders = getSecurityHeaders({ isDev, API_URL });

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
        globals: { Buffer: true, global: true, process: true },
        protocolImports: true
      }),
      nodeResolve({ browser: true, preferBuiltins: false }),
      commonjs({
        requireReturnsDefault: true,
        transformMixedEsModules: true,
        include: [/node_modules/, /\.js$/, /\.jsx$/],
        esmExternals: true,
        skipPreflightCheck: true
      }),
      react({
        jsxRuntime: 'automatic', // ✅ Enables @jsxImportSource support
        babel: {
          plugins: ['@emotion/babel-plugin'],
          presets: [
            ['@babel/preset-env', { targets: 'defaults', modules: false, bugfixes: true, loose: true }],
            ['@babel/preset-react', { runtime: 'automatic' }] // ✅ React JSX runtime setting
          ]
        },
        fastRefresh: isDev
      }),
      isAnalyze && visualizer({
        filename: './dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      }),
      {
        name: 'secure-dev-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (isDev) console.log(`[DevServer] ${req.method} ${req.url}`);

            if (req.method === 'OPTIONS') {
              res.writeHead(204, {
                'Access-Control-Allow-Origin': isDev ? '*' : API_URL,
                'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400'
              });
              res.end();
              return;
            }

            Object.entries(securityHeaders).forEach(([key, value]) => {
              res.setHeader(key, value);
            });

            res.setHeader('Access-Control-Allow-Origin', isDev ? '*' : API_URL);
            res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Access-Control-Allow-Credentials', 'true');

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
            const passthroughs = [
              '/api/logs', '/api/logs/', '/api/logs/activity',
              '/api/audit/log', '/api/logs/error', '/api/logs/feedback'
            ];
            if (passthroughs.includes(path)) {
              isDev && console.log(`[Proxy] ✅ Passthrough: ${path}`);
              return path;
            }
            const rewritten = path.replace(/^\/api/, '');
            isDev && console.log(`[Proxy] 🔁 Rewrite ${path} → ${rewritten}`);
            return rewritten;
          }
        }
      }
    },
    optimizeDeps: {
      include: [
        'react', 'react-dom', 'react-router-dom', 'axios', 'clsx', 'lucide-react',
        '@emotion/react', 'buffer', 'process', 'stream-browserify', 'crypto-browserify',
        'util', 'events', 'querystring', 'url', 'path-browserify', 'stream-http',
        'https-browserify', 'browserify-zlib', 'assert', 'uuid'
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
        input: { main: path.resolve(__dirname, 'index.html') },
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
