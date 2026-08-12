// Corpus gates for the creation package: the Quirk pools, the Gear pools,
// and the seesaw that pairs them. Real handles only — a card that names a
// skill that does not exist fails here, not at the table.

import { describe, expect, it } from 'vitest';
import { GEAR, OPPOSITE, resolveGear, rollPackage, STARTING_COIN, VOW_OF_POVERTY_GEAR, gearById } from './gear';
import { QUIRKS, resolveQuirk, rollQuirk, type SeesawCategory } from './quirks';
import { SKILLS } from './skills';

/** Deterministic rng (mulberry32) so every run covers the same ground. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATEGORIES: SeesawCategory[] = ['good', 'neutral', 'bad'];
const UNRESOLVED = /\{\w+(?::\w+)?\}/;

describe('the pools', () => {
  it('every quirk and gear card carries a category', () => {
    for (const q of QUIRKS) expect(CATEGORIES).toContain(q.category);
    for (const g of GEAR) expect(CATEGORIES).toContain(g.category);
  });

  it('no pool is empty on either side of the seesaw', () => {
    for (const c of CATEGORIES) {
      expect(QUIRKS.filter((q) => q.category === c).length).toBeGreaterThan(0);
      expect(GEAR.filter((g) => g.category === c).length).toBeGreaterThan(0);
    }
  });
});

describe('the Vow of Poverty package', () => {
  it('stays out of the rolled pools but resolves by id', () => {
    expect(GEAR.some((g) => g.id === VOW_OF_POVERTY_GEAR.id)).toBe(false);
    expect(gearById(VOW_OF_POVERTY_GEAR.id)).toBe(VOW_OF_POVERTY_GEAR);
  });

  it('rolls a Good Quirk with the fixed gear and no coin', () => {
    const rng = seeded(7);
    for (let i = 0; i < 20; i++) {
      const { quirk, gear } = rollPackage(rng, { vowOfPoverty: true });
      expect(quirk.category).toBe('good');
      expect(gear.id).toBe(VOW_OF_POVERTY_GEAR.id);
      expect(gear.coin).toBe(0);
      expect(gear.fills.saint).toBeTruthy();
    }
  });
});

describe('real handles only', () => {
  const skillNames = SKILLS.map((s) => s.name);
  it('every skillMod names a skill that exists', () => {
    for (const card of [...QUIRKS, ...GEAR]) {
      for (const e of card.effects) {
        if (e.kind === 'skillMod') expect(skillNames).toContain(e.skill);
      }
    }
  });
});

describe('slot resolution', () => {
  it('every card resolves with no {slot} left behind', () => {
    const rng = seeded(1);
    for (const q of QUIRKS) {
      const r = resolveQuirk(q, rng);
      expect(r.name).not.toMatch(UNRESOLVED);
      expect(r.mechanic).not.toMatch(UNRESOLVED);
      expect(r.esoteric).not.toMatch(UNRESOLVED);
    }
    for (const g of GEAR) {
      const r = resolveGear(g, rng);
      expect(r.name).not.toMatch(UNRESOLVED);
      expect(r.mechanic).not.toMatch(UNRESOLVED);
      expect(r.provenance).not.toMatch(UNRESOLVED);
    }
  });
});

describe('the seesaw', () => {
  it('gear always comes from the pool opposite the quirk', () => {
    const rng = seeded(2);
    for (let i = 0; i < 500; i++) {
      const { quirk, gear } = rollPackage(rng);
      expect(gear.category).toBe(OPPOSITE[quirk.category]);
    }
  });

  it('neutral pulls neutral', () => {
    expect(OPPOSITE.neutral).toBe('neutral');
  });

  it('coin leans against the gear: bad pays best', () => {
    expect(STARTING_COIN).toEqual({ bad: 200, neutral: 150, good: 100 });
    const rng = seeded(5);
    for (let i = 0; i < 100; i++) {
      const { gear } = rollPackage(rng);
      expect(gear.coin).toBe(STARTING_COIN[gear.category]);
    }
  });

  it('a category-confined quirk roll stays in its pool', () => {
    const rng = seeded(3);
    for (const c of CATEGORIES) {
      for (let i = 0; i < 50; i++) {
        expect(rollQuirk(rng, c).category).toBe(c);
      }
    }
  });

  it('the free roll (the demo button) still reaches every pool', () => {
    const rng = seeded(4);
    const seen = new Set<SeesawCategory>();
    for (let i = 0; i < 500; i++) seen.add(rollQuirk(rng).category);
    expect(seen.size).toBe(3);
  });
});
