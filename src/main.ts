import './style.css';
import { createIntersectedGlyphSolidFromFont } from './geometry/font-glyph';
import { initManifold } from './geometry/manifold';
import { loadMondaFont } from './fonts/load-font';
import { manifoldToThree } from './viewer/mesh-bridge';
import { dispose, initScene, setMeshInstances } from './viewer/scene';

const WORD_LEFT = 'HELLO';
const WORD_RIGHT = 'WORLD';
const ROTATED_GLYPH_Y_DEGREES = 90;
const SCENE_MESH_Y_ROTATION_RADIANS = - Math.PI / 4;

type LetterPair = {
  leftCharacter: string;
  rightCharacter: string;
  index: number;
};

function assertSameLength(wordLeft: string, wordRight: string) {
  if (wordLeft.length !== wordRight.length) {
    throw new Error(
      `Expected words of equal length, got ${JSON.stringify(wordLeft)} (${wordLeft.length}) and ${JSON.stringify(wordRight)} (${wordRight.length})`,
    );
  }
}

function createLetterPairs(wordLeft: string, wordRight: string): LetterPair[] {
  assertSameLength(wordLeft, wordRight);

  return Array.from(wordLeft, (leftCharacter, index) => ({
    leftCharacter,
    rightCharacter: wordRight[index] ?? '',
    index,
  }));
}

async function main() {
  try {
    console.log('Initializing Manifold...');
    await initManifold();
    console.log('Manifold initialized');

    const viewerContainer = document.getElementById('viewer');
    if (!viewerContainer) {
      throw new Error('Viewer container not found');
    }

    console.log('Initializing scene...');
    initScene(viewerContainer);
    console.log('Scene initialized');

    console.log('Loading Monda font...');
    const font = await loadMondaFont();
    console.log('Monda font loaded');

    const letterPairs = createLetterPairs(WORD_LEFT, WORD_RIGHT);
    console.log('Creating intersected letter pairs...', {
      wordLeft: WORD_LEFT,
      wordRight: WORD_RIGHT,
      pairCount: letterPairs.length,
      rotatedGlyphYDegrees: ROTATED_GLYPH_Y_DEGREES,
    });

    const meshInstances = letterPairs.map(({ leftCharacter, rightCharacter, index }) => {
      console.log('Creating intersected pair', {
        index,
        leftCharacter,
        rightCharacter,
      });

      const intersection = createIntersectedGlyphSolidFromFont(
        font,
        leftCharacter,
        rightCharacter,
        ROTATED_GLYPH_Y_DEGREES,
      );

      return {
        geometry: manifoldToThree(intersection.getMesh()),
        rotation: [0, SCENE_MESH_Y_ROTATION_RADIANS, 0] as const,
      };
    });

    setMeshInstances(meshInstances);
    console.log('Intersected letter pairs rendered', {
      sceneMeshYRotationRadians: SCENE_MESH_Y_ROTATION_RADIANS,
    });
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main();
window.addEventListener('beforeunload', dispose);
