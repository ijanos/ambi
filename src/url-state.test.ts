import { describe, expect, it } from 'vitest';
import type { AppState } from './app-state';
import type { FontId } from './fonts/catalog.generated';
import { decodeState, encodeState } from './url-state';

const defaults: AppState = {
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
};

describe('encodeState / decodeState round-trip', () => {
  it('round-trips a full state', () => {
    const state: AppState = {
      wordLeft: 'LISTEN',
      wordRight: 'SILENT',
      wordAngle: 60,
      letterSpacing: 75,
      fontIdLeft: 'bungee-regular',
      fontIdRight: 'orbitron-regular',
      baseEnabled: false,
      baseHeight: 33,
      cameraMode: 'orthographic',
      materialMode: 'wireframe',
    };
    const fragment = encodeState(state);
    expect(fragment).toBe('LISTEN&SILENT&75&bungee-regular&orbitron-regular&0&33&o&w&60');
    expect(decodeState(`#${fragment}`, defaults)).toEqual(state);
  });

  it('round-trips the __same__ sentinel for fontIdRight', () => {
    const state: AppState = { ...defaults, fontIdLeft: 'lora-normal-400', fontIdRight: '__same__' };
    expect(encodeState(state)).toBe('HELLO&WORLD&50&lora-normal-400&__same__&1&20&p&c&90');
    expect(decodeState(encodeState(state), defaults)).toEqual(state);
  });

  it('round-trips all camera and material short forms', () => {
    for (const cameraMode of ['perspective', 'orthographic'] as const) {
      for (const materialMode of ['base-color', 'normal-vectors', 'wireframe'] as const) {
        const state: AppState = { ...defaults, cameraMode, materialMode };
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

  it('keeps existing shared links at the default angle', () => {
    expect(decodeState('#HELLO&WORLD&50&monda&__same__&1&20&p&c', defaults)).toEqual(defaults);
  });
});

describe('decodeState invalid fields fall back to defaults', () => {
  it.each(['', 'notanumber', '29', '151', '90.5', 'Infinity'])(
    'falls back on invalid word angle: %j',
    (angle) => {
      expect(
        decodeState(`#HELLO&WORLD&50&monda&__same__&1&20&p&c&${angle}`, defaults).wordAngle,
      ).toBe(90);
    },
  );

  it.each([30, 90, 150])('preserves a supported word angle: %i', (wordAngle) => {
    const state: AppState = { ...defaults, wordAngle };
    expect(decodeState(encodeState(state), defaults)).toEqual(state);
  });

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
    const state: AppState = { ...defaults, wordLeft: 'A B', wordRight: 'C&D' };
    expect(encodeState(state)).toBe('A%20B&C%26D&50&monda&__same__&1&20&p&c&90');
    expect(decodeState(encodeState(state), defaults)).toEqual(state);
  });

  it('encodes literal percent signs and non-ASCII', () => {
    const state: AppState = { ...defaults, wordLeft: '50%', wordRight: 'café' };
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
    const state: AppState = { ...defaults, fontIdLeft: fontId, fontIdRight: fontId };
    expect(encodeState(state)).toBe(
      'HELLO&WORLD&50&roboto-normal-800&roboto-normal-800&1&20&p&c&90',
    );
    expect(decodeState(encodeState(state), defaults)).toEqual(state);
  });
});
