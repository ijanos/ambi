import './style.css';
import { initManifold } from './geometry/manifold';
import { initScene, setMeshGeometry, dispose } from './viewer/scene';
import { manifoldToThree } from './viewer/mesh-bridge';
import { createTestSolid } from './geometry/glyph';

async function main() {
  try {
    // Initialize Manifold WASM
    console.log('Initializing Manifold...');
    await initManifold();
    console.log('Manifold initialized');

    // Get the viewer container
    const viewerContainer = document.getElementById('viewer');
    if (!viewerContainer) {
      throw new Error('Viewer container not found');
    }

    // Initialize Three.js scene
    console.log('Initializing scene...');
    initScene(viewerContainer);
    console.log('Scene initialized');

    // Create test solid and render it
    console.log('Creating test solid...');
    const manifoldMesh = createTestSolid();
    console.log('Manifold mesh:', manifoldMesh);
    if (!manifoldMesh || !manifoldMesh.triVerts || !manifoldMesh.vertProperties) {
      throw new Error('Invalid mesh data returned from Manifold');
    }
    console.log(
      'Mesh stats:',
      {
        numProp: manifoldMesh.numProp,
        vertProperties: manifoldMesh.vertProperties.length,
        vertices: manifoldMesh.vertProperties.length / manifoldMesh.numProp,
        triangles: manifoldMesh.triVerts.length / 3,
      }
    );

    // Convert to Three.js geometry and render
    const geometry = manifoldToThree(manifoldMesh);
    setMeshGeometry(geometry);
    console.log('Mesh rendered');
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run on page load
main();

// Cleanup on page unload
window.addEventListener('beforeunload', dispose);
