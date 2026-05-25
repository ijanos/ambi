import { Vector3 } from 'three';
import type { Font } from 'three/addons/loaders/FontLoader.js';
import { createIntersectedGlyphSolidFromFont } from '../geometry/font-glyph';
import { manifoldToThree } from '../viewer/mesh-bridge';
import type { MeshInstance } from '../viewer/scene';
import { createLetterPairs } from '../word-pairs';

type BuildIntersectedLetterPairMeshInstancesOptions = {
  rotatedGlyphYDegrees: number;
  sceneMeshYRotationRadians: number;
};

export function buildIntersectedLetterPairMeshInstances(
  font: Font,
  wordLeft: string,
  wordRight: string,
  options: BuildIntersectedLetterPairMeshInstancesOptions,
): MeshInstance[] {
  const letterPairs = createLetterPairs(wordLeft, wordRight);

  console.log('Creating intersected letter pairs...', {
    wordLeft,
    wordRight,
    pairCount: letterPairs.length,
    rotatedGlyphYDegrees: options.rotatedGlyphYDegrees,
  });

  const meshInstances = letterPairs.map(({ leftCharacter, rightCharacter }) => {
    console.log('Creating intersected pair', {
      leftCharacter,
      rightCharacter,
    });

    using intersection = createIntersectedGlyphSolidFromFont(
      font,
      leftCharacter,
      rightCharacter,
      options.rotatedGlyphYDegrees,
    );

    return {
      geometry: manifoldToThree(intersection.getMesh()),
      rotation: new Vector3(0, options.sceneMeshYRotationRadians, 0),
    };
  });

  console.log('Intersected letter pairs rendered', {
    sceneMeshYRotationRadians: options.sceneMeshYRotationRadians,
  });

  return meshInstances;
}
