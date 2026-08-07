// Cross-validation of the class data against the rest of the rules corpus.
// These tests are the build gate for Layer A (spec §9): a class referencing a
// Category, Skill, or proficiency that doesn't exist fails here, loudly.

import { describe, expect, it } from 'vitest';

import { CATEGORIES } from './category-abilities';
import { FEATS } from './feats';
import {
  ARMOUR_PROFICIENCIES,
  CLASSES,
  IMPLEMENT_GROUPS,
  WEAPON_GROUPS,
  classById,
  subclassById,
} from './classes';
import { SKILLS } from './skills';

const CATEGORY_NAMES = new Set(CATEGORIES.map((c) => c.name));
const SKILL_NAMES = new Set(SKILLS.map((s) => s.name));

/** "Religion (Black Faith)" → "Religion" — specialities validate by base skill. */
function baseSkill(name: string): string {
  return name.replace(/\s*\(.*\)$/, '');
}

const allSubclasses = CLASSES.flatMap((c) =>
  c.subclasses.map((s) => ({ cls: c, sub: s })),
);

describe('class roster shape', () => {
  it('has the six complete classes, three subclasses each', () => {
    expect(CLASSES).toHaveLength(6);
    for (const cls of CLASSES) {
      expect(cls.subclasses, cls.name).toHaveLength(3);
    }
  });

  it('has unique, kebab-case stable ids across classes and subclasses', () => {
    const ids = [
      ...CLASSES.map((c) => c.id),
      ...allSubclasses.map(({ sub }) => sub.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('resolves lookups by id', () => {
    expect(classById('soldier')?.name).toBe('Soldier');
    expect(subclassById('drymann')?.cls.id).toBe('naturalist');
    expect(classById('nope')).toBeUndefined();
    expect(subclassById('nope')).toBeUndefined();
  });
});

describe('ability categories', () => {
  it('every class and subclass Category exists in the abilities corpus', () => {
    for (const cls of CLASSES) {
      expect(CATEGORY_NAMES, `${cls.name}: ${cls.abilityCategory}`).toContain(
        cls.abilityCategory,
      );
    }
    for (const { cls, sub } of allSubclasses) {
      expect(
        CATEGORY_NAMES,
        `${cls.name}/${sub.name}: ${sub.abilityCategory}`,
      ).toContain(sub.abilityCategory);
    }
  });

  it('a subclass Category always differs from its class Category', () => {
    for (const { cls, sub } of allSubclasses) {
      expect(sub.abilityCategory, `${cls.name}/${sub.name}`).not.toBe(
        cls.abilityCategory,
      );
    }
  });

  it('every published Category is claimed by some class, subclass, or Feat grant', () => {
    const claimed = new Set([
      ...CLASSES.map((c) => c.abilityCategory),
      ...allSubclasses.map(({ sub }) => sub.abilityCategory),
      ...FEATS.flatMap((f) => (f.grantsAbility ? [f.grantsAbility.category] : [])),
    ]);
    for (const name of CATEGORY_NAMES) {
      expect(claimed, `unclaimed Category: ${name}`).toContain(name);
    }
  });
});

describe('skills', () => {
  it('every Class Skill and Additional Class Skill exists (specialities by base name)', () => {
    const grants = [
      ...CLASSES.flatMap((c) => c.classSkills.map((s) => ({ where: c.name, s }))),
      ...allSubclasses.flatMap(({ cls, sub }) =>
        sub.additionalClassSkills.map((s) => ({
          where: `${cls.name}/${sub.name}`,
          s,
        })),
      ),
    ];
    for (const { where, s } of grants) {
      expect(SKILL_NAMES, `${where}: ${s}`).toContain(baseSkill(s));
    }
  });
});

describe('proficiency vocabularies', () => {
  it('the canonical lists hold 17 weapon groups, 5 armour tracks, 6 implement groups', () => {
    expect(WEAPON_GROUPS).toHaveLength(17);
    expect(ARMOUR_PROFICIENCIES).toHaveLength(5);
    expect(IMPLEMENT_GROUPS).toHaveLength(6);
    expect(new Set(WEAPON_GROUPS).size).toBe(17);
  });

  it('no class or subclass repeats a proficiency its own list already grants', () => {
    for (const cls of CLASSES) {
      expect(new Set(cls.weaponProficiencies).size).toBe(
        cls.weaponProficiencies.length,
      );
      for (const sub of cls.subclasses) {
        for (const w of sub.weaponProficiencies) {
          expect(cls.weaponProficiencies, `${cls.name}/${sub.name}: ${w}`).not.toContain(w);
        }
        for (const a of sub.armourProficiencies) {
          expect(cls.armourProficiencies, `${cls.name}/${sub.name}: ${a}`).not.toContain(a);
        }
      }
    }
  });
});
