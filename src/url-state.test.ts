import { describe, expect, it } from 'vitest';
import type { FontId } from './fonts/catalog.generated';
import { decodeState, encodeState, type UrlState } from './url-state';

const defaults: UrlState = {
  wordLeft: 'HELLO',
  wordRight: 'WORLD',
  letterSpacing: 50,
  fontIdLeft: 'monda',
  fontIdRight: '__same__',
  baseEnabled: true,
  baseHeight: 20,
  cameraMode: 'perspective',
  materialMode: 'base-color',
};

describe('encodeState / decodeState round-trip', () => {
  it('round-trips a full state', () => {
    const state: UrlState = {
      wordLeft: 'LISTEN',
      wordRight: 'SILENT',
      letterSpacing: 75,
      fontIdLeft: 'bungee-regular',
      fontIdRight: 'orbitron-regular',
      baseEnabled: false,
      baseHeight: 33,
      cameraMode: 'orthographic',
      materialMode: 'wireframe',
    };
    const fragment = encodeState(state);
    expect(fragment).toBe('LISTEN&SILENT&75&bungee-regular&orbitron-regular&0&33&o&w');
    expect(decodeState(`#${fragment}`, defaults)).toEqual(state);
  });

  it('round-trips the __same__ sentinel for fontIdRight', () => {
    const state: UrlState = { ...defaults, fontIdLeft: 'lora-normal-400', fontIdRight: '__same__' };
    expect(encodeState(state)).toBe('HELLO&WORLD&50&lora-normal-400&__same__&1&20&p&c');
    expect(decodeState(encodeState(state), defaults)).toEqual(state);
  });

  it('round-trips all camera and material short forms', () => {
    for (const cameraMode of ['perspective', 'orthographic'] as const) {
      for (const materialMode of ['base-color', 'normal-vectors', 'wireframe'] as const) {
        const state: UrlState = { ...defaults, cameraMode, materialMode };
        expect(decodeState(encodeState(state), defaults)).toEqual(state);
      }
    }
  });
});

describe('decodeState missing trailing fields', () => {
  it('falls back to defaults for every trailing field', () => {
    expect(decodeState('#HELLO&WORLD', defaults)).toEqual(defaults);
    expect(decodeState('#HELLO&WORLD&50', defaults)).toEqual(defaults);
    expect(decodeState('#HELLO&WORLD&50&monda', defaults)).toEqual(defaults);
  });

  it('returns defaults for empty hash', () => {
    expect(decodeState('', defaults)).toEqual(defaults);
    expect(decodeState('#', defaults)).toEqual(defaults);
  });
});

describe('decodeState invalid fields fall back to defaults', () => {
  it('falls back on invalid letter spacing', () => {
    expect(
      decodeState('#A&B&notanumber&monda&__same__&1&20&p&c', {
        ...defaults,
        wordLeft: 'A',
        wordRight: 'B',
      }).letterSpacing,
    ).toBe(50);
    expect(
      decodeState('#A&B&999&monda&__same__&1&20&p&c', {
        ...defaults,
        wordLeft: 'A',
        wordRight: 'B',
      }).letterSpacing,
    ).toBe(50);
    expect(
      decodeState('#A&B&-1&monda&__same__&1&20&p&c', { ...defaults, wordLeft: 'A', wordRight: 'B' })
        .letterSpacing,
    ).toBe(50);
  });

  it('falls back on invalid font ids', () => {
    const d = decodeState('#A&B&50&no-such-font&also-bad&1&20&p&c', {
      ...defaults,
      wordLeft: 'A',
      wordRight: 'B',
    });
    expect(d.fontIdLeft).toBe('monda');
    expect(d.fontIdRight).toBe('monda');
  });

  it('falls back on invalid base height', () => {
    expect(
      decodeState('#A&B&50&monda&__same__&1&999&p&c', {
        ...defaults,
        wordLeft: 'A',
        wordRight: 'B',
      }).baseHeight,
    ).toBe(20);
    expect(
      decodeState('#A&B&50&monda&__same__&1&1&p&c', { ...defaults, wordLeft: 'A', wordRight: 'B' })
        .baseHeight,
    ).toBe(20);
  });

  it('falls back on invalid base enabled', () => {
    expect(
      decodeState('#A&B&50&monda&__same__&maybe&20&p&c', {
        ...defaults,
        wordLeft: 'A',
        wordRight: 'B',
      }).baseEnabled,
    ).toBe(true);
    expect(
      decodeState('#A&B&50&monda&__same__&maybe&20&p&c', {
        ...defaults,
        wordLeft: 'A',
        wordRight: 'B',
        baseEnabled: false,
      }).baseEnabled,
    ).toBe(false);
  });

  it('falls back on unrecognized camera/material short forms', () => {
    const d = decodeState('#A&B&50&monda&__same__&1&20&x&y', {
      ...defaults,
      wordLeft: 'A',
      wordRight: 'B',
    });
    expect(d.cameraMode).toBe('perspective');
    expect(d.materialMode).toBe('base-color');
  });

  it('accepts each base enabled literal', () => {
    expect(
      decodeState('#A&B&50&monda&__same__&0&20&p&c', { ...defaults, wordLeft: 'A', wordRight: 'B' })
        .baseEnabled,
    ).toBe(false);
    expect(
      decodeState('#A&B&50&monda&__same__&1&20&p&c', { ...defaults, wordLeft: 'A', wordRight: 'B' })
        .baseEnabled,
    ).toBe(true);
  });

  it('preserves __same__ sentinel from a valid token', () => {
    expect(
      decodeState('#A&B&50&monda&__same__&1&20&p&c', { ...defaults, wordLeft: 'A', wordRight: 'B' })
        .fontIdRight,
    ).toBe('__same__');
  });
});

describe('encodeState escaping', () => {
  it('percent-encodes words', () => {
    const state: UrlState = { ...defaults, wordLeft: 'A B', wordRight: 'C&D' };
    expect(encodeState(state)).toBe('A%20B&C%26D&50&monda&__same__&1&20&p&c');
    expect(decodeState(encodeState(state), defaults)).toEqual(state);
  });

  it('encodes literal percent signs and non-ASCII', () => {
    const state: UrlState = { ...defaults, wordLeft: '50%', wordRight: 'café' };
    const fragment = encodeState(state);
    expect(fragment.startsWith('50%25&caf%C3%A9&')).toBe(true);
    expect(decodeState(`#${fragment}`, defaults)).toEqual(state);
  });

  it('falls back to default word on malformed percent-encoding', () => {
    const d = decodeState('#%E0%A4&WORLD&50&monda&__same__&1&20&p&c', defaults);
    expect(d.wordLeft).toBe('HELLO');
    expect(d.wordRight).toBe('WORLD');
  });

  it('treats a valid FontId literal as a font id, not a sentinel', () => {
    const fontId: FontId = 'roboto-normal-800';
    const state: UrlState = { ...defaults, fontIdLeft: fontId, fontIdRight: fontId };
    expect(encodeState(state)).toBe('HELLO&WORLD&50&roboto-normal-800&roboto-normal-800&1&20&p&c');
    expect(decodeState(encodeState(state), defaults)).toEqual(state);
  });
});
