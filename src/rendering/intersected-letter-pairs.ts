import { Vector3 } from 'three';
import type { Font } from 'three/addons/loaders/FontLoader.js';
import { createIntersectedGlyphSolidFromFont } from '../geometry/font-glyph';
import { manifoldToThree } from '../viewer/mesh-bridge';
import type { MeshInstance } from '../viewer/scene';
import { createLetterPairs } from '../word-pairs';

export type BuildResult = {
  meshInstances: MeshInstance[];
  /** Character pairs (e.g. "L/R") where floating intersection geometry was detected. */
  floaterPairs: string[];
  /** Character pairs where one or both glyph outlines extend below the baseline. */
  descenderPairs: string[];
  /** Character pairs where one or both glyph outlines are entirely above the baseline. */
  elevatedPairs: string[];
};

type BuildIntersectedLetterPairMeshInstancesOptions = {
  rotatedGlyphYDegrees: number;
  sceneMeshYRotationRadians: number;
};

export function buildIntersectedLetterPairMeshInstances(
  fontLeft: Font,
  fontRight: Font,
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
  const descenderPairs: string[] = [];
  const elevatedPairs: string[] = [];
  const meshInstances = letterPairs.map(({ leftCharacter, rightCharacter }) => {
    console.log('Creating intersected pair', {
      leftCharacter,
      rightCharacter,
    });

    const {
      solid: intersection,
      floaterCount,
      leftBaseline,
      rightBaseline,
    } = createIntersectedGlyphSolidFromFont(
      fontLeft,
      fontRight,
      leftCharacter,
      rightCharacter,
      options.rotatedGlyphYDegrees,
    );

    // using takes ownership of the solid for automatic disposal
    using _solid = intersection;

    if (floaterCount > 0) {
      floaterPairs.push(`${leftCharacter}/${rightCharacter}`);
    }
    if (leftBaseline.hasDescender || rightBaseline.hasDescender) {
      descenderPairs.push(`${leftCharacter}/${rightCharacter}`);
    }
    if (leftBaseline.isElevated || rightBaseline.isElevated) {
      elevatedPairs.push(`${leftCharacter}/${rightCharacter}`);
    }

    return {
      geometry: manifoldToThree(intersection.getMesh()),
      rotation: new Vector3(0, options.sceneMeshYRotationRadians, 0),
    };
  });

  console.log('Intersected letter pairs rendered', {
    sceneMeshYRotationRadians: options.sceneMeshYRotationRadians,
  });

  return { meshInstances, floaterPairs, descenderPairs, elevatedPairs };
}
