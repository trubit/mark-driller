import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3009,
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5009',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent && typeof (res as any).writeHead === 'function') {
              (res as any).writeHead(503, {
                'Content-Type': 'application/json',
                'Retry-After': '1',
              });
              (res as any).end(
                JSON.stringify({
                  success: false,
                  error: {
                    message: 'MarkDriller backend service initializing, retrying automatically...',
                    code: 'BACKEND_INITIALIZING',
                  },
                })
              );
            }
          });
        },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'vendor-ui': ['bootstrap', 'react-bootstrap'],
          'vendor-query': ['@tanstack/react-query', 'zustand'],
        },
      },
    },
  },
});
