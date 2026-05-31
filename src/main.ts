// Polyfill Symbol.dispose at the absolute entry point for all browser environments (like Safari)
if (typeof Symbol !== 'undefined' && !Symbol.dispose) {
  Object.defineProperty(Symbol, 'dispose', {
    value: Symbol.for('Symbol.dispose'),
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

import './style.css';
import { DEFAULT_FONT_ID, FONT_OPTIONS, type FontId } from './fonts/catalog.generated';
import type { RenderingRuntime, RenderOptions } from './rendering/runtime';
import { initControlsPanel } from './ui/controls-panel';

const DEFAULT_WORD_LEFT = 'HELLO';
const DEFAULT_WORD_RIGHT = 'WORLD';
const ROTATED_GLYPH_Y_DEGREES = 90;
const SCENE_MESH_Y_ROTATION_RADIANS = -Math.PI / 4;

async function main() {
  let disposeRenderingRuntime: (() => void) | undefined;

  try {
    const viewerContainer = document.getElementById('viewer');
    if (!viewerContainer) {
      throw new Error('Viewer container not found');
    }

    const controlsPanel = initControlsPanel({
      defaultWordLeft: DEFAULT_WORD_LEFT,
      defaultWordRight: DEFAULT_WORD_RIGHT,
      defaultFontId: DEFAULT_FONT_ID,
      fontOptions: FONT_OPTIONS,
    });

    let renderingRuntimePromise: Promise<RenderingRuntime> | undefined;

    type RenderSnapshot = {
      fileBasename: string;
      letterSpacing: number;
      fontIdLeft: FontId;
      fontIdRight: FontId;
      baseEnabled: boolean;
      baseHeight: number;
    };
    let lastRendered: RenderSnapshot | undefined;

    const getRenderingRuntime = () => {
      if (!renderingRuntimePromise) {
        renderingRuntimePromise = import('./rendering/runtime').then(
          async ({ createRenderingRuntime }) => {
            const runtime = await createRenderingRuntime(viewerContainer);
            disposeRenderingRuntime = runtime.dispose;
            return runtime;
          },
        );
      }

      return renderingRuntimePromise;
    };

    const getFileBasename = (wordLeft: string, wordRight: string): string =>
      `${wordLeft}_${wordRight}`;

    const syncDownloadDirtyState = () => {
      const validation = controlsPanel.syncValidation();
      if (!validation.isValid || !lastRendered) {
        controlsPanel.setDownloadDisabled(true);
        return;
      }

      const settings = controlsPanel.getRenderSettings();
      const currentBasename = getFileBasename(
        validation.normalizedWordLeft,
        validation.normalizedWordRight,
      );
      const isDirty =
        currentBasename !== lastRendered.fileBasename ||
        settings.letterSpacing !== lastRendered.letterSpacing ||
        settings.fontIdLeft !== lastRendered.fontIdLeft ||
        settings.fontIdRight !== lastRendered.fontIdRight ||
        settings.baseEnabled !== lastRendered.baseEnabled ||
        settings.baseHeight !== lastRendered.baseHeight;

      controlsPanel.setDownloadDisabled(isDirty);
    };

    const renderFromInputs = async () => {
      const validation = controlsPanel.syncValidation();
      if (!validation.isValid) {
        controlsPanel.setDownloadDisabled(true);
        return;
      }

      const settings = controlsPanel.getRenderSettings();
      const renderOptions: RenderOptions = {
        rotatedGlyphYDegrees: ROTATED_GLYPH_Y_DEGREES,
        sceneMeshYRotationRadians: SCENE_MESH_Y_ROTATION_RADIANS,
        cameraMode: settings.cameraMode,
        materialMode: settings.materialMode,
        letterSpacing: settings.letterSpacing,
        fontIdLeft: settings.fontIdLeft,
        fontIdRight: settings.fontIdRight,
        baseEnabled: settings.baseEnabled,
        baseHeight: settings.baseHeight,
      };

      viewerContainer.classList.remove('is-ready');
      viewerContainer.setAttribute('aria-busy', 'true');

      // Yield control to the browser paint cycle to ensure the spinner is visible and animating before heavy synchronous operations block the thread.
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

      try {
        const renderingRuntime = await getRenderingRuntime();
        const result = await renderingRuntime.renderIntersectedLetterPairs(
          validation.normalizedWordLeft,
          validation.normalizedWordRight,
          renderOptions,
        );

        if (result.floaterPairs.length > 0) {
          controlsPanel.showFloaterWarning(result.floaterPairs);
        } else {
          controlsPanel.clearFloaterWarning();
        }

        lastRendered = {
          fileBasename: getFileBasename(
            validation.normalizedWordLeft,
            validation.normalizedWordRight,
          ),
          letterSpacing: renderOptions.letterSpacing,
          fontIdLeft: renderOptions.fontIdLeft,
          fontIdRight: renderOptions.fontIdRight,
          baseEnabled: renderOptions.baseEnabled,
          baseHeight: renderOptions.baseHeight,
        };

        controlsPanel.setDownloadDisabled(false);
      } finally {
        viewerContainer.classList.add('is-ready');
        viewerContainer.setAttribute('aria-busy', 'false');
      }
    };

    controlsPanel.onWordsChange(syncDownloadDirtyState);
    controlsPanel.onLetterSpacingChange(syncDownloadDirtyState);
    controlsPanel.onFontChange(syncDownloadDirtyState);
    controlsPanel.onBaseSettingsChange(syncDownloadDirtyState);
    controlsPanel.onCameraModeChange((cameraMode) => {
      void getRenderingRuntime().then((runtime) => {
        runtime.setCameraMode(cameraMode);
      });
    });
    controlsPanel.onMaterialModeChange((materialMode) => {
      void getRenderingRuntime().then((runtime) => {
        runtime.setMaterialMode(materialMode);
      });
    });
    controlsPanel.onDownload(() => {
      if (!lastRendered) {
        return;
      }

      const { fileBasename } = lastRendered;

      void getRenderingRuntime().then((runtime) => {
        runtime.exportMesh({
          format: 'stl',
          source: 'glyph-group',
          fileBasename,
        });
      });
    });
    controlsPanel.onSubmit(() => {
      void renderFromInputs();
    });

    controlsPanel.setDownloadDisabled(true);
    await renderFromInputs();
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }

  window.addEventListener('beforeunload', () => {
    disposeRenderingRuntime?.();
  });
}

void main();
