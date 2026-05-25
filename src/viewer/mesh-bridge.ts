import * as THREE from 'three';

export interface ManifoldMesh {
  vertProperties: Float32Array;
  triVerts: Uint32Array;
  numProp: number;
}

function extractPositions(mesh: ManifoldMesh): Float32Array {
  const { vertProperties, numProp } = mesh;

  if (numProp < 3) {
    throw new Error(
      `Invalid Manifold mesh: expected at least 3 properties per vertex, got ${numProp}`,
    );
  }

  const vertexCount = vertProperties.length / numProp;
  const positions = new Float32Array(vertexCount * 3);

  for (let i = 0; i < vertexCount; i++) {
    const src = i * numProp;
    const dst = i * 3;
    positions[dst] = vertProperties[src];
    positions[dst + 1] = vertProperties[src + 1];
    positions[dst + 2] = vertProperties[src + 2];
  }

  return positions;
}

export function manifoldToThree(mesh: ManifoldMesh): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions = extractPositions(mesh);

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(Array.from(mesh.triVerts));

  geo.computeBoundingBox();
  geo.computeVertexNormals();
  geo.computeBoundingSphere();

  return geo;
}
