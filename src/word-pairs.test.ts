import { describe, expect, it } from 'vitest';
import { assertSameLength, createLetterPairs, normalizeWord } from './word-pairs';

describe('normalizeWord', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeWord('  HELLO  ')).toBe('HELLO');
  });
});

describe('assertSameLength', () => {
  it('does not throw for equal-length words', () => {
    expect(() => assertSameLength('HELLO', 'WORLD')).not.toThrow();
  });

  it('throws for different-length words', () => {
    expect(() => assertSameLength('HI', 'WORLD')).toThrow(/equal length/);
  });
});

describe('createLetterPairs', () => {
  it('creates letter pairs', () => {
    expect(createLetterPairs('AB', 'CD')).toEqual([
      { leftCharacter: 'A', rightCharacter: 'C' },
      { leftCharacter: 'B', rightCharacter: 'D' },
    ]);
  });

  it('throws when either word is empty', () => {
    expect(() => createLetterPairs('', 'AB')).toThrow('Both words are required.');
  });
});
