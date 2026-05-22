import './style.css';
import { initManifold } from './geometry/manifold';
import { createLetterASolid, createLetterXSolid } from './geometry/glyph';
import { initScene, setMeshInstances, dispose } from './viewer/scene';
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

    console.log('Creating glyph solids...');
    const aMesh = createLetterASolid();
    const xMesh = createLetterXSolid();
    logMeshStats('A', aMesh);
    logMeshStats('X', xMesh);

    setMeshInstances([
      {
        geometry: manifoldToThree(aMesh),
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
      {
        geometry: manifoldToThree(xMesh),
        position: [0, 0, 0],
        rotation: [0, Math.PI / 2, 0],
      },
    ]);

    console.log('Glyphs rendered');
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main();
window.addEventListener('beforeunload', dispose);
