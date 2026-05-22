import './style.css';
import { createFlatTextGeometry } from './geometry/text';
import { loadMondaFont } from './fonts/load-font';
import { dispose, initScene, setMeshGeometry } from './viewer/scene';

async function main() {
  try {
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

    console.log('Creating flat text geometry...');
    const geometry = createFlatTextGeometry('Hello World', font);
    setMeshGeometry(geometry);
    console.log('Hello rendered');
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main();
window.addEventListener('beforeunload', dispose);
