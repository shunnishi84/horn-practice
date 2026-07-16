import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/horn-practice/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: '127.0.0.1',
  },
  preview: {
    port: 4173,
    host: '127.0.0.1',
  },
});
