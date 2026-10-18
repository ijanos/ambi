export type LetterPair = {
  leftCharacter: string;
  rightCharacter: string;
};

export function normalizeWord(value: string): string {
  return value.trim();
}

export function assertWordsPresent(wordLeft: string, wordRight: string) {
  if (wordLeft.length === 0 || wordRight.length === 0) {
    throw new Error('Both words are required.');
  }
}

export function assertSameLength(wordLeft: string, wordRight: string) {
  const leftCount = Array.from(wordLeft).length;
  const rightCount = Array.from(wordRight).length;
  if (leftCount !== rightCount) {
    throw new Error(
      `Expected words of equal length, got "${wordLeft}" (${leftCount}) and "${wordRight}" (${rightCount})`,
    );
  }
}

export function createLetterPairs(wordLeft: string, wordRight: string): LetterPair[] {
  assertWordsPresent(wordLeft, wordRight);
  assertSameLength(wordLeft, wordRight);
  const rightCharacters = Array.from(wordRight);

  return Array.from(wordLeft, (leftCharacter, index) => ({
    leftCharacter,
    // biome-ignore lint/style/noNonNullAssertion: assertSameLength guarantees matching code point counts
    rightCharacter: rightCharacters[index]!,
  }));
}
