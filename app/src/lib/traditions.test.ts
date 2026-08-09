import { describe, it, expect } from 'vitest';
import { TRADITIONS, keywordsFor } from './traditions';
import { CATEGORIES } from './category-abilities';
import { CLASSES } from './classes';
import { LANGUAGES } from './languages';
import { SKILLS } from './skills';

// "Skills know, Languages read" (design-principles §10): every casting
// Category has one knowledge Skill and one Language, and every Class or
// Subclass that casts from it grants both.

const CATEGORY_NAMES = new Set(CATEGORIES.map((c) => c.name));
const SKILL_NAMES = new Set(SKILLS.map((s) => s.name));

/** 'Religion (Saintly Faith)' → its base skill 'Religion'. */
const baseSkill = (name: string) => name.replace(/\s*\(.*\)$/, '');

describe('the tradition registry', () => {
  it('keys every tradition to a real Ability Category', () => {
    for (const name of Object.keys(TRADITIONS)) {
      expect(CATEGORY_NAMES, `tradition "${name}"`).toContain(name);
    }
  });

  it('names a real Skill for every tradition', () => {
    for (const [name, t] of Object.entries(TRADITIONS)) {
      expect(SKILL_NAMES, `${name}'s skill "${t.skill}"`).toContain(baseSkill(t.skill));
    }
  });

  it('names a real Language for every tradition', () => {
    for (const [name, t] of Object.entries(TRADITIONS)) {
      expect(LANGUAGES, `${name}'s language`).toContain(t.language);
    }
  });

  it('derives Keywords for casting Categories only', () => {
    expect(keywordsFor('Witchcraft')).toEqual(['Religion (Black Faith)', 'Black Tongue']);
    expect(keywordsFor('Arms')).toBeNull();
    expect(keywordsFor('Letters')).toBeNull();
  });
});

describe('every casting Class and Subclass grants its tradition', () => {
  for (const cls of CLASSES) {
    const holders = [
      { label: cls.name, category: cls.abilityCategory, skills: cls.classSkills, languages: cls.languages ?? [] },
      ...cls.subclasses.map((sub) => ({
        label: `${cls.name} — ${sub.name}`,
        category: sub.abilityCategory,
        // A Subclass draws on its Class's grants too.
        skills: [...cls.classSkills, ...sub.additionalClassSkills],
        languages: [...(cls.languages ?? []), ...(sub.languages ?? [])],
      })),
    ];

    for (const h of holders) {
      const tradition = TRADITIONS[h.category];
      if (!tradition) continue;

      it(`${h.label} (${h.category}) grants ${tradition.skill} and ${tradition.language}`, () => {
        expect(h.skills, `${h.label} lacks the Skill`).toContain(tradition.skill);
        expect(h.languages, `${h.label} lacks the Language`).toContain(tradition.language);
      });
    }
  }
});
