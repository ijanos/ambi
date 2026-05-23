import { assertSameLength, assertWordsPresent, normalizeWord } from '../word-pairs';

export type WordValidation = {
  normalizedWordLeft: string;
  normalizedWordRight: string;
  leftCount: number;
  rightCount: number;
  isValid: boolean;
  message: string;
};

export type ControlsPanel = {
  syncValidation(): WordValidation;
  enableLiveValidation(): void;
  onSubmit(handler: () => void): void;
};

type Controls = {
  form: HTMLFormElement;
  wordLeftInput: HTMLInputElement;
  wordRightInput: HTMLInputElement;
  wordLeftLabel: HTMLLabelElement;
  wordRightLabel: HTMLLabelElement;
  validationMessage: HTMLDivElement;
};

type ControlsPanelOptions = {
  defaultWordLeft: string;
  defaultWordRight: string;
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
    validationMessage: requireElement<HTMLDivElement>('#validation-message'),
  };
}

function formatWordLabel(baseLabel: string, letterCount: number): string {
  const unit = letterCount === 1 ? 'letter' : 'letters';
  return `${baseLabel} (${letterCount} ${unit})`;
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

  const syncValidation = () => updateValidationUI(
    controls,
    validateWords(controls.wordLeftInput.value, controls.wordRightInput.value),
  );

  return {
    syncValidation,
    enableLiveValidation() {
      controls.wordLeftInput.addEventListener('input', syncValidation);
      controls.wordRightInput.addEventListener('input', syncValidation);
    },
    onSubmit(handler) {
      controls.form.addEventListener('submit', (event) => {
        event.preventDefault();
        handler();
      });
    },
  };
}
