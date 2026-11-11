import { h } from '@onigam/lab-kit/ui';
import { t } from '../i18n/ui';

// The notice on the way in (research Q5, which the owner answered « oui »): the warning once on entering, as well as at the top of the Sources panel and in the garage's overview. It is the kit's own card (the one of its « no WebGL » page) in a native modal, so that nothing of the frame is restyled and nothing behind it can be pressed before it is read: the warning in full, then the other hazards, one line each, and a button that closes it.
// Shown once per browser, and again when the text changes (`VERSION`). docs/kit-requests.md, 16: the kit should own this, as it owns the spoken guide's invitation.

/** Where the lab remembers that the notice was read, and which wording: change the number when the wording changes. */
export const STORAGE_KEY = 'gasifier-lab:entry-notice';
export const VERSION = '1';

/** The card: what a visitor reads, as plain DOM, for the dialog and for a test. */
export function entryNotice(onEnter: () => void): HTMLElement {
  return h(
    'section',
    { class: 'unsupported__card', role: 'document', 'aria-labelledby': 'entry-title' },
    h('div', { class: 'eyebrow eyebrow--accent' }, t('entryEyebrow')),
    h('h2', { class: 'panel-title', id: 'entry-title' }, t('entryTitle')),
    h('p', { class: 'lead' }, t('warning')),
    h('div', { class: 'callout callout--warn' }, h('span', {}, t('entryGarage'))),
    h('div', { class: 'callout callout--warn' }, h('span', {}, t('entryFire'))),
    h('div', { class: 'callout callout--warn' }, h('span', {}, t('entryBurns'))),
    h('p', {}, h('button', { class: 'btn btn--primary', type: 'button', onclick: onEnter }, t('entryEnter'))),
  );
}

const seen = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === VERSION;
  } catch {
    return false;
  }
};

const remember = (): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, VERSION);
  } catch {
    // a browser that keeps nothing shows the notice again: that is the right way round
  }
};

/** Show the notice if this browser has not read it. Returns the dialog, or null when there is nothing to show. */
export function showEntryNotice(): HTMLDialogElement | null {
  if (seen()) return null;
  const close = (): void => {
    remember();
    dialog.close();
    dialog.remove();
  };
  const dialog = h('dialog', { class: 'entry-notice', 'aria-labelledby': 'entry-title' }, entryNotice(close));
  // the browser's own box around the kit's card is taken away: the card has its border, its ground and its shadow
  dialog.style.cssText =
    'padding:0;border:0;background:transparent;max-width:calc(100vw - 24px);max-height:calc(100dvh - 24px);overflow:auto';
  // a closed notice (the Escape key) counts as read: the visitor chose
  dialog.addEventListener('cancel', remember);
  document.body.appendChild(dialog);
  dialog.showModal();
  return dialog;
}
