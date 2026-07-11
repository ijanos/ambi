import type { FontId } from '../fonts/catalog.generated';
import { isFontId } from '../fonts/catalog.generated';
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
  fontIdLeft: FontId;
  fontIdRight: FontId;
  baseEnabled: boolean;
  baseHeight: number;
};

export type FontOption = {
  id: FontId;
  label: string;
};

type ControlsPanelOptions = {
  defaultWordLeft: string;
  defaultWordRight: string;
  defaultFontId: FontId;
  fontOptions: readonly FontOption[];
};

function requireElement<T extends Element>(selector: string, ctor: new (...args: never[]) => T): T {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  if (!(element instanceof ctor)) {
    throw new Error(`Element "${selector}" is ${element.constructor.name}, expected ${ctor.name}`);
  }
  return element as T;
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
  const parsed = Number(value) / 10;
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseFontId(value: string, fallbackFontId: FontId): FontId {
  return isFontId(value) ? value : fallbackFontId;
}

export class ControlsPanel {
  #wordLeftInput: HTMLInputElement;
  #wordRightInput: HTMLInputElement;
  #wordLeftLabel: HTMLLabelElement;
  #wordRightLabel: HTMLLabelElement;
  #letterSpacingInput: HTMLInputElement;
  #fontSelect: HTMLSelectElement;
  #fontSelect2: HTMLSelectElement;
  #cameraModeSelect: HTMLSelectElement;
  #materialModeSelect: HTMLSelectElement;
  #downloadStlButton: HTMLButtonElement;
  #validationMessage: HTMLDivElement;
  #baseEnabledInput: HTMLInputElement;
  #baseHeightInput: HTMLInputElement;
  #baseHeightLabel: HTMLLabelElement;
  #form: HTMLFormElement;

  #options: ControlsPanelOptions;
  #syncing = false;
  #mixedCaseWarning: HTMLDivElement;
  #geometryWarning: HTMLDivElement;

  constructor(options: ControlsPanelOptions) {
    this.#options = options;

    this.#form = requireElement('#controls-form', HTMLFormElement);
    this.#wordLeftInput = requireElement('#word1', HTMLInputElement);
    this.#wordRightInput = requireElement('#word2', HTMLInputElement);
    this.#wordLeftLabel = requireElement('#word1-label', HTMLLabelElement);
    this.#wordRightLabel = requireElement('#word2-label', HTMLLabelElement);
    this.#letterSpacingInput = requireElement('#letter-spacing', HTMLInputElement);
    this.#fontSelect = requireElement('#font-selector', HTMLSelectElement);
    this.#fontSelect2 = requireElement('#font-selector-2', HTMLSelectElement);
    this.#cameraModeSelect = requireElement('#camera-mode', HTMLSelectElement);
    this.#materialModeSelect = requireElement('#material-mode', HTMLSelectElement);
    this.#downloadStlButton = requireElement('#download-stl-btn', HTMLButtonElement);
    this.#validationMessage = requireElement('#validation-message', HTMLDivElement);
    this.#baseEnabledInput = requireElement('#base-enabled', HTMLInputElement);
    this.#baseHeightInput = requireElement('#base-height', HTMLInputElement);
    this.#baseHeightLabel = requireElement('#base-height-label', HTMLLabelElement);

    this.#wordLeftInput.value = options.defaultWordLeft;
    this.#wordRightInput.value = options.defaultWordRight;
    this.#setFontOptions(this.#fontSelect, options.fontOptions, options.defaultFontId);
    // Font 2 gets the same options plus a sentinel "Same as Word 1" at the top
    this.#fontSelect2.replaceChildren(
      (() => {
        const opt = document.createElement('option');
        opt.value = '__same__';
        opt.textContent = 'Same as Word 1';
        return opt;
      })(),
      ...options.fontOptions.map((fontOption) => {
        const optionElement = document.createElement('option');
        optionElement.value = fontOption.id;
        optionElement.textContent = fontOption.label;
        return optionElement;
      }),
    );
    this.#fontSelect2.value = '__same__';

    // Glyph viewer buttons
    const glyphBtn1 = document.getElementById('glyph-btn-1');
    const glyphBtn2 = document.getElementById('glyph-btn-2');
    glyphBtn1?.addEventListener('click', async () => {
      const { openGlyphViewer } = await import('./glyph-viewer');
      const fontId = parseFontId(this.#fontSelect.value, options.defaultFontId);
      openGlyphViewer(fontId);
    });
    glyphBtn2?.addEventListener('click', async () => {
      const { openGlyphViewer } = await import('./glyph-viewer');
      const fontIdLeft = parseFontId(this.#fontSelect.value, options.defaultFontId);
      const fontIdRight =
        this.#fontSelect2.value === '__same__'
          ? fontIdLeft
          : parseFontId(this.#fontSelect2.value, options.defaultFontId);
      openGlyphViewer(fontIdRight);
    });

    // Base height label
    this.#baseHeightInput.addEventListener('input', () => this.#updateBaseHeightLabel());
    this.#updateBaseHeightLabel();

    // Base height visibility
    this.#baseEnabledInput.addEventListener('change', () => this.#updateBaseHeightVisibility());
    this.#updateBaseHeightVisibility();

    // Mixed case warning — shown when either word mixes upper/lower case letters
    this.#mixedCaseWarning = document.createElement('div');
    this.#mixedCaseWarning.className = 'validation-message';
    // biome-ignore lint/complexity/useLiteralKeys: noPropertyAccessFromIndexSignature requires bracket notation for DOMStringMap
    this.#mixedCaseWarning.dataset['state'] = 'warning';
    this.#mixedCaseWarning.setAttribute('aria-live', 'polite');
    this.#mixedCaseWarning.textContent =
      'Mixing uppercase and lowercase letters can produce uneven glyphs — 3D height is determined by the smallest letter.';
    this.#mixedCaseWarning.hidden = true;
    this.#validationMessage.insertAdjacentElement('afterend', this.#mixedCaseWarning);

    // Geometry warning element — created once, shown/hidden as needed
    this.#geometryWarning = document.createElement('div');
    this.#geometryWarning.className = 'validation-message';
    // biome-ignore lint/complexity/useLiteralKeys: noPropertyAccessFromIndexSignature requires bracket notation for DOMStringMap
    this.#geometryWarning.dataset['state'] = 'warning';
    this.#geometryWarning.setAttribute('aria-live', 'polite');
    this.#geometryWarning.hidden = true;
    this.#mixedCaseWarning.insertAdjacentElement('afterend', this.#geometryWarning);
  }

  // ── Public API ──────────────────────────────────────────────────

  syncValidation(): WordValidation {
    const validation = this.#updateValidationUI(
      this.#validateWords(this.#wordLeftInput.value, this.#wordRightInput.value),
    );

    const mixedCase = this.#hasMixedCasePair(
      validation.normalizedWordLeft,
      validation.normalizedWordRight,
    );
    this.#mixedCaseWarning.hidden = !mixedCase;

    return validation;
  }

  getRenderSettings(): RenderSettings {
    const fontIdLeft = parseFontId(this.#fontSelect.value, this.#options.defaultFontId);
    const fontIdRight =
      this.#fontSelect2.value === '__same__'
        ? fontIdLeft
        : parseFontId(this.#fontSelect2.value, this.#options.defaultFontId);

    return {
      cameraMode: parseCameraMode(this.#cameraModeSelect.value),
      materialMode: parseMaterialMode(this.#materialModeSelect.value),
      letterSpacing: parseLetterSpacing(this.#letterSpacingInput.value),
      fontIdLeft,
      fontIdRight,
      baseEnabled: this.#baseEnabledInput.checked,
      baseHeight: Number(this.#baseHeightInput.value),
    };
  }

  get fingerprint(): string {
    const { letterSpacing, fontIdLeft, fontIdRight, baseEnabled, baseHeight } =
      this.getRenderSettings();
    return `${letterSpacing}|${fontIdLeft}|${fontIdRight}|${baseEnabled}|${baseHeight}`;
  }

  setWordsAndSubmit(left: string, right: string): void {
    this.#wordLeftInput.value = left;
    this.#wordRightInput.value = right;
    this.#form.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  onLogoClick(handler: () => void): void {
    const logoImg = document.querySelector<HTMLImageElement>('.sidebar img[alt="Ambi logo"]');
    logoImg?.addEventListener('click', handler);
  }

  setDownloadDisabled(isDisabled: boolean): void {
    this.#downloadStlButton.disabled = isDisabled;
  }

  showGeometryWarnings(
    floaterPairs: string[],
    descenderPairs: string[],
    elevatedPairs: string[],
  ): void {
    const parts: string[] = [];
    if (floaterPairs.length > 0) {
      const label = floaterPairs.length === 1 ? 'pair' : 'pairs';
      parts.push(`floating geometry in ${label} ${floaterPairs.join(', ')}`);
    }
    if (descenderPairs.length > 0) {
      parts.push(`descenders below baseline in ${descenderPairs.join(', ')}`);
    }
    if (elevatedPairs.length > 0) {
      parts.push(`glyphs floating above baseline in ${elevatedPairs.join(', ')}`);
    }
    if (parts.length > 0) {
      this.#geometryWarning.textContent = `${parts.join('; ')}. Result may not 3D print as expected.`;
      this.#geometryWarning.hidden = false;
    } else {
      this.#geometryWarning.hidden = true;
    }
  }

  onWordsChange(handler: () => void): void {
    const syncSpaces = (source: HTMLInputElement, target: HTMLInputElement) => {
      const sourceChars = Array.from(source.value);
      let targetValue = target.value;

      // Walk source from right to left so earlier indices are stable across
      // insertions and deletions in the single pass.
      let cursorOffset = 0;
      for (let i = Math.min(sourceChars.length, targetValue.length) - 1; i >= 0; i--) {
        const srcSpace = sourceChars[i] === ' ';
        const tgtSpace = targetValue[i] === ' ';

        if (srcSpace && !tgtSpace) {
          targetValue = `${targetValue.slice(0, i)} ${targetValue.slice(i)}`;
          if (i <= (target.selectionStart ?? 0)) cursorOffset++;
        } else if (!srcSpace && tgtSpace) {
          targetValue = targetValue.slice(0, i) + targetValue.slice(i + 1);
          if (i < (target.selectionStart ?? 0)) cursorOffset--;
        }
      }

      if (targetValue !== target.value) {
        this.#syncing = true;
        try {
          const selStart = (target.selectionStart ?? 0) + cursorOffset;
          const selEnd = (target.selectionEnd ?? 0) + cursorOffset;
          target.value = targetValue;
          target.setSelectionRange(selStart, selEnd);
        } finally {
          this.#syncing = false;
        }
      }
    };

    this.#wordLeftInput.addEventListener('input', () => {
      // biome-ignore lint/suspicious/noUnnecessaryConditions: guard prevents re-entrant sync
      if (this.#syncing) return;
      syncSpaces(this.#wordLeftInput, this.#wordRightInput);
      handler();
    });
    this.#wordRightInput.addEventListener('input', () => {
      // biome-ignore lint/suspicious/noUnnecessaryConditions: guard prevents re-entrant sync
      if (this.#syncing) return;
      syncSpaces(this.#wordRightInput, this.#wordLeftInput);
      handler();
    });
  }

  onLetterSpacingChange(handler: (letterSpacing: number) => void): void {
    this.#letterSpacingInput.addEventListener('input', () => {
      handler(parseLetterSpacing(this.#letterSpacingInput.value));
    });
  }

  onFontChange(handler: (fontIdLeft: FontId, fontIdRight: FontId) => void): void {
    this.#fontSelect.addEventListener('change', () => this.#fireFontChange(handler));
    this.#fontSelect2.addEventListener('change', () => this.#fireFontChange(handler));
  }

  onCameraModeChange(handler: (cameraMode: CameraMode) => void): void {
    this.#cameraModeSelect.addEventListener('change', () => {
      handler(parseCameraMode(this.#cameraModeSelect.value));
    });
  }

  onMaterialModeChange(handler: (materialMode: MaterialMode) => void): void {
    this.#materialModeSelect.addEventListener('change', () => {
      handler(parseMaterialMode(this.#materialModeSelect.value));
    });
  }

  onBaseSettingsChange(handler: () => void): void {
    this.#baseEnabledInput.addEventListener('change', handler);
    this.#baseHeightInput.addEventListener('input', handler);
  }

  onDownload(handler: () => void): void {
    this.#downloadStlButton.addEventListener('click', handler);
  }

  onSubmit(handler: () => void): void {
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler();
    });
  }

  // ── Private helpers ─────────────────────────────────────────────

  #setFontOptions(
    fontSelect: HTMLSelectElement,
    fontOptions: readonly FontOption[],
    defaultFontId: FontId,
  ): void {
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

  #hasMixedCasePair(left: string, right: string): boolean {
    const len = Math.min(left.length, right.length);
    for (let i = 0; i < len; i++) {
      // biome-ignore lint/style/noNonNullAssertion: bounded by Math.min
      const l = left[i]!;
      // biome-ignore lint/style/noNonNullAssertion: bounded by Math.min
      const r = right[i]!;
      const lUpper = l >= 'A' && l <= 'Z';
      const lLower = l >= 'a' && l <= 'z';
      const rUpper = r >= 'A' && r <= 'Z';
      const rLower = r >= 'a' && r <= 'z';
      if ((lUpper && rLower) || (lLower && rUpper)) {
        return true;
      }
    }
    return false;
  }

  #validateWords(wordLeft: string, wordRight: string): WordValidation {
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

  #updateValidationUI(validation: WordValidation): WordValidation {
    this.#wordLeftLabel.textContent = formatWordLabel('Word 1', validation.leftCount);
    this.#wordRightLabel.textContent = formatWordLabel('Word 2', validation.rightCount);

    this.#wordLeftInput.classList.toggle('is-invalid', !validation.isValid);
    this.#wordRightInput.classList.toggle('is-invalid', !validation.isValid);
    this.#wordLeftInput.setAttribute('aria-invalid', String(!validation.isValid));
    this.#wordRightInput.setAttribute('aria-invalid', String(!validation.isValid));

    this.#validationMessage.textContent = validation.message;
    // biome-ignore lint/complexity/useLiteralKeys: noPropertyAccessFromIndexSignature requires bracket notation for DOMStringMap
    this.#validationMessage.dataset['state'] = validation.isValid ? 'ready' : 'error';

    return validation;
  }

  #updateBaseHeightLabel(): void {
    this.#baseHeightLabel.textContent = `Base Height (${this.#baseHeightInput.value})`;
  }

  #updateBaseHeightVisibility(): void {
    const isEnabled = this.#baseEnabledInput.checked;
    this.#baseHeightInput.disabled = !isEnabled;
    const baseHeightGroup = document.getElementById('base-height-group');
    if (baseHeightGroup) {
      baseHeightGroup.style.opacity = isEnabled ? '1' : '0.5';
    }
  }

  #fireFontChange(handler: (fontIdLeft: FontId, fontIdRight: FontId) => void): void {
    const fontIdLeft = parseFontId(this.#fontSelect.value, this.#options.defaultFontId);
    const fontIdRight =
      this.#fontSelect2.value === '__same__'
        ? fontIdLeft
        : parseFontId(this.#fontSelect2.value, this.#options.defaultFontId);
    handler(fontIdLeft, fontIdRight);
  }
}
