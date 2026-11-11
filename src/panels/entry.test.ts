import { setLang } from '@onigam/lab-kit/i18n';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { LAB_STRINGS } from '../i18n/ui';
import { entryNotice, STORAGE_KEY, VERSION } from './entry';
import { FakeElement, installFakeDom } from './test-dom';

// The notice on the way in as the card a visitor reads (the dialog and the storage are the browser's: looked at there).

beforeAll(() => installFakeDom());

/** The kit sets French typography on what it shows (a non-breaking space before a colon): compare without it. */
const plain = (text: string): string => text.replace(/[\u00a0\u202f]/g, ' ');
afterEach(() => setLang('fr'));

describe('the notice on the way in', () => {
  it('holds the warning in full and the three other hazards, then one button, in both languages', () => {
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      let closed = 0;
      const card = entryNotice(() => closed++) as unknown as FakeElement;
      const i = lang === 'fr' ? 0 : 1;
      const text = plain(card.textContent);
      for (const k of ['entryEyebrow', 'entryTitle', 'warningFull', 'entryGarage', 'entryFire', 'entryBurns'] as const)
        expect(text, `${lang} ${k}`).toContain(plain(LAB_STRINGS[k][i]));
      expect(card.find('.callout--warn')).toHaveLength(3);
      const buttons = card.find('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]!.textContent).toBe(LAB_STRINGS.entryEnter[i]);
      buttons[0]!.click();
      expect(closed).toBe(1);
    }
  });

  it('says the warning before the other hazards, and is labelled for a screen reader', () => {
    const card = entryNotice(() => undefined) as unknown as FakeElement;
    const t = plain(card.textContent);
    expect(t.indexOf(LAB_STRINGS.warningFull[0])).toBeLessThan(t.indexOf(LAB_STRINGS.entryGarage[0]));
    expect(t.indexOf(LAB_STRINGS.entryGarage[0])).toBeLessThan(t.indexOf(LAB_STRINGS.entryFire[0]));
    expect(t.indexOf(LAB_STRINGS.entryFire[0])).toBeLessThan(t.indexOf(LAB_STRINGS.entryBurns[0]));
    expect(card.attrs.get('aria-labelledby')).toBe('entry-title');
    expect(card.find('h2')[0]!.attrs.get('id')).toBe('entry-title');
  });

  it('is remembered per lab and per wording', () => {
    expect(STORAGE_KEY).toBe('gasifier-lab:entry-notice');
    expect(VERSION).toMatch(/^\d+$/);
  });
});
