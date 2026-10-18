import { describe, expect, it } from 'vitest';
import { type AppState, geometryFingerprint, toRenderSettings } from './app-state';
import { decodeState, encodeState } from './url-state';

const state: AppState = {
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

describe('render settings', () => {
  it('converts existing URL dimensions to scene units and resolves the linked font', () => {
    const decoded = decodeState('#HELLO&WORLD&75&monda&__same__&1&33&p&c', state);
    expect(toRenderSettings(decoded)).toEqual({
      wordAngle: 90,
      letterSpacing: 7.5,
      fontIdLeft: 'monda',
      fontIdRight: 'monda',
      baseEnabled: true,
      baseHeight: 3.3,
      cameraMode: 'perspective',
      materialMode: 'base-color',
    });
    expect(encodeState(decoded)).toBe('HELLO&WORLD&75&monda&__same__&1&33&p&c&90');
  });

  it('preserves an independently selected right font', () => {
    expect(toRenderSettings({ ...state, fontIdRight: 'bungee-regular' }).fontIdRight).toBe(
      'bungee-regular',
    );
  });
});

describe('geometry fingerprint', () => {
  it('distinguishes words that produce identical sanitized filenames', () => {
    expect(geometryFingerprint({ ...state, wordLeft: 'A+B' })).not.toBe(
      geometryFingerprint({ ...state, wordLeft: 'A-B' }),
    );
    expect(geometryFingerprint({ ...state, wordLeft: 'A+B' })).not.toBe(
      geometryFingerprint({ ...state, wordLeft: 'A B' }),
    );
  });

  it('ignores surrounding whitespace and camera or material changes', () => {
    expect(
      geometryFingerprint({
        ...state,
        wordLeft: ' HELLO ',
        wordRight: ' WORLD ',
        cameraMode: 'orthographic',
        materialMode: 'wireframe',
      }),
    ).toBe(geometryFingerprint(state));
  });

  it('treats linked and explicit matching fonts as the same geometry', () => {
    expect(geometryFingerprint({ ...state, fontIdRight: 'monda' })).toBe(
      geometryFingerprint(state),
    );
  });

  it.each<Partial<AppState>>([
    { wordLeft: 'WORLD' },
    { wordRight: 'HELLO' },
    { wordAngle: 60 },
    { fontIdLeft: 'bungee-regular' },
    { fontIdRight: 'bungee-regular' },
    { letterSpacing: 75 },
    { baseEnabled: false },
    { baseHeight: 33 },
  ])('detects a geometry change: %j', (change) => {
    expect(geometryFingerprint({ ...state, ...change })).not.toBe(geometryFingerprint(state));
  });
});
