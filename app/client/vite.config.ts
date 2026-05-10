import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  root: './client',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: parseInt(process.env.CLIENT_PORT || '3000'),
    proxy: {
      '/api': `http://localhost:${process.env.SERVER_PORT || '8000'}`,
      '/auth': `http://localhost:${process.env.SERVER_PORT || '8000'}`,
    },
  },
});
