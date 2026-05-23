import './style.css';
import type { RenderingRuntime } from './rendering/runtime';
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
    });

    let renderingRuntimePromise: Promise<RenderingRuntime> | undefined;

    const getRenderingRuntime = () => {
      if (!renderingRuntimePromise) {
        renderingRuntimePromise = import('./rendering/runtime').then(async ({ createRenderingRuntime }) => {
          const runtime = await createRenderingRuntime(viewerContainer);
          disposeRenderingRuntime = runtime.dispose;
          return runtime;
        });
      }

      return renderingRuntimePromise;
    };

    const renderFromInputs = async () => {
      const validation = controlsPanel.syncValidation();
      if (!validation.isValid) {
        return;
      }

      const renderingRuntime = await getRenderingRuntime();
      renderingRuntime.renderIntersectedLetterPairs(
        validation.normalizedWordLeft,
        validation.normalizedWordRight,
        {
          rotatedGlyphYDegrees: ROTATED_GLYPH_Y_DEGREES,
          sceneMeshYRotationRadians: SCENE_MESH_Y_ROTATION_RADIANS,
        },
      );
    };

    controlsPanel.enableLiveValidation();
    controlsPanel.onSubmit(() => {
      void renderFromInputs();
    });

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
