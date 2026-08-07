// The briefs gate: every Ability in the corpus carries a brief, and no brief
// points at a card that doesn't exist. A new card without its one-liner
// fails the deploy, named.

import { describe, expect, it } from 'vitest';

import { ABILITY_BRIEFS, briefFor } from './ability-briefs';
import { CATEGORIES } from './category-abilities';

describe('ability briefs', () => {
  it('every card has a brief', () => {
    const missing: string[] = [];
    for (const cat of CATEGORIES) {
      for (const ab of cat.abilities) {
        if (!briefFor(cat.name, ab.name)) missing.push(`${cat.name}/${ab.name}`);
      }
    }
    expect(missing, `cards missing briefs:\n  ${missing.join('\n  ')}`).toEqual([]);
  });

  it('no brief is orphaned', () => {
    const known = new Set(
      CATEGORIES.flatMap((c) => c.abilities.map((a) => `${c.name}/${a.name}`)),
    );
    const orphans = Object.keys(ABILITY_BRIEFS).filter((k) => !known.has(k));
    expect(orphans, `briefs without cards:\n  ${orphans.join('\n  ')}`).toEqual([]);
  });

  it('briefs stay brief', () => {
    for (const [key, text] of Object.entries(ABILITY_BRIEFS)) {
      expect(text.length, `${key} runs long`).toBeLessThanOrEqual(90);
    }
  });
});
