import './style.css';
import { initManifold } from './geometry/manifold';
import { createIntersectedGlyphSolid } from './geometry/glyph';
import { initScene, setMeshGeometry, dispose } from './viewer/scene';
import { manifoldToThree } from './viewer/mesh-bridge';
import type { Mesh } from 'manifold-3d';

function logMeshStats(label: string, manifoldMesh: Mesh) {
  if (!manifoldMesh || !manifoldMesh.triVerts || !manifoldMesh.vertProperties) {
    throw new Error(`Invalid mesh data returned from Manifold for ${label}`);
  }

  console.log(`${label} mesh:`, manifoldMesh);
  console.log(`${label} mesh stats:`, {
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

    console.log('Creating intersected glyph solid...');
    const intersectedMesh = createIntersectedGlyphSolid();
    logMeshStats('Intersection', intersectedMesh);

    const geometry = manifoldToThree(intersectedMesh);
    setMeshGeometry(geometry);
    console.log('Intersection rendered');
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main();
window.addEventListener('beforeunload', dispose);
