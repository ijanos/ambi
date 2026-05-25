import { Vector3 } from 'three';
import type { Font } from 'three/addons/loaders/FontLoader.js';
import { createIntersectedGlyphSolidFromFont } from '../geometry/font-glyph';
import { manifoldToThree } from '../viewer/mesh-bridge';
import type { MeshInstance } from '../viewer/scene';
import { createLetterPairs } from '../word-pairs';

export type BuildResult = {
  meshInstances: MeshInstance[];
  /** Character pairs (e.g. "L/R") where floating geometry was detected. */
  floaterPairs: string[];
};

type BuildIntersectedLetterPairMeshInstancesOptions = {
  rotatedGlyphYDegrees: number;
  sceneMeshYRotationRadians: number;
};

export function buildIntersectedLetterPairMeshInstances(
  font: Font,
  wordLeft: string,
  wordRight: string,
  options: BuildIntersectedLetterPairMeshInstancesOptions,
): BuildResult {
  const letterPairs = createLetterPairs(wordLeft, wordRight);

  console.log('Creating intersected letter pairs...', {
    wordLeft,
    wordRight,
    pairCount: letterPairs.length,
    rotatedGlyphYDegrees: options.rotatedGlyphYDegrees,
  });

  const floaterPairs: string[] = [];
  const meshInstances = letterPairs.map(({ leftCharacter, rightCharacter }) => {
    console.log('Creating intersected pair', {
      leftCharacter,
      rightCharacter,
    });

    const { solid: intersection, floaterCount } = createIntersectedGlyphSolidFromFont(
      font,
      leftCharacter,
      rightCharacter,
      options.rotatedGlyphYDegrees,
    );

    // using takes ownership of the solid for automatic disposal
    using _solid = intersection;

    if (floaterCount > 0) {
      floaterPairs.push(`${leftCharacter}/${rightCharacter}`);
    }

    return {
      geometry: manifoldToThree(intersection.getMesh()),
      rotation: new Vector3(0, options.sceneMeshYRotationRadians, 0),
    };
  });

  console.log('Intersected letter pairs rendered', {
    sceneMeshYRotationRadians: options.sceneMeshYRotationRadians,
  });

  return { meshInstances, floaterPairs };
}
