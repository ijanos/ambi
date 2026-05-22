import type { ManifoldToplevel, Mesh } from 'manifold-3d';
import { getManifold } from './manifold';

export function createTestSolid(): Mesh {
  const manifold: ManifoldToplevel = getManifold();
  const solid = manifold.Manifold.cube([100, 100, 100], true);

  return solid.getMesh();
}
