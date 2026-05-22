import type { ManifoldToplevel, Mesh, Polygons, FillRule, SimplePolygon } from 'manifold-3d';
import { getManifold } from './manifold';

export function createTestSolid(): Mesh {
  const manifold: ManifoldToplevel = getManifold();

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

  const contours: Polygons = [outerA, innerCutout];
  const fillRule: FillRule = 'EvenOdd';
  const crossSection = manifold.CrossSection.ofPolygons(contours, fillRule);
  const solid = crossSection.extrude(150, 0, 0, [1, 1], true);

  return solid.getMesh();
}
