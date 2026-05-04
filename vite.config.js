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
      '/api': 'http://148.230.125.221:3309',
      '/uploads': 'http://148.230.125.221:3309'
    }
  }
});


