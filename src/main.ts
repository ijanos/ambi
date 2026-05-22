import './style.css';
import { createGlyphSolidFromFont } from './geometry/font-glyph';
import { initManifold } from './geometry/manifold';
import { manifoldToThree } from './viewer/mesh-bridge';
import { dispose, initScene, setMeshInstances } from './viewer/scene';
import { loadMondaFont } from './fonts/load-font';

const ROTATED_GLYPH_Y_DEGREES = 90;

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

    console.log('Loading Monda font...');
    const font = await loadMondaFont();
    console.log('Monda font loaded');

    console.log('Creating Manifold glyph solids...');
    const glyphA = createGlyphSolidFromFont(font, 'A');
    const glyphB = createGlyphSolidFromFont(font, 'B').rotate(0, ROTATED_GLYPH_Y_DEGREES, 0);

    const geometryA = manifoldToThree(glyphA.getMesh());
    const geometryB = manifoldToThree(glyphB.getMesh());

    setMeshInstances([
      { geometry: geometryA },
      { geometry: geometryB },
    ]);

    console.log('Overlapped glyphs rendered', {
      referenceGlyph: 'A',
      rotatedGlyph: 'B',
      rotatedGlyphYDegrees: ROTATED_GLYPH_Y_DEGREES,
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main();
window.addEventListener('beforeunload', dispose);
