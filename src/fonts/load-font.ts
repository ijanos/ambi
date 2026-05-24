import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';
import type { FontId } from './catalog';
import { getFontDefinition } from './catalog';

const loader = new FontLoader();
const fontPromiseCache = new Map<FontId, Promise<Font>>();

export function loadFont(fontId: FontId): Promise<Font> {
  const cached = fontPromiseCache.get(fontId);
  if (cached) {
    return cached;
  }

  const { url } = getFontDefinition(fontId);
  const pendingLoad = loader.loadAsync(url).catch((error) => {
    fontPromiseCache.delete(fontId);
    throw error;
  });

  fontPromiseCache.set(fontId, pendingLoad);
  return pendingLoad;
}
