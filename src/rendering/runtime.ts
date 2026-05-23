import { initManifold } from '../geometry/manifold';
import { loadMondaFont } from '../fonts/load-font';
import { initScene, setMaterialMode, setMeshInstances, dispose } from '../viewer/scene';
import type { MaterialMode } from '../viewer/scene';
import { buildIntersectedLetterPairMeshInstances } from './intersected-letter-pairs';

export type { MaterialMode } from '../viewer/scene';

export type CameraMode = 'perspective' | 'orthographic';

export type RenderOptions = {
  rotatedGlyphYDegrees: number;
  sceneMeshYRotationRadians: number;
  cameraMode: CameraMode;
  materialMode: MaterialMode;
};

export type RenderingRuntime = {
  renderIntersectedLetterPairs(wordLeft: string, wordRight: string, options: RenderOptions): void;
  setMaterialMode(materialMode: MaterialMode): void;
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
      setMaterialMode(options.materialMode);

      const meshInstances = buildIntersectedLetterPairMeshInstances(font, wordLeft, wordRight, {
        rotatedGlyphYDegrees: options.rotatedGlyphYDegrees,
        sceneMeshYRotationRadians: options.sceneMeshYRotationRadians,
      });
      setMeshInstances(meshInstances);
    },
    setMaterialMode,
    dispose,
  };
}
