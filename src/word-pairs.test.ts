import { describe, expect, it } from 'vitest';
import { decodeState } from './url-state';
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

  it('counts supplementary characters as one character', () => {
    expect(() => assertSameLength('🆘', 'A')).not.toThrow();
    expect(() => assertSameLength('🆘', 'AB')).toThrow(/equal length/);
  });
});

describe('createLetterPairs', () => {
  it('preserves both SOS emoji from the shared URL as one pair', () => {
    const url = new URL(
      'https://ambi3d.com/#%F0%9F%86%98&%F0%9F%86%98&50&iosevka-charon-bold&__same__&1&20&p&c&90',
    );
    const state = decodeState(url.hash, {
      wordLeft: 'HELLO',
      wordRight: 'WORLD',
      wordAngle: 90,
      letterSpacing: 50,
      fontIdLeft: 'monda',
      fontIdRight: '__same__',
      baseEnabled: true,
      baseHeight: 20,
      cameraMode: 'perspective',
      materialMode: 'base-color',
    });

    expect(state.wordLeft).toBe('🆘');
    expect(state.wordRight).toBe('🆘');
    expect(state.fontIdLeft).toBe('iosevka-charon-bold');
    expect(createLetterPairs(state.wordLeft, state.wordRight)).toEqual([
      { leftCharacter: '🆘', rightCharacter: '🆘' },
    ]);
  });

  it('creates letter pairs', () => {
    expect(createLetterPairs('AB', 'CD')).toEqual([
      { leftCharacter: 'A', rightCharacter: 'C' },
      { leftCharacter: 'B', rightCharacter: 'D' },
    ]);
  });

  it('keeps subsequent pairs aligned after supplementary characters', () => {
    expect(createLetterPairs('🆘A', 'B🆘')).toEqual([
      { leftCharacter: '🆘', rightCharacter: 'B' },
      { leftCharacter: 'A', rightCharacter: '🆘' },
    ]);
  });

  it('throws when either word is empty', () => {
    expect(() => createLetterPairs('', 'AB')).toThrow('Both words are required.');
  });
});
