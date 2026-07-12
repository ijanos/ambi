type ShareDialogElements = {
  dialog: HTMLDialogElement;
  urlInput: HTMLInputElement;
  copyButton: HTMLButtonElement;
  copyLabel: HTMLSpanElement;
  blueskyLink: HTMLAnchorElement;
  twitterLink: HTMLAnchorElement;
  redditLink: HTMLAnchorElement;
  fbLink: HTMLAnchorElement;
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

  const socialRow = document.createElement('div');
  socialRow.className = 'share-dialog-social';

  const socialLabel = document.createElement('span');
  socialLabel.className = 'share-dialog-social-label';
  socialLabel.textContent = 'Share on';
  socialRow.appendChild(socialLabel);

  const blueskyLink = document.createElement('a');
  blueskyLink.className = 'share-dialog-social-btn share-dialog-social-btn--bluesky';
  blueskyLink.textContent = 'Bluesky';
  blueskyLink.setAttribute('aria-label', 'Share on Bluesky');
  blueskyLink.target = '_blank';
  blueskyLink.rel = 'noopener noreferrer';
  socialRow.appendChild(blueskyLink);

  const twitterLink = document.createElement('a');
  twitterLink.className = 'share-dialog-social-btn share-dialog-social-btn--twitter';
  twitterLink.textContent = 'Twitter/X';
  twitterLink.setAttribute('aria-label', 'Share on Twitter/X');
  twitterLink.target = '_blank';
  twitterLink.rel = 'noopener noreferrer';
  socialRow.appendChild(twitterLink);

  const redditLink = document.createElement('a');
  redditLink.className = 'share-dialog-social-btn share-dialog-social-btn--reddit';
  redditLink.textContent = 'Reddit';
  redditLink.setAttribute('aria-label', 'Share on Reddit');
  redditLink.target = '_blank';
  redditLink.rel = 'noopener noreferrer';
  socialRow.appendChild(redditLink);

  const fbLink = document.createElement('a');
  fbLink.className = 'share-dialog-social-btn share-dialog-social-btn--facebook';
  fbLink.textContent = 'Facebook';
  fbLink.setAttribute('aria-label', 'Share on Facebook');
  fbLink.target = '_blank';
  fbLink.rel = 'noopener noreferrer';
  socialRow.appendChild(fbLink);

  dialog.appendChild(header);
  dialog.appendChild(row);
  dialog.appendChild(socialRow);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  document.body.appendChild(dialog);

  dialogElements = {
    dialog,
    urlInput,
    copyButton,
    copyLabel,
    blueskyLink,
    twitterLink,
    redditLink,
    fbLink,
  };
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
  const { dialog, urlInput, copyButton, blueskyLink, twitterLink, redditLink, fbLink } = elements;

  urlInput.value = location.href;
  const shareUrl = encodeURIComponent(location.href);
  const shareTitle = encodeURIComponent(document.title);

  blueskyLink.href = `https://bsky.app/intent/compose?text=${shareUrl}`;
  twitterLink.href = `https://x.com/intent/tweet?text=${shareUrl}`;
  redditLink.href = `https://www.reddit.com/submit?url=${shareUrl}&title=${shareTitle}`;
  fbLink.href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&t=${shareTitle}`;

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
