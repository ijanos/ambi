import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    // Exclude Manifold WASM from pre-bundling
    exclude: ['manifold-3d'],
  },
});
