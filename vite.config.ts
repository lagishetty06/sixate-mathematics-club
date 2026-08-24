import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers — reduces polyfill overhead
    target: 'es2020',
    // Split large vendor chunks for better caching and faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase SDK — rarely changes, cached aggressively
          'firebase-core': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'firebase-storage': ['firebase/storage'],
          // Recharts — large charting library, only needed on Analytics page
          'recharts': ['recharts'],
          // ExcelJS — very large library, only needed for exports
          'exceljs': ['exceljs'],
          // PapaParse — CSV, only needed for exports
          'papaparse': ['papaparse'],
        },
      },
    },
    // Raise chunk warning limit — ExcelJS is inherently large
    chunkSizeWarningLimit: 1500,
  },
  // Optimise pre-bundling in development
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore', 'firebase/auth', 'react', 'react-dom', 'react-router-dom'],
  },
});
