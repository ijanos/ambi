import { FontLoader, type Font } from 'three/addons/loaders/FontLoader.js';

const MONDA_FONT_URL = '/monda.typeface.json';
const loader = new FontLoader();

export async function loadMondaFont(): Promise<Font> {
  return loader.loadAsync(MONDA_FONT_URL);
}
