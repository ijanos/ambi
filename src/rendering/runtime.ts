import { createMeshExporter, type MeshExportRequest } from '../exporting/mesh-exporter';
import type { FontId } from '../fonts/catalog';
import { loadFont } from '../fonts/load-font';
import { initManifold } from '../geometry/manifold';
import type { CameraMode, MaterialMode } from '../types';
import {
  dispose,
  exportGlyphGroupBinaryStl,
  initScene,
  setCameraMode,
  setGlyphGap,
  setMaterialMode,
  setMeshInstances,
} from '../viewer/scene';
import {
  type BuildResult,
  buildIntersectedLetterPairMeshInstances,
} from './intersected-letter-pairs';

export type RenderOptions = {
  rotatedGlyphYDegrees: number;
  sceneMeshYRotationRadians: number;
  cameraMode: CameraMode;
  materialMode: MaterialMode;
  letterSpacing: number;
  fontIdLeft: FontId;
  fontIdRight: FontId;
  baseEnabled: boolean;
  baseHeight: number;
};

export type RenderingRuntime = {
  renderIntersectedLetterPairs(
    wordLeft: string,
    wordRight: string,
    options: RenderOptions,
  ): Promise<BuildResult>;
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

      console.log('Loading fonts...', { fontIdLeft: options.fontIdLeft, fontIdRight: options.fontIdRight });
      const [fontLeft, fontRight] = await Promise.all([
        loadFont(options.fontIdLeft),
        loadFont(options.fontIdRight),
      ]);
      console.log('Fonts loaded');

      const result = buildIntersectedLetterPairMeshInstances(fontLeft, fontRight, wordLeft, wordRight, {
        rotatedGlyphYDegrees: options.rotatedGlyphYDegrees,
        sceneMeshYRotationRadians: options.sceneMeshYRotationRadians,
      });
      setGlyphGap(options.letterSpacing);
      setMeshInstances(result.meshInstances, {
        enabled: options.baseEnabled,
        height: options.baseHeight,
      });

      return result;
    },
    exportMesh(request) {
      meshExporter.exportMesh(request);
    },
    setCameraMode,
    setMaterialMode,
    dispose,
  };
}
