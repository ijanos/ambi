import type {
  FillRule,
  ManifoldToplevel,
  Mesh,
  Polygons,
  SimplePolygon,
} from 'manifold-3d';
import { getManifold } from './manifold';

export const GLYPH_DEPTH = 200;

function extrudeGlyph(
  manifold: ManifoldToplevel,
  contours: Polygons,
  fillRule: FillRule,
  depth = GLYPH_DEPTH,
): Mesh {
  const crossSection = manifold.CrossSection.ofPolygons(contours, fillRule);
  const solid = crossSection.extrude(depth, 0, 0, [1, 1], true);

  return solid.getMesh();
}

export function createLetterASolid(): Mesh {
  const manifold = getManifold();

  const outerA: SimplePolygon = [
    [0, 0],
    [18, 0],
    [30, 28],
    [70, 28],
    [82, 0],
    [100, 0],
    [62, 120],
    [38, 120],
  ];

  const innerCutout: SimplePolygon = [
    [40, 48],
    [60, 48],
    [50, 82],
  ];

  return extrudeGlyph(manifold, [outerA, innerCutout], 'EvenOdd');
}

export function createLetterXSolid(): Mesh {
  const manifold = getManifold();

  const diagonalOne: SimplePolygon = [
    [0, 15],
    [15, 0],
    [100, 85],
    [85, 100],
  ];

  const diagonalTwo: SimplePolygon = [
    [85, 0],
    [100, 15],
    [15, 100],
    [0, 85],
  ];

  return extrudeGlyph(manifold, [diagonalOne, diagonalTwo], 'Positive');
}

export function createTestSolid(): Mesh {
  return createLetterASolid();
}
