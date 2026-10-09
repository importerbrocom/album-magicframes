import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev server proxies /api to the Laravel backend so the SPA and API share an
// origin during local development (no CORS headaches).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Code splitting: pull core vendor libs into a shared chunk.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/react-router/.test(id)) return 'router';
            if (/react|scheduler/.test(id)) return 'react';
            if (/axios/.test(id)) return 'axios';
            return 'vendor';
          }
        },
      },
    },
  },
});
