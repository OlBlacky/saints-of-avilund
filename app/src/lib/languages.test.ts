import { describe, it, expect } from 'vitest';

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  LANGUAGE_FAMILY,
  LANGUAGE_NOTES,
  sharedFamily,
} from './languages';
import { LANGUAGES as LANGUAGE_SLOTS } from './quirks';

describe('the language list', () => {
  it('lists every tongue exactly once', () => {
    expect(new Set(LANGUAGES).size).toBe(LANGUAGES.length);
  });

  it('includes the default tongue', () => {
    expect(LANGUAGES).toContain(DEFAULT_LANGUAGE);
  });
});

describe('the Language Families', () => {
  it('files every prefixed Dialect under the Family its name carries', () => {
    for (const lang of LANGUAGES) {
      const prefix = lang.split(' - ')[0];
      if (lang.includes(' - ')) {
        expect(LANGUAGE_FAMILY[lang], `${lang} has no Family entry`).toBe(prefix);
      }
    }
  });

  it('gives every Family its koine or three Dialects', () => {
    const members = (family: string) =>
      Object.entries(LANGUAGE_FAMILY).filter(([, f]) => f === family).length;
    expect(members('Imperial')).toBe(4); // the koine + three Dialects
    expect(members('Republic')).toBe(3);
    expect(members('Regnal')).toBe(3);
  });

  it('keeps Cyprian and Kellish outside every Family', () => {
    expect(LANGUAGE_FAMILY['Cyprian']).toBeUndefined();
    expect(LANGUAGE_FAMILY['Kellish']).toBeUndefined();
  });
});

describe('sharedFamily', () => {
  it('finds kinship between Dialects of one Family', () => {
    expect(sharedFamily('Regnal - Patric', 'Regnal - Mantlish')).toBe('Regnal');
    expect(sharedFamily('Imperial', 'Imperial - Vailish')).toBe('Imperial');
  });

  it('finds none across Families or standalone tongues', () => {
    expect(sharedFamily('Imperial - Lysandrine', 'Republic - Waldisch')).toBeNull();
    expect(sharedFamily('Cyprian', 'Kellish')).toBeNull();
    expect(sharedFamily('Regnal - Patric', 'Kellish')).toBeNull();
  });

  it('returns null for the same tongue twice', () => {
    expect(sharedFamily('Imperial', 'Imperial')).toBeNull();
  });
});

describe('the reference notes', () => {
  it('sorts every tongue into the section its Family status dictates', () => {
    for (const lang of LANGUAGES) {
      const { kind } = LANGUAGE_NOTES[lang];
      if (lang === DEFAULT_LANGUAGE) {
        expect(kind).toBe('koine');
      } else if (lang.includes(' - ')) {
        expect(kind, lang).toBe('dialect');
      } else {
        expect(LANGUAGE_FAMILY[lang], `${lang} is ${kind} yet has a Family`).toBeUndefined();
      }
    }
  });

  it('gives every tongue a non-empty note', () => {
    for (const lang of LANGUAGES) {
      expect(LANGUAGE_NOTES[lang].note.length, lang).toBeGreaterThan(0);
    }
  });
});

describe('the quirk slot table', () => {
  it('only offers tongues from the canonical list', () => {
    for (const entry of LANGUAGE_SLOTS) {
      expect(LANGUAGES, `slot entry "${entry.value}"`).toContain(entry.value);
    }
  });
});
