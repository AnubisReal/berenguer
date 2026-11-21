import { defineConfig } from 'vite';
import { vehiclePages } from './vehicle-pages.mjs';

export default defineConfig({
  plugins: [vehiclePages()],
  base: process.env.PAGES_BASE || '/',
  server: {
    host: '0.0.0.0',
    port: 4321,
    strictPort: true,
    allowedHosts: ['test.anubisreal.es'],
  },
});
