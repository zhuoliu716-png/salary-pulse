import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/salary-pulse/',
  plugins: [react()],
  server: { host: true, allowedHosts: true },
  preview: { host: true, allowedHosts: true },
});
