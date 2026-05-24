import { defineConfig, type Plugin } from 'vite';
import { generateFontCatalog, isFontAssetPath } from './scripts/font-catalog-generator.mjs';

function fontCatalogPlugin(): Plugin {
  return {
    name: 'font-catalog-generator',
    async buildStart() {
      await generateFontCatalog();
    },
    configureServer(server) {
      const regenerate = async (filePath: string) => {
        if (!isFontAssetPath(filePath)) {
          return;
        }

        try {
          const result = await generateFontCatalog();
          if (result.changed) {
            server.moduleGraph.invalidateAll();
            server.ws.send({ type: 'full-reload' });
          }
        } catch (error) {
          server.config.logger.error('[font-catalog] generation failed');
          server.config.logger.error(error instanceof Error ? error.stack ?? error.message : String(error));
        }
      };

      void generateFontCatalog().catch((error) => {
        server.config.logger.error('[font-catalog] initial generation failed');
        server.config.logger.error(error instanceof Error ? error.stack ?? error.message : String(error));
      });

      server.watcher.on('add', regenerate);
      server.watcher.on('change', regenerate);
      server.watcher.on('unlink', regenerate);
    },
  };
}

export default defineConfig({
  plugins: [fontCatalogPlugin()],
  optimizeDeps: {
    // Exclude Manifold WASM from pre-bundling
    exclude: ['manifold-3d'],
  },
});
