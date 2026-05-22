import './style.css';
import { createGlyphSolidFromFont } from './geometry/font-glyph';
import { initManifold } from './geometry/manifold';
import { dispose, initScene, setMeshGeometry } from './viewer/scene';
import { loadMondaFont } from './fonts/load-font';
import { manifoldToThree } from './viewer/mesh-bridge';
import type { Mesh } from 'manifold-3d';

const ROTATED_GLYPH_Y_DEGREES = 90;

function logMeshStats(label: string, manifoldMesh: Mesh) {
  if (!manifoldMesh || !manifoldMesh.triVerts || !manifoldMesh.vertProperties) {
    throw new Error(`Invalid mesh data returned from Manifold for ${label}`);
  }

  console.log(`${label} mesh stats`, {
    numProp: manifoldMesh.numProp,
    vertProperties: manifoldMesh.vertProperties.length,
    vertices: manifoldMesh.vertProperties.length / manifoldMesh.numProp,
    triangles: manifoldMesh.triVerts.length / 3,
  });
}

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

    console.log('Creating source glyph solids...');
    const glyphA = createGlyphSolidFromFont(font, 'A');
    const glyphB = createGlyphSolidFromFont(font, 'B').rotate(0, ROTATED_GLYPH_Y_DEGREES, 0);

    console.log('Creating intersected glyph solid...');
    const intersection = glyphA.intersect(glyphB);
    const intersectionMesh = intersection.getMesh();
    logMeshStats('Intersection', intersectionMesh);

    const geometry = manifoldToThree(intersectionMesh);
    setMeshGeometry(geometry);

    console.log('Intersected glyph rendered', {
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
