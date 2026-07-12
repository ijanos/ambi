// Polyfill Symbol.dispose at the absolute entry point for all browser environments (like Safari)
if (typeof Symbol !== 'undefined' && !Symbol.dispose) {
  Object.defineProperty(Symbol, 'dispose', {
    value: Symbol.for('Symbol.dispose'),
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

import { DEFAULT_FONT_ID, FONT_OPTIONS } from './fonts/catalog.generated';
import type { RenderingRuntime, RenderOptions } from './rendering/runtime';
import { ControlsPanel } from './ui/controls-panel';
import { decodeState, encodeState } from './url-state';

const DEFAULT_WORD_LEFT = 'HELLO';
const DEFAULT_WORD_RIGHT = 'WORLD';
const ROTATED_GLYPH_Y_DEGREES = 90;
const SCENE_MESH_Y_ROTATION_RADIANS = -Math.PI / 4;

const EASTER_EGG_PAIRS: readonly [string, string][] = [
  ['BAKE', 'CAKE'],
  ['BOAT', 'COAT'],
  ['CAT', 'BAT'],
  ['CHAOS', 'ORDER'],
  ['HISTORY', 'MYSTERY'],
  ['LISTEN', 'SILENT'],
  ['LOVE', 'HATE'],
  ['PING', 'PONG'],
  ['TIK', 'TOK'],
  ['FLIP', 'FLOP'],
  ['BLACK', 'WHITE'],
  ['FAST', 'SLOW'],
  ['MORE', 'LESS'],
  ['SING', 'SONG'],
  ['DUSK', 'DAWN'],
  ['WORK', 'PLAY'],
  ['PUSH', 'PULL'],
];

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

function showWebGlUnavailableWarning(container: HTMLElement): void {
  const loader = container.querySelector('#viewer-loader');
  loader?.remove();

  const warning = document.createElement('div');
  warning.className = 'viewer-loader';
  warning.setAttribute('role', 'alert');
  warning.setAttribute('aria-label', 'WebGL unavailable');
  warning.innerHTML =
    '<p>JavaScript is enabled, but WebGL is not available. WebGL is required for this application.</p>';
  container.append(warning);

  container.classList.remove('is-ready');
  container.setAttribute('aria-busy', 'false');
}

async function main() {
  let disposeRenderingRuntime: (() => void) | undefined;

  try {
    const viewerContainer = document.getElementById('viewer');
    if (!viewerContainer) {
      throw new Error('Viewer container not found');
    }

    if (!isWebGLAvailable()) {
      showWebGlUnavailableWarning(viewerContainer);
      return;
    }

    const controlsPanel = new ControlsPanel({
      defaultWordLeft: DEFAULT_WORD_LEFT,
      defaultWordRight: DEFAULT_WORD_RIGHT,
      defaultFontId: DEFAULT_FONT_ID,
      fontOptions: FONT_OPTIONS,
    });

    let appIsUpdatingHash = false;
    const pushUrlState = () => {
      appIsUpdatingHash = true;
      try {
        history.pushState(null, '', `#${encodeState(controlsPanel.getUrlState())}`);
      } finally {
        appIsUpdatingHash = false;
      }
    };

    const defaultUrlState = controlsPanel.getUrlState();
    controlsPanel.applyUrlState(decodeState(location.hash, defaultUrlState));

    let renderingRuntimePromise: Promise<RenderingRuntime> | undefined;

    let lastBasename: string | undefined;
    let lastFingerprint: string | undefined;

    const getRenderingRuntime = () => {
      if (!renderingRuntimePromise) {
        renderingRuntimePromise = import('./rendering/runtime').then(
          async ({ createRenderingRuntime }) => {
            const runtime = await createRenderingRuntime(viewerContainer);
            disposeRenderingRuntime = runtime.dispose;
            return runtime;
          },
        );
      }

      return renderingRuntimePromise;
    };

    const getFileBasename = (wordLeft: string, wordRight: string): string =>
      `${wordLeft}_${wordRight}`;

    const syncDownloadDirtyState = () => {
      const validation = controlsPanel.syncValidation();
      if (!validation.isValid || !lastBasename) {
        controlsPanel.setActionButtonsDisabled(true);
        return;
      }

      const currentBasename = getFileBasename(
        validation.normalizedWordLeft,
        validation.normalizedWordRight,
      );
      const isDirty =
        currentBasename !== lastBasename || controlsPanel.fingerprint !== lastFingerprint;

      controlsPanel.setActionButtonsDisabled(isDirty);
    };

    const renderFromInputs = async (opts: { skipHashWrite?: boolean } = {}) => {
      const validation = controlsPanel.syncValidation();
      if (!validation.isValid) {
        controlsPanel.setActionButtonsDisabled(true);
        return;
      }

      const settings = controlsPanel.getRenderSettings();
      const renderOptions: RenderOptions = {
        rotatedGlyphYDegrees: ROTATED_GLYPH_Y_DEGREES,
        sceneMeshYRotationRadians: SCENE_MESH_Y_ROTATION_RADIANS,
        cameraMode: settings.cameraMode,
        materialMode: settings.materialMode,
        letterSpacing: settings.letterSpacing,
        fontIdLeft: settings.fontIdLeft,
        fontIdRight: settings.fontIdRight,
        baseEnabled: settings.baseEnabled,
        baseHeight: settings.baseHeight,
      };

      viewerContainer.classList.remove('is-ready');
      viewerContainer.setAttribute('aria-busy', 'true');

      // Yield control to the browser paint cycle to ensure the spinner is visible and animating before heavy synchronous operations block the thread.
      await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

      try {
        const renderingRuntime = await getRenderingRuntime();
        const result = await renderingRuntime.renderIntersectedLetterPairs(
          validation.normalizedWordLeft,
          validation.normalizedWordRight,
          renderOptions,
        );

        controlsPanel.showGeometryWarnings(
          result.floaterPairs,
          result.descenderPairs,
          result.elevatedPairs,
        );

        lastBasename = getFileBasename(
          validation.normalizedWordLeft,
          validation.normalizedWordRight,
        );
        lastFingerprint = controlsPanel.fingerprint;

        controlsPanel.setActionButtonsDisabled(false);
        if (!opts.skipHashWrite) {
          pushUrlState();
        }
      } finally {
        viewerContainer.classList.add('is-ready');
        viewerContainer.setAttribute('aria-busy', 'false');
      }
    };

    controlsPanel.onWordsChange(syncDownloadDirtyState);
    controlsPanel.onLetterSpacingChange(syncDownloadDirtyState);
    controlsPanel.onFontChange(syncDownloadDirtyState);
    controlsPanel.onBaseSettingsChange(syncDownloadDirtyState);
    controlsPanel.onCameraModeChange((cameraMode) => {
      void getRenderingRuntime().then((runtime) => {
        runtime.setCameraMode(cameraMode);
      });
    });
    controlsPanel.onMaterialModeChange((materialMode) => {
      void getRenderingRuntime().then((runtime) => {
        runtime.setMaterialMode(materialMode);
      });
    });
    controlsPanel.onDownload(() => {
      if (!lastBasename) {
        return;
      }

      const fileBasename = lastBasename;
      void getRenderingRuntime().then((runtime) => {
        runtime.exportMesh({
          format: 'stl',
          source: 'glyph-group',
          fileBasename,
        });
      });
    });
    controlsPanel.onShare(() => {
      void import('./ui/share-dialog').then(({ openShareDialog }) => {
        openShareDialog();
      });
    });
    controlsPanel.onSubmit(() => {
      void renderFromInputs();
    });

    window.addEventListener('popstate', () => {
      if (appIsUpdatingHash) return;
      controlsPanel.applyUrlState(decodeState(location.hash, defaultUrlState));
      void renderFromInputs({ skipHashWrite: true });
    });

    controlsPanel.setActionButtonsDisabled(true);

    controlsPanel.onLogoClick(() => {
      // biome-ignore lint/style/noNonNullAssertion: random index is bounded by array length
      const pair = EASTER_EGG_PAIRS[Math.floor(Math.random() * EASTER_EGG_PAIRS.length)]!;
      controlsPanel.setWordsAndSubmit(pair[0], pair[1]);
    });

    await renderFromInputs({ skipHashWrite: true });
  } catch (error) {
    console.error('Error during initialization:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
  }

  window.addEventListener('beforeunload', () => {
    disposeRenderingRuntime?.();
  });
}

void main();
