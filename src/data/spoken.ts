// Spoken numbers turned back into digits, for the guards of the spoken guide (narration/<lang>.json): the voice says « soixante-quinze millimètres », the guards of the refused sizes (docs-guard.test.ts, refusals.test.ts, src/narration.test.ts) look for « 75 mm ». Not part of the application: a test helper that lives here so that three tests share it.
// It reads French and English number words, with a decimal « virgule » / « point », and keeps the length unit that follows: « sept virgule cinq centimètres » becomes « 7,5 cm », « seven point five centimetres » becomes « 7.5 cm ». Anything else is left as it was.

const FR_UNITS: Record<string, number> = {
  zéro: 0,
  zero: 0,
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  six: 6,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  onze: 11,
  douze: 12,
  treize: 13,
  quatorze: 14,
  quinze: 15,
  seize: 16,
  vingt: 20,
  vingts: 20,
  trente: 30,
  quarante: 40,
  cinquante: 50,
  soixante: 60,
  quatrevingt: 80,
  quatrevingts: 80,
};
const EN_UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const LENGTH_UNITS: Record<string, string> = {
  millimètre: 'mm',
  millimètres: 'mm',
  millimetre: 'mm',
  millimetres: 'mm',
  centimètre: 'cm',
  centimètres: 'cm',
  centimetre: 'cm',
  centimetres: 'cm',
  mètre: 'm',
  mètres: 'm',
  metre: 'm',
  metres: 'm',
};

const norm = (w: string): string => w.toLowerCase().normalize('NFC');

/** Tokens of a text: words (with their original spelling kept for the rest of the text) and everything between them. */
function tokens(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[’']/g, '’');
  if (lang === 'fr') t = t.replace(/quatre[- ]vingts?/gi, (m) => (/s$/i.test(m) ? 'quatrevingts' : 'quatrevingt'));
  return t.split(/([\p{L}]+|[^\p{L}]+)/u).filter((s) => s !== '');
}

/** The integer a list of number words makes (« deux cent trente-cinq » is 235), or null when a word is none. */
function integer(words: string[], lang: 'fr' | 'en'): number | null {
  const table = lang === 'fr' ? FR_UNITS : EN_UNITS;
  const [hundred, thousand] = lang === 'fr' ? [['cent', 'cents'], ['mille']] : [['hundred'], ['thousand']];
  let total = 0;
  let current = 0;
  let seen = false;
  for (const raw of words) {
    const w = norm(raw);
    if (w === 'et' || w === 'and') continue;
    if (hundred!.includes(w)) {
      current = (current || 1) * 100;
      seen = true;
    } else if (thousand!.includes(w)) {
      total += (current || 1) * 1000;
      current = 0;
      seen = true;
    } else {
      const u = table[w];
      if (u === undefined) return null;
      current += u;
      seen = true;
    }
  }
  return seen ? total + current : null;
}

/** The value of one run of number words, as a string with its decimals, or null when it is no number. Decimals: French reads leading zeros then a number (« zéro huit » is 08, « douze » is 12), English reads digit by digit. */
function value(words: string[], lang: 'fr' | 'en'): string | null {
  const table = lang === 'fr' ? FR_UNITS : EN_UNITS;
  const point = lang === 'fr' ? 'virgule' : 'point';
  const at = words.findIndex((w) => norm(w) === point);
  const whole = integer(at < 0 ? words : words.slice(0, at), lang);
  if (whole === null) return null;
  if (at < 0) return String(whole);
  const rest = words.slice(at + 1).filter((w) => !['et', 'and'].includes(norm(w)));
  if (rest.length === 0) return String(whole);
  let decimals = '';
  if (lang === 'en') {
    for (const w of rest) {
      const d = table[norm(w)];
      if (d === undefined || d > 9) return null;
      decimals += String(d);
    }
  } else {
    let k = 0;
    while (k < rest.length && norm(rest[k]!) === 'zéro') {
      decimals += '0';
      k++;
    }
    if (k < rest.length) {
      const n = integer(rest.slice(k), lang);
      if (n === null) return null;
      decimals += String(n);
    }
  }
  return `${whole}${lang === 'fr' ? ',' : '.'}${decimals}`;
}

const isNumberWord = (w: string, lang: 'fr' | 'en'): boolean => {
  const n = norm(w);
  const table = lang === 'fr' ? FR_UNITS : EN_UNITS;
  const big = lang === 'fr' ? ['cent', 'cents', 'mille'] : ['hundred', 'thousand'];
  return n in table || big.includes(n) || n === (lang === 'fr' ? 'virgule' : 'point');
};

/**
 * The text with each run of number words replaced by its digits, and a length unit that follows it written short (« mm », « cm », « m »): « un virgule cinq mètre » -> « 1,5 m ». « et » / « and » inside a run is part of it, at the edge it is not.
 */
export function spokenToDigits(text: string, lang: 'fr' | 'en'): string {
  const toks = tokens(text, lang);
  const out: string[] = [];
  const isSep = (s: string): boolean => /^[\s-]+$/.test(s);
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i]!;
    if (!/^\p{L}+$/u.test(tok) || !isNumberWord(tok, lang)) {
      out.push(tok);
      continue;
    }
    // collect the run: number words, joined by a space, a hyphen or « et »/« and »
    const run: string[] = [tok];
    let j = i;
    for (;;) {
      const sep = toks[j + 1];
      const next = toks[j + 2];
      if (sep !== undefined && next !== undefined && isSep(sep) && /^\p{L}+$/u.test(next)) {
        const n = norm(next);
        if (isNumberWord(next, lang) || n === 'et' || n === 'and') {
          // « et » / « and » inside a number (« vingt et un », « two hundred and sixteen »), not between two numbers (« six cents et mille heures »)
          if (n === 'et' || n === 'and') {
            const after = toks[j + 4];
            const gap = toks[j + 3];
            if (gap === undefined || after === undefined || !isSep(gap) || !isNumberWord(after, lang)) break;
            const before = norm(run[run.length - 1]!);
            const joins =
              lang === 'fr'
                ? ['vingt', 'trente', 'quarante', 'cinquante', 'soixante'].includes(before) &&
                  ['un', 'une', 'onze'].includes(norm(after))
                : ['hundred', 'thousand'].includes(before) &&
                  !['hundred', 'thousand'].includes(norm(toks[j + 6] ?? ''));
            if (!joins) break;
            run.push(next);
            j += 2;
            continue;
          }
          run.push(next);
          j += 2;
          continue;
        }
      }
      break;
    }
    const v = value(run, lang);
    if (v === null) {
      out.push(tok);
      continue;
    }
    // the unit that follows, if it is a length
    const sep = toks[j + 1];
    const unit = toks[j + 2];
    if (sep !== undefined && unit !== undefined && /^[\s]+$/.test(sep) && LENGTH_UNITS[norm(unit)]) {
      out.push(`${v} ${LENGTH_UNITS[norm(unit)]}`);
      i = j + 2;
    } else {
      out.push(v);
      i = j;
    }
  }
  return out.join('');
}
