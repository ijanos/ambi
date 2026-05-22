import ManifoldModule, { type ManifoldToplevel } from 'manifold-3d';

let manifold: ManifoldToplevel | undefined;

export async function initManifold(): Promise<void> {
  manifold = await ManifoldModule();
  manifold.setup();
}

export function getManifold(): ManifoldToplevel {
  if (!manifold) {
    throw new Error('Manifold not initialized. Call initManifold() first.');
  }
  return manifold;
}
