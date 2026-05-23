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
  if (wordLeft.length !== wordRight.length) {
    throw new Error(
      `Expected words of equal length, got "${wordLeft}" (${wordLeft.length}) and "${wordRight}" (${wordRight.length})`,
    );
  }
}

export function createLetterPairs(wordLeft: string, wordRight: string): LetterPair[] {
  assertWordsPresent(wordLeft, wordRight);
  assertSameLength(wordLeft, wordRight);

  return Array.from(wordLeft, (leftCharacter, index) => ({
    leftCharacter,
    rightCharacter: wordRight[index]!,
  }));
}
