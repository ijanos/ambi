import type {
  FillRule,
  Manifold as ManifoldSolid,
  ManifoldToplevel,
  Mesh,
  Polygons,
  SimplePolygon,
} from 'manifold-3d';
import { getManifold } from './manifold';

export const GLYPH_DEPTH = 200;
const X_ROTATION_DEGREES = 90;

type Vec3 = readonly [number, number, number];

function getBoxCenter(solid: ManifoldSolid): Vec3 {
  const box = solid.boundingBox();
  return [
    (box.min[0] + box.max[0]) / 2,
    (box.min[1] + box.max[1]) / 2,
    (box.min[2] + box.max[2]) / 2,
  ];
}

function centerManifold(solid: ManifoldSolid): ManifoldSolid {
  const [x, y, z] = getBoxCenter(solid);
  return solid.translate(-x, -y, -z);
}

function extrudeGlyph(
  manifold: ManifoldToplevel,
  contours: Polygons,
  fillRule: FillRule,
  depth = GLYPH_DEPTH,
): ManifoldSolid {
  const crossSection = manifold.CrossSection.ofPolygons(contours, fillRule);
  const solid = crossSection.extrude(depth, 0, 0, [1, 1], true);

  return centerManifold(solid);
}

export function createLetterAManifold(): ManifoldSolid {
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

export function createLetterXManifold(): ManifoldSolid {
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

export function createLetterASolid(): Mesh {
  return createLetterAManifold().getMesh();
}

export function createLetterXSolid(): Mesh {
  return createLetterXManifold().getMesh();
}

export function createIntersectedGlyphSolid(): Mesh {
  const aGlyph = createLetterAManifold();
  const xGlyph = createLetterXManifold().rotate(0, X_ROTATION_DEGREES, 0);
  const intersection = aGlyph.intersect(xGlyph);

  return intersection.getMesh();
}

export function createTestSolid(): Mesh {
  return createIntersectedGlyphSolid();
}
