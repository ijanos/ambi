import helvetikerRegularFontUrl from '../assets/fonts/helvetiker_regular.typeface.json?url';
import mondaFontUrl from '../assets/fonts/monda.typeface.json?url';
import optimerRegularFontUrl from '../assets/fonts/optimer_regular.typeface.json?url';

export type FontId = 'monda' | 'helvetiker-regular' | 'optimer-regular';

export type FontDefinition = {
  id: FontId;
  label: string;
  url: string;
};

const FONT_DEFINITIONS: readonly FontDefinition[] = [
  {
    id: 'monda',
    label: 'Monda',
    url: mondaFontUrl,
  },
  {
    id: 'helvetiker-regular',
    label: 'Helvetiker Regular',
    url: helvetikerRegularFontUrl,
  },
  {
    id: 'optimer-regular',
    label: 'Optimer Regular',
    url: optimerRegularFontUrl,
  },
];

const FONT_DEFINITION_MAP: ReadonlyMap<FontId, FontDefinition> = new Map(
  FONT_DEFINITIONS.map((font) => [font.id, font]),
);

export const DEFAULT_FONT_ID: FontId = 'monda';

export const FONT_OPTIONS: readonly { id: FontId; label: string }[] = FONT_DEFINITIONS.map((font) => ({
  id: font.id,
  label: font.label,
}));

export function getFontDefinition(fontId: FontId): FontDefinition {
  const definition = FONT_DEFINITION_MAP.get(fontId);
  if (!definition) {
    throw new Error(`Unknown font id: ${fontId}`);
  }

  return definition;
}

export function isFontId(value: string): value is FontId {
  return FONT_DEFINITION_MAP.has(value as FontId);
}
