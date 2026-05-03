import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // expose on network for mobile testing
    proxy: {
      '/sessions': { target: 'http://localhost:4000', changeOrigin: true },
      '/policy': { target: 'http://localhost:4000', changeOrigin: true },
      '/health': { target: 'http://localhost:4000', changeOrigin: true },
      '/metrics': { target: 'http://localhost:4000', changeOrigin: true },
      '/webhook': { target: 'http://localhost:4000', changeOrigin: true },
      '/probe-100kb': { target: 'http://localhost:4000', changeOrigin: true },
      '/tts': { target: 'http://localhost:4000', changeOrigin: true },
      '/vision': { target: 'http://localhost:4000', changeOrigin: true },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  worker: {
    format: 'es',
  },
});
