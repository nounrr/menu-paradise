import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://148-230-125-221.sslip.io',
      '/uploads': 'https://148-230-125-221.sslip.io'
    }
  }
});


