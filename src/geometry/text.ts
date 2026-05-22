import * as THREE from 'three';
import type { Font } from 'three/addons/loaders/FontLoader.js';

const TEXT_SIZE = 100;

export function createFlatTextGeometry(text: string, font: Font): THREE.ShapeGeometry {
  const shapes = font.generateShapes(text, TEXT_SIZE);
  const geometry = new THREE.ShapeGeometry(shapes);

  geometry.computeBoundingBox();
  geometry.center();
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}
