type ShareDialogElements = {
  dialog: HTMLDialogElement;
  urlInput: HTMLInputElement;
  copyButton: HTMLButtonElement;
  copyLabel: HTMLSpanElement;
};

let dialogElements: ShareDialogElements | undefined;

const COPY_LABEL = 'Copy';
const COPIED_LABEL = 'Copied!';
const COPY_HINT = 'Press Ctrl+C to copy';

function getDialog(): ShareDialogElements {
  if (dialogElements) {
    return dialogElements;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'share-dialog';

  const header = document.createElement('div');
  header.className = 'share-dialog-header';

  const headerRow = document.createElement('div');
  headerRow.className = 'share-dialog-header-row';

  const title = document.createElement('h2');
  title.className = 'share-dialog-title';
  title.textContent = 'Share';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'share-dialog-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'Close share dialog');
  closeBtn.addEventListener('click', () => dialog.close());

  headerRow.appendChild(title);
  headerRow.appendChild(closeBtn);
  header.appendChild(headerRow);

  const hint = document.createElement('p');
  hint.className = 'share-dialog-hint';
  hint.textContent = 'Use this URL to share your ambigram with others';
  header.appendChild(hint);

  const row = document.createElement('div');
  row.className = 'share-dialog-row';

  const urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.readOnly = true;
  urlInput.className = 'share-dialog-url';
  urlInput.setAttribute('aria-label', 'Shareable URL');
  urlInput.addEventListener('focus', () => urlInput.select());

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'share-dialog-copy';
  const copyLabel = document.createElement('span');
  copyLabel.textContent = COPY_LABEL;
  copyButton.appendChild(copyLabel);

  row.appendChild(urlInput);
  row.appendChild(copyButton);

  dialog.appendChild(header);
  dialog.appendChild(row);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  document.body.appendChild(dialog);

  dialogElements = { dialog, urlInput, copyButton, copyLabel };
  return dialogElements;
}

function flashCopied(elements: ShareDialogElements, succeeded: boolean): void {
  const { copyLabel, urlInput } = elements;
  copyLabel.textContent = succeeded ? COPIED_LABEL : COPY_HINT;
  if (succeeded) {
    elements.copyButton.classList.add('share-dialog-copy--copied');
  }
  setTimeout(() => {
    copyLabel.textContent = COPY_LABEL;
    elements.copyButton.classList.remove('share-dialog-copy--copied');
  }, 1500);
  urlInput.focus();
  urlInput.select();
}

export function openShareDialog(): void {
  const elements = getDialog();
  const { dialog, urlInput, copyButton } = elements;

  urlInput.value = location.href;

  copyButton.onclick = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(urlInput.value).then(
        () => flashCopied(elements, true),
        () => flashCopied(elements, false),
      );
    } else {
      urlInput.focus();
      urlInput.select();
      flashCopied(elements, false);
    }
  };

  dialog.showModal();
  urlInput.focus();
  urlInput.select();
}
