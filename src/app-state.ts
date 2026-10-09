import type { FontId } from './fonts/catalog.generated';
import type { CameraMode, MaterialMode } from './types';
import { normalizeWord } from './word-pairs';

export type AppState = {
  wordLeft: string;
  wordRight: string;
  /** Slider and URL values are in tenths of a scene unit. */
  letterSpacing: number;
  fontIdLeft: FontId;
  fontIdRight: FontId | '__same__';
  baseEnabled: boolean;
  /** Slider and URL values are in tenths of a scene unit. */
  baseHeight: number;
  cameraMode: CameraMode;
  materialMode: MaterialMode;
};

export type RenderSettings = Omit<
  AppState,
  'wordLeft' | 'wordRight' | 'fontIdRight' | 'letterSpacing' | 'baseHeight'
> & {
  fontIdRight: FontId;
  /** Scene units. */
  letterSpacing: number;
  /** Scene units. */
  baseHeight: number;
};

/** Resolves the linked font and converts both dimensions to scene units. */
export function toRenderSettings(state: AppState): RenderSettings {
  return {
    letterSpacing: state.letterSpacing / 10,
    fontIdLeft: state.fontIdLeft,
    fontIdRight: state.fontIdRight === '__same__' ? state.fontIdLeft : state.fontIdRight,
    baseEnabled: state.baseEnabled,
    baseHeight: state.baseHeight / 10,
    cameraMode: state.cameraMode,
    materialMode: state.materialMode,
  };
}

export function geometryFingerprint(state: AppState): string {
  const { letterSpacing, fontIdLeft, fontIdRight, baseEnabled, baseHeight } =
    toRenderSettings(state);
  return JSON.stringify([
    normalizeWord(state.wordLeft),
    normalizeWord(state.wordRight),
    letterSpacing,
    fontIdLeft,
    fontIdRight,
    baseEnabled,
    baseHeight,
  ]);
}
