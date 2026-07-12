import { DEFAULT_FONT_ID, type FontId, isFontId } from './fonts/catalog.generated';
import type { CameraMode, MaterialMode } from './types';

export type UrlState = {
  wordLeft: string;
  wordRight: string;
  letterSpacing: number;
  fontIdLeft: FontId;
  fontIdRight: FontId | '__same__';
  baseEnabled: boolean;
  baseHeight: number;
  cameraMode: CameraMode;
  materialMode: MaterialMode;
};

const CAMERA_MODE_TO_SHORT: ReadonlyMap<CameraMode, string> = new Map([
  ['perspective', 'p'],
  ['orthographic', 'o'],
]);

const SHORT_TO_CAMERA_MODE: ReadonlyMap<string, CameraMode> = new Map(
  Array.from(CAMERA_MODE_TO_SHORT, ([mode, short]) => [short, mode]),
);

const MATERIAL_MODE_TO_SHORT: ReadonlyMap<MaterialMode, string> = new Map([
  ['base-color', 'c'],
  ['normal-vectors', 'n'],
  ['wireframe', 'w'],
]);

const SHORT_TO_MATERIAL_MODE: ReadonlyMap<string, MaterialMode> = new Map(
  Array.from(MATERIAL_MODE_TO_SHORT, ([mode, short]) => [short, mode]),
);

function decodeWord(token: string, fallback: string): string {
  try {
    return decodeURIComponent(token);
  } catch {
    return fallback;
  }
}

function parseRawInt(token: string, min: number, max: number, fallback: number): number {
  if (token === '') return fallback;
  const n = Number(token);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

function parseFontIdRight(token: string): FontId | '__same__' {
  if (token === '__same__') return '__same__';
  return isFontId(token) ? token : DEFAULT_FONT_ID;
}

export function encodeState(state: UrlState): string {
  const parts = [
    encodeURIComponent(state.wordLeft),
    encodeURIComponent(state.wordRight),
    String(state.letterSpacing),
    state.fontIdLeft,
    state.fontIdRight,
    state.baseEnabled ? '1' : '0',
    String(state.baseHeight),
    CAMERA_MODE_TO_SHORT.get(state.cameraMode) ?? 'p',
    MATERIAL_MODE_TO_SHORT.get(state.materialMode) ?? 'c',
  ];
  return parts.join('&');
}

export function decodeState(hash: string, defaults: UrlState): UrlState {
  const body = hash.startsWith('#') ? hash.slice(1) : hash;
  if (body === '') return { ...defaults };

  const parts = body.split('&');
  const at = <T>(index: number, parse: (token: string) => T, fallback: T): T => {
    const token = parts[index];
    return token === undefined ? fallback : parse(token);
  };

  return {
    wordLeft: at(0, (t) => decodeWord(t, defaults.wordLeft), defaults.wordLeft),
    wordRight: at(1, (t) => decodeWord(t, defaults.wordRight), defaults.wordRight),
    letterSpacing: at(
      2,
      (t) => parseRawInt(t, 0, 200, defaults.letterSpacing),
      defaults.letterSpacing,
    ),
    fontIdLeft: at(3, (t) => (isFontId(t) ? t : DEFAULT_FONT_ID), defaults.fontIdLeft),
    fontIdRight: at(4, parseFontIdRight, defaults.fontIdRight),
    baseEnabled: at(
      5,
      (t) => (t === '1' ? true : t === '0' ? false : defaults.baseEnabled),
      defaults.baseEnabled,
    ),
    baseHeight: at(6, (t) => parseRawInt(t, 2, 50, defaults.baseHeight), defaults.baseHeight),
    cameraMode: at(
      7,
      (t) => SHORT_TO_CAMERA_MODE.get(t) ?? defaults.cameraMode,
      defaults.cameraMode,
    ),
    materialMode: at(
      8,
      (t) => SHORT_TO_MATERIAL_MODE.get(t) ?? defaults.materialMode,
      defaults.materialMode,
    ),
  };
}
