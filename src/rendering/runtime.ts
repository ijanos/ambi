import { createMeshExporter, type MeshExportRequest } from '../exporting/mesh-exporter';
import { initManifold } from '../geometry/manifold';
import type { FontId } from '../fonts/catalog';
import { loadFont } from '../fonts/load-font';
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
  fontId: FontId;
};

export type RenderingRuntime = {
  renderIntersectedLetterPairs(wordLeft: string, wordRight: string, options: RenderOptions): Promise<void>;
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

  const meshExporter = createMeshExporter({
    exportGlyphGroupBinaryStl,
  });

  return {
    async renderIntersectedLetterPairs(wordLeft, wordRight, options) {
      setCameraMode(options.cameraMode);
      setMaterialMode(options.materialMode);

      console.log('Loading font...', { fontId: options.fontId });
      const font = await loadFont(options.fontId);
      console.log('Font loaded', { fontId: options.fontId });

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
