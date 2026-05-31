import type { FontId } from '../fonts/catalog.generated';
import { getFontDefinition } from '../fonts/catalog.generated';
import { loadFont } from '../fonts/load-font';

const SKIP_GLYPHS = new Set([' ', '\t', '\n', '\r']);

type DialogElements = {
  dialog: HTMLDialogElement;
  titleText: HTMLSpanElement;
  count: HTMLSpanElement;
  body: HTMLDivElement;
};

let dialogElements: DialogElements | undefined;

function getDialog(): DialogElements {
  if (dialogElements) {
    return dialogElements;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'glyph-dialog';

  const header = document.createElement('div');
  header.className = 'glyph-dialog-header';

  const headerRow = document.createElement('div');
  headerRow.className = 'glyph-dialog-header-row';

  const title = document.createElement('h2');
  title.className = 'glyph-dialog-title';

  const titleText = document.createElement('span');
  const count = document.createElement('span');
  count.className = 'glyph-dialog-count';

  title.appendChild(titleText);
  title.appendChild(count);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'glyph-dialog-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close glyph viewer');
  closeBtn.addEventListener('click', () => dialog.close());

  headerRow.appendChild(title);
  headerRow.appendChild(closeBtn);
  header.appendChild(headerRow);

  const hint = document.createElement('p');
  hint.className = 'glyph-dialog-hint';
  hint.textContent = 'Click any glyph to copy it to your clipboard.';
  header.appendChild(hint);

  const body = document.createElement('div');
  body.className = 'glyph-dialog-body';

  dialog.appendChild(header);
  dialog.appendChild(body);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  document.body.appendChild(dialog);

  dialogElements = { dialog, titleText, count, body };
  return dialogElements;
}

function appendToWordInput(char: string): void {
  const wordInput = document.getElementById('word1') as HTMLInputElement | null;
  if (wordInput) {
    wordInput.value += char;
    wordInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function renderGlyphGrid(glyphKeys: string[]): void {
  const { body } = getDialog();

  body.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'glyph-grid';

  for (const c of glyphKeys) {
    const cell = document.createElement('div');
    cell.className = 'glyph-cell';
    cell.textContent = c;
    cell.title = c;
    cell.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(c).then(
          () => {
            cell.classList.add('glyph-cell--copied');
            setTimeout(() => cell.classList.remove('glyph-cell--copied'), 600);
          },
          () => {
            appendToWordInput(c);
          },
        );
      } else {
        appendToWordInput(c);
      }
    });

    grid.appendChild(cell);
  }

  body.appendChild(grid);
}

function renderError(message: string): void {
  const { body } = getDialog();
  body.innerHTML = '';

  const errorDiv = document.createElement('div');
  errorDiv.className = 'glyph-dialog-error';
  errorDiv.textContent = message;
  body.appendChild(errorDiv);
}

function renderLoading(): void {
  const { body } = getDialog();
  body.innerHTML = '';

  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'glyph-dialog-loading';
  loadingDiv.textContent = 'Loading font…';
  body.appendChild(loadingDiv);
}

export function openGlyphViewer(fontId: FontId): void {
  const { dialog, titleText, count } = getDialog();
  const definition = getFontDefinition(fontId);

  titleText.textContent = definition.label;
  count.textContent = '';
  renderLoading();
  dialog.showModal();

  loadFont(fontId)
    .then((font) => {
      const glyphs = font.data.glyphs as Record<string, unknown>;
      const glyphKeys = Object.keys(glyphs)
        .filter((c) => !SKIP_GLYPHS.has(c))
        .sort((a, b) => {
          const ca = a.codePointAt(0) ?? 0;
          const cb = b.codePointAt(0) ?? 0;
          return ca - cb;
        });

      count.textContent = `(${glyphKeys.length} glyphs)`;
      renderGlyphGrid(glyphKeys);
    })
    .catch((error) => {
      const message = error instanceof Error ? error.message : 'Failed to load font.';
      renderError(message);
    });
}
