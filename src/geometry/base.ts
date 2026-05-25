import { getManifold } from './manifold';
import type { Manifold as ManifoldSolid, SimplePolygon } from 'manifold-3d';

/**
 * Creates a 3D base geometry in Manifold with a top chamfer and vertical side chamfers,
 * but keeping a flat bottom for easy 3D printing.
 *
 * @param width Overall width of the base
 * @param depth Overall depth of the base
 * @param height Overall height of the base
 * @param chamfer Chamfer dimension (defaults to 1.5)
 */
export function createChamferedBaseSolid(
  width: number,
  depth: number,
  height: number,
  chamfer: number = 1.5,
): ManifoldSolid {
  const manifold = getManifold();

  // Ensure chamfer is safe and doesn't invert the geometry
  const actualChamfer = Math.max(0.1, Math.min(chamfer, height / 2, width / 2, depth / 2));

  const hw = width / 2;
  const hd = depth / 2;
  const c = actualChamfer;

  // 1. Define a 2D chamfered rectangle in the XY plane (wound counter-clockwise)
  const points: SimplePolygon = [
    [-hw + c, -hd],
    [hw - c, -hd],
    [hw, -hd + c],
    [hw, hd - c],
    [hw - c, hd],
    [-hw + c, hd],
    [-hw, hd - c],
    [-hw, -hd + c],
  ];

  // 2. Create the 2D CrossSection
  using crossSection = manifold.CrossSection.ofPolygons([points]);

  // 3. Extrude the bottom straight body of height (height - actualChamfer)
  const straightHeight = height - actualChamfer;
  using straightBody = crossSection.extrude(straightHeight, 0, 0);

  // 4. Extrude the top tapered body of height actualChamfer
  // The scale scales down the top face to create a 45-degree slope on all sides
  const scaleX = (width - 2 * actualChamfer) / width;
  const scaleY = (depth - 2 * actualChamfer) / depth;
  using taperedTop = crossSection.extrude(actualChamfer, 0, 0, [scaleX, scaleY], false);

  // Translate the tapered top to sit directly on top of the straight body
  using translatedTop = taperedTop.translate(0, 0, straightHeight);

  // 5. Union the straight body and the tapered top to form a single solid
  using baseZSolid = straightBody.add(translatedTop);

  // 6. Rotate -90 degrees around the X-axis so its height is along Y and depth is along Z
  const baseSolid = baseZSolid.rotate(-90, 0, 0);

  return baseSolid;
}
