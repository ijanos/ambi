import { initManifold } from '../geometry/manifold';
import { loadMondaFont } from '../fonts/load-font';
import { initScene, setMeshInstances, dispose } from '../viewer/scene';
import { buildIntersectedLetterPairMeshInstances } from './intersected-letter-pairs';

export type RenderOptions = {
  rotatedGlyphYDegrees: number;
  sceneMeshYRotationRadians: number;
};

export type RenderingRuntime = {
  renderIntersectedLetterPairs(wordLeft: string, wordRight: string, options: RenderOptions): void;
  dispose(): void;
};

export async function createRenderingRuntime(container: HTMLElement): Promise<RenderingRuntime> {
  console.log('Initializing Manifold...');
  await initManifold();
  console.log('Manifold initialized');

  console.log('Initializing scene...');
  initScene(container);
  console.log('Scene initialized');

  console.log('Loading Monda font...');
  const font = await loadMondaFont();
  console.log('Monda font loaded');

  return {
    renderIntersectedLetterPairs(wordLeft, wordRight, options) {
      const meshInstances = buildIntersectedLetterPairMeshInstances(font, wordLeft, wordRight, options);
      setMeshInstances(meshInstances);
    },
    dispose,
  };
}
