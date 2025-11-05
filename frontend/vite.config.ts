import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'buffer-global',
      generateBundle() {},
      buildStart() {
        // Ensure Buffer is available globally
        if (typeof globalThis !== 'undefined') {
          try {
            const { Buffer } = require('buffer');
            globalThis.Buffer = Buffer;
          } catch {}
        }
      },
    },
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  optimizeDeps: {
    include: ['buffer'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      inject: ['./src/polyfill.ts'],
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'wagmi-vendor': ['wagmi', '@rainbow-me/rainbowkit', 'viem'],
          'ethers-vendor': ['ethers'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});


