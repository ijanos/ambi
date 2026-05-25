import type { FontId } from '../fonts/catalog';
import { isFontId } from '../fonts/catalog';
import type { CameraMode, MaterialMode } from '../types';
import { assertSameLength, assertWordsPresent, normalizeWord } from '../word-pairs';

export type WordValidation = {
  normalizedWordLeft: string;
  normalizedWordRight: string;
  leftCount: number;
  rightCount: number;
  isValid: boolean;
  message: string;
};

export type RenderSettings = {
  cameraMode: CameraMode;
  materialMode: MaterialMode;
  letterSpacing: number;
  fontId: FontId;
  baseEnabled: boolean;
  baseHeight: number;
};

export type FontOption = {
  id: FontId;
  label: string;
};

export type ControlsPanel = {
  syncValidation(): WordValidation;
  getRenderSettings(): RenderSettings;
  setDownloadDisabled(isDisabled: boolean): void;
  showFloaterWarning(floaterPairs: string[]): void;
  clearFloaterWarning(): void;
  onWordsChange(handler: () => void): void;
  onLetterSpacingChange(handler: (letterSpacing: number) => void): void;
  onFontChange(handler: (fontId: FontId) => void): void;
  onCameraModeChange(handler: (cameraMode: CameraMode) => void): void;
  onMaterialModeChange(handler: (materialMode: MaterialMode) => void): void;
  onBaseSettingsChange(handler: () => void): void;
  onDownload(handler: () => void): void;
  onSubmit(handler: () => void): void;
};

type Controls = {
  form: HTMLFormElement;
  wordLeftInput: HTMLInputElement;
  wordRightInput: HTMLInputElement;
  wordLeftLabel: HTMLLabelElement;
  wordRightLabel: HTMLLabelElement;
  letterSpacingInput: HTMLInputElement;
  fontSelect: HTMLSelectElement;
  cameraModeSelect: HTMLSelectElement;
  materialModeSelect: HTMLSelectElement;
  downloadStlButton: HTMLButtonElement;
  validationMessage: HTMLDivElement;
  baseEnabledInput: HTMLInputElement;
  baseHeightInput: HTMLInputElement;
  baseHeightLabel: HTMLLabelElement;
};

type ControlsPanelOptions = {
  defaultWordLeft: string;
  defaultWordRight: string;
  defaultFontId: FontId;
  fontOptions: readonly FontOption[];
};

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }

  return element as T;
}

function getControls(): Controls {
  return {
    form: requireElement<HTMLFormElement>('#controls-form'),
    wordLeftInput: requireElement<HTMLInputElement>('#word1'),
    wordRightInput: requireElement<HTMLInputElement>('#word2'),
    wordLeftLabel: requireElement<HTMLLabelElement>('#word1-label'),
    wordRightLabel: requireElement<HTMLLabelElement>('#word2-label'),
    letterSpacingInput: requireElement<HTMLInputElement>('#letter-spacing'),
    fontSelect: requireElement<HTMLSelectElement>('#font-selector'),
    cameraModeSelect: requireElement<HTMLSelectElement>('#camera-mode'),
    materialModeSelect: requireElement<HTMLSelectElement>('#material-mode'),
    downloadStlButton: requireElement<HTMLButtonElement>('#download-stl-btn'),
    validationMessage: requireElement<HTMLDivElement>('#validation-message'),
    baseEnabledInput: requireElement<HTMLInputElement>('#base-enabled'),
    baseHeightInput: requireElement<HTMLInputElement>('#base-height'),
    baseHeightLabel: requireElement<HTMLLabelElement>('#base-height-label'),
  };
}

function setFontOptions(
  fontSelect: HTMLSelectElement,
  fontOptions: readonly FontOption[],
  defaultFontId: FontId,
) {
  fontSelect.replaceChildren(
    ...fontOptions.map((fontOption) => {
      const optionElement = document.createElement('option');
      optionElement.value = fontOption.id;
      optionElement.textContent = fontOption.label;
      return optionElement;
    }),
  );

  fontSelect.value = defaultFontId;
}

function formatWordLabel(baseLabel: string, letterCount: number): string {
  const unit = letterCount === 1 ? 'letter' : 'letters';
  return `${baseLabel} (${letterCount} ${unit})`;
}

function parseCameraMode(value: string): CameraMode {
  return value === 'orthographic' ? 'orthographic' : 'perspective';
}

function parseMaterialMode(value: string): MaterialMode {
  if (value === 'normal-vectors') return 'normal-vectors';
  if (value === 'wireframe') return 'wireframe';
  return 'base-color';
}

