import './style.css';
import type { Font } from 'three/addons/loaders/FontLoader.js';
import { createIntersectedGlyphSolidFromFont } from './geometry/font-glyph';
import { initManifold } from './geometry/manifold';
import { loadMondaFont } from './fonts/load-font';
import { manifoldToThree } from './viewer/mesh-bridge';
import { dispose, initScene, setMeshInstances } from './viewer/scene';

const DEFAULT_WORD_LEFT = 'HELLO';
const DEFAULT_WORD_RIGHT = 'WORLD';
const ROTATED_GLYPH_Y_DEGREES = 90;
const SCENE_MESH_Y_ROTATION_RADIANS = -Math.PI / 4;

type LetterPair = {
  leftCharacter: string;
  rightCharacter: string;
  index: number;
};

type Controls = {
  form: HTMLFormElement;
  wordLeftInput: HTMLInputElement;
  wordRightInput: HTMLInputElement;
};

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element as T;
}

function getControls(): Controls {
  return {
    form: requireElement<HTMLFormElement>('#controls-form'),
    wordLeftInput: requireElement<HTMLInputElement>('#word1'),
    wordRightInput: requireElement<HTMLInputElement>('#word2'),
  };
}

function normalizeWord(value: string): string {
  return value.trim();
}

function assertWordsPresent(wordLeft: string, wordRight: string) {
  if (wordLeft.length === 0 || wordRight.length === 0) {
    throw new Error('Both words are required.');
  }
}

function assertSameLength(wordLeft: string, wordRight: string) {
  if (wordLeft.length !== wordRight.length) {
    throw new Error(
      `Expected words of equal length, got ${JSON.stringify(wordLeft)} (${wordLeft.length}) and ${JSON.stringify(wordRight)} (${wordRight.length})`,
    );
  }
}

function createLetterPairs(wordLeft: string, wordRight: string): LetterPair[] {
  assertWordsPresent(wordLeft, wordRight);
  assertSameLength(wordLeft, wordRight);

  return Array.from(wordLeft, (leftCharacter, index) => ({
    leftCharacter,
    rightCharacter: wordRight[index]!,
    index,
  }));
}

function renderWordPairPreview(font: Font, wordLeft: string, wordRight: string) {
  const normalizedWordLeft = normalizeWord(wordLeft);
  const normalizedWordRight = normalizeWord(wordRight);
  const letterPairs = createLetterPairs(normalizedWordLeft, normalizedWordRight);

  console.log('Creating intersected letter pairs...', {
    wordLeft: normalizedWordLeft,
    wordRight: normalizedWordRight,
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

    const controls = getControls();
    controls.wordLeftInput.value = DEFAULT_WORD_LEFT;
    controls.wordRightInput.value = DEFAULT_WORD_RIGHT;

    console.log('Loading Monda font...');
    const font = await loadMondaFont();
    console.log('Monda font loaded');

    const renderFromInputs = () => {
      renderWordPairPreview(font, controls.wordLeftInput.value, controls.wordRightInput.value);
    };

    controls.form.addEventListener('submit', (event) => {
      event.preventDefault();

      try {
        renderFromInputs();
      } catch (error) {
        console.error('Error during generation:', error);
      }
    });

    renderFromInputs();
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main();
window.addEventListener('beforeunload', dispose);
