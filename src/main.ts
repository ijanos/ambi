import './style.css';
import { initManifold } from './geometry/manifold';
import { loadMondaFont } from './fonts/load-font';
import { buildIntersectedLetterPairMeshInstances } from './rendering/intersected-letter-pairs';
import { initControlsPanel } from './ui/controls-panel';
import { dispose, initScene, setMeshInstances } from './viewer/scene';

const DEFAULT_WORD_LEFT = 'HELLO';
const DEFAULT_WORD_RIGHT = 'WORLD';
const ROTATED_GLYPH_Y_DEGREES = 90;
const SCENE_MESH_Y_ROTATION_RADIANS = -Math.PI / 4;

async function main() {
  try {
    console.log('Initializing Manifold...');
    await initManifold();
    console.log('Manifold initialized');

    const viewerContainer = document.getElementById('viewer');
    if (!viewerContainer) {
      throw new Error('Viewer container not found');
    }

    console.log('Initializing scene...');
    initScene(viewerContainer);
    console.log('Scene initialized');

    const controlsPanel = initControlsPanel({
      defaultWordLeft: DEFAULT_WORD_LEFT,
      defaultWordRight: DEFAULT_WORD_RIGHT,
    });

    console.log('Loading Monda font...');
    const font = await loadMondaFont();
    console.log('Monda font loaded');

    const renderFromInputs = () => {
      const validation = controlsPanel.syncValidation();
      if (!validation.isValid) {
        return;
      }

      const meshInstances = buildIntersectedLetterPairMeshInstances(
        font,
        validation.normalizedWordLeft,
        validation.normalizedWordRight,
        {
          rotatedGlyphYDegrees: ROTATED_GLYPH_Y_DEGREES,
          sceneMeshYRotationRadians: SCENE_MESH_Y_ROTATION_RADIANS,
        },
      );

      setMeshInstances(meshInstances);
    };

    controlsPanel.enableLiveValidation();
    controlsPanel.onSubmit(renderFromInputs);

    renderFromInputs();
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main();
window.addEventListener('beforeunload', dispose);
