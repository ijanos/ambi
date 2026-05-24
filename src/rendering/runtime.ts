import { createMeshExporter, type MeshExportRequest } from '../exporting/mesh-exporter';
import { initManifold } from '../geometry/manifold';
import { loadMondaFont } from '../fonts/load-font';
import {
  initScene,
  setCameraMode,
  setMaterialMode,
  setMeshInstances,
  setGlyphGap,
  exportGlyphGroupBinaryStl,
  dispose,
} from '../viewer/scene';
import type { CameraMode, MaterialMode } from '../viewer/scene';
import { buildIntersectedLetterPairMeshInstances } from './intersected-letter-pairs';

export type { CameraMode, MaterialMode } from '../viewer/scene';

export type RenderOptions = {
  rotatedGlyphYDegrees: number;
  sceneMeshYRotationRadians: number;
  cameraMode: CameraMode;
  materialMode: MaterialMode;
  letterSpacing: number;
};

export type RenderingRuntime = {
  renderIntersectedLetterPairs(wordLeft: string, wordRight: string, options: RenderOptions): void;
  exportMesh(request: MeshExportRequest): void;
  setCameraMode(cameraMode: CameraMode): void;
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

  const meshExporter = createMeshExporter({
    exportGlyphGroupBinaryStl,
  });

  return {
    renderIntersectedLetterPairs(wordLeft, wordRight, options) {
      setCameraMode(options.cameraMode);
      setMaterialMode(options.materialMode);

      const meshInstances = buildIntersectedLetterPairMeshInstances(font, wordLeft, wordRight, {
        rotatedGlyphYDegrees: options.rotatedGlyphYDegrees,
        sceneMeshYRotationRadians: options.sceneMeshYRotationRadians,
      });
      setGlyphGap(options.letterSpacing);
      setMeshInstances(meshInstances);
    },
    exportMesh(request) {
      meshExporter.exportMesh(request);
    },
    setCameraMode,
    setMaterialMode,
    dispose,
  };
}
