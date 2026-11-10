import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // Hashed bundles go in _app/ so they can be cached forever; public/assets/ keeps stable names.
    assetsDir: '_app',
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] }
      }
    }
  }
});