function parseLetterSpacing(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseFontId(value: string, fallbackFontId: FontId): FontId {
  return isFontId(value) ? value : fallbackFontId;
}

function validateWords(wordLeft: string, wordRight: string): WordValidation {
  const normalizedWordLeft = normalizeWord(wordLeft);
  const normalizedWordRight = normalizeWord(wordRight);
  const leftCount = normalizedWordLeft.length;
  const rightCount = normalizedWordRight.length;

  try {
    assertWordsPresent(normalizedWordLeft, normalizedWordRight);
    assertSameLength(normalizedWordLeft, normalizedWordRight);

    return {
      normalizedWordLeft,
      normalizedWordRight,
      leftCount,
      rightCount,
      isValid: true,
      message: '',
    };
  } catch (error) {
    return {
      normalizedWordLeft,
      normalizedWordRight,
      leftCount,
      rightCount,
      isValid: false,
      message: error instanceof Error ? error.message : 'Invalid words.',
    };
  }
}

function updateValidationUI(controls: Controls, validation: WordValidation): WordValidation {
  controls.wordLeftLabel.textContent = formatWordLabel('Word 1', validation.leftCount);
  controls.wordRightLabel.textContent = formatWordLabel('Word 2', validation.rightCount);

  controls.wordLeftInput.classList.toggle('is-invalid', !validation.isValid);
  controls.wordRightInput.classList.toggle('is-invalid', !validation.isValid);
  controls.wordLeftInput.setAttribute('aria-invalid', String(!validation.isValid));
  controls.wordRightInput.setAttribute('aria-invalid', String(!validation.isValid));

  controls.validationMessage.textContent = validation.message;
  controls.validationMessage.dataset.state = validation.isValid ? 'ready' : 'error';

  return validation;
}

export function initControlsPanel(options: ControlsPanelOptions): ControlsPanel {
  const controls = getControls();
  controls.wordLeftInput.value = options.defaultWordLeft;
  controls.wordRightInput.value = options.defaultWordRight;
  setFontOptions(controls.fontSelect, options.fontOptions, options.defaultFontId);

  const syncValidation = () => updateValidationUI(
    controls,
    validateWords(controls.wordLeftInput.value, controls.wordRightInput.value),
  );

  const updateBaseHeightLabel = () => {
    controls.baseHeightLabel.textContent = `Base Height (${controls.baseHeightInput.value})`;
  };
  controls.baseHeightInput.addEventListener('input', updateBaseHeightLabel);
  updateBaseHeightLabel();

  const updateBaseHeightVisibility = () => {
    const isEnabled = controls.baseEnabledInput.checked;
    controls.baseHeightInput.disabled = !isEnabled;
    const baseHeightGroup = document.getElementById('base-height-group');
    if (baseHeightGroup) {
      baseHeightGroup.style.opacity = isEnabled ? '1' : '0.5';
    }
  };
  controls.baseEnabledInput.addEventListener('change', updateBaseHeightVisibility);
  updateBaseHeightVisibility();

  // Floater warning element — created once, shown/hidden as needed
  const floaterWarning = document.createElement('div');
  floaterWarning.className = 'validation-message';
  floaterWarning.dataset.state = 'warning';
  floaterWarning.setAttribute('aria-live', 'polite');
  floaterWarning.hidden = true;
  controls.validationMessage.insertAdjacentElement('afterend', floaterWarning);

  const getRenderSettings = (): RenderSettings => ({
    cameraMode: parseCameraMode(controls.cameraModeSelect.value),
    materialMode: parseMaterialMode(controls.materialModeSelect.value),
    letterSpacing: parseLetterSpacing(controls.letterSpacingInput.value),
    fontId: parseFontId(controls.fontSelect.value, options.defaultFontId),
    baseEnabled: controls.baseEnabledInput.checked,
    baseHeight: Number(controls.baseHeightInput.value),
  });

  return {
    syncValidation,
    getRenderSettings,
    setDownloadDisabled(isDisabled) {
      controls.downloadStlButton.disabled = isDisabled;
    },
    showFloaterWarning(floaterPairs) {
      const pairs = floaterPairs.join(', ');
      floaterWarning.textContent =
        `Floating geometry in ${floaterPairs.length === 1 ? 'pair' : 'pairs'} ${pairs}. Result may need extra supports for 3D printing and may not stand on its own.`;
      floaterWarning.hidden = false;
    },
    clearFloaterWarning() {
      floaterWarning.hidden = true;
    },
    onWordsChange(handler) {
      controls.wordLeftInput.addEventListener('input', handler);
      controls.wordRightInput.addEventListener('input', handler);
    },
    onLetterSpacingChange(handler) {
      controls.letterSpacingInput.addEventListener('input', () => {
        handler(parseLetterSpacing(controls.letterSpacingInput.value));
      });
    },
    onFontChange(handler) {
      controls.fontSelect.addEventListener('change', () => {
        handler(parseFontId(controls.fontSelect.value, options.defaultFontId));
      });
    },
    onCameraModeChange(handler) {
      controls.cameraModeSelect.addEventListener('change', () => {
        handler(parseCameraMode(controls.cameraModeSelect.value));
      });
    },
    onMaterialModeChange(handler) {
      controls.materialModeSelect.addEventListener('change', () => {
        handler(parseMaterialMode(controls.materialModeSelect.value));
      });
    },
    onBaseSettingsChange(handler) {
      controls.baseEnabledInput.addEventListener('change', handler);
      controls.baseHeightInput.addEventListener('input', handler);
    },
    onDownload(handler) {
      controls.downloadStlButton.addEventListener('click', handler);
    },
    onSubmit(handler) {
      controls.form.addEventListener('submit', (event) => {
        event.preventDefault();
        handler();
      });
    },
  };
}
