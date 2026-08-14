// The Feats data gate: ids stable and unique, every Feat carries its brief
// and full texts, requirements point at real things, and Ladders are shaped
// right. A malformed Feat fails the deploy, named.

import { describe, expect, it } from 'vitest';

import { CATEGORIES } from './category-abilities';
import { ARMOUR_PROFICIENCIES, IMPLEMENT_GROUPS, WEAPON_GROUPS } from './classes';
import { FEATS, hookMatchesGroup, hookMath, specializationFor, unlockedHooks } from './feats';
import { SKILLS } from './skills';

const martialStrike = CATEGORIES.find((c) => c.name === 'Arms')!
  .abilities.find((a) => a.name === 'Martial Strike')!;

describe('feats data', () => {
  it('has unique kebab-case ids', () => {
    const ids = FEATS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id, id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('every Feat carries brief and full texts, briefly', () => {
    for (const f of FEATS) {
      expect(f.brief, f.id).toBeTruthy();
      expect(f.full, f.id).toBeTruthy();
      expect(f.brief.length, `${f.id} brief runs long`).toBeLessThanOrEqual(90);
    }
  });

  it('sheet text states only what is in force — no gates', () => {
    const gates = /Requires|Opens at Level|One Rank per Level|Open to natives/;
    for (const f of FEATS) {
      if (f.ladder) {
        for (const r of f.ladder) {
          expect(r.now ?? r.value, `${f.id}: ${r.value}`).not.toMatch(gates);
        }
      } else {
        expect(f.now ?? f.full, f.id).not.toMatch(gates);
      }
    }
  });

  it('is priced: a plain cost or a Ladder, never neither or both', () => {
    for (const f of FEATS) {
      expect(Boolean(f.cost) || Boolean(f.ladder), `${f.id} has no price`).toBe(true);
      if (f.ladder) {
        expect(f.ladder.length, f.id).toBeGreaterThanOrEqual(2);
        for (const r of f.ladder) expect(['m', 'M']).toContain(r.cost);
      }
    }
  });

  it('proficiency and skill requirements name real things', () => {
    const groups = new Set<string>([...WEAPON_GROUPS, ...ARMOUR_PROFICIENCIES, ...IMPLEMENT_GROUPS]);
    const skills = new Set(SKILLS.map((s) => s.name));
    for (const f of FEATS) {
      if (f.requires?.kind === 'proficiency') {
        expect(groups, `${f.id}: ${f.requires.group}`).toContain(f.requires.group);
      }
      if (f.requires?.kind === 'skill-trained') {
        expect(skills, `${f.id}: ${f.requires.skill}`).toContain(f.requires.skill);
      }
      if (f.requires?.kind === 'skill-rank') {
        expect(skills, `${f.id}: ${f.requires.skill}`).toContain(f.requires.skill);
      }
    }
  });

  it('finds the Specialization whose Hook applies to a build choice', () => {
    const feat = FEATS.find((f) => f.requires?.kind === 'malediction')!;
    const choice = (feat.requires as { kind: 'malediction'; name: string }).name;
    expect(specializationFor([feat.id], choice)?.id).toBe(feat.id);
    // Held for a different Malediction, or not held at all.
    expect(specializationFor([feat.id], 'Some Other Malediction')).toBeUndefined();
    expect(specializationFor([], choice)).toBeUndefined();
  });

  it('matches damage-type Specializations to their type', () => {
    for (const f of FEATS.filter((x) => x.requires?.kind === 'damage-type')) {
      const type = (f.requires as { kind: 'damage-type'; type: string }).type;
      expect(specializationFor([f.id], type)?.id, type).toBe(f.id);
    }
  });

  it('unlocks only the Hooks a held Specialization opens', () => {
    const held = unlockedHooks(martialStrike.options, ['spec-heavy-blades']);
    expect(held).toEqual([{ group: 'Heavy Blades', effect: '+2 damage', math: { damage: 2 } }]);
    // Nothing held, nothing in force.
    expect(unlockedHooks(martialStrike.options, [])).toEqual([]);
    // A Feat for a group this card lists no Hook for stays silent.
    expect(unlockedHooks(martialStrike.options, ['spec-slings'])).toEqual([]);
  });

  it('reads the card shorthand for a group as the group', () => {
    // "Hammers" on the card is the Hammers/Maces Proficiency.
    expect(unlockedHooks(martialStrike.options, ['spec-hammers-maces'])).toEqual([
      { group: 'Hammers', effect: "Push 5'" },
    ]);
    // "Spears / Polearms" is one Hook two Specializations reach.
    for (const id of ['spec-polearms', 'spec-spears-lances']) {
      expect(unlockedHooks(martialStrike.options, [id]), id).toEqual([
        { group: 'Spears / Polearms', effect: "+5' reach", math: { reach: 5 } },
      ]);
    }
    expect(hookMatchesGroup('Hammers', 'Hammers/Maces')).toBe(true);
    expect(hookMatchesGroup('Hammers', 'Heavy Blades')).toBe(false);
  });

  it('reads a Hook that opens with a bonus as arithmetic', () => {
    expect(hookMath('+2 damage')).toEqual({ math: { damage: 2 } });
    expect(hookMath('+Str damage')).toEqual({ math: { damageAttr: 'Str' } });
    expect(hookMath('+1 to hit')).toEqual({ math: { toHit: 1 } });
    expect(hookMath('+2 to the Feint attack roll')).toEqual({ math: { toHit: 2 } });
    expect(hookMath("+5' reach")).toEqual({ math: { reach: 5 } });
    // A bonus that leads a Hook doing something else keeps the remainder.
    expect(hookMath("+2 damage and Push 5'")).toEqual({
      math: { damage: 2 },
      rest: "Push 5'",
    });
  });

  it('leaves a qualified bonus as prose — the sheet cannot judge the condition', () => {
    expect(hookMath('+2 damage within the first increment')).toEqual({});
    expect(hookMath('+1 to hit the opponent for 1 round')).toEqual({});
    expect(hookMath("Push 5'")).toEqual({});
  });

  it('folds every unconditional Weapon Hook bonus, or names the ones it will not', () => {
    // The Hooks the sheet deliberately does not fold: each states a condition
    // or lands somewhere a weapon's line cannot carry.
    const prose = new Set([
      '+1 to one of your Defences until your next turn',
      '+2 damage within the first increment',
      '+1 to hit the opponent for 1 round',
      'shove the attacker, or +1 Defence against them',
    ]);
    const bonuses = CATEGORIES.flatMap((c) => c.abilities)
      .flatMap((a) => a.options ?? [])
      .filter((o) => o.label === 'Weapon Specialization Hooks')
      .flatMap((o) => (Array.isArray(o.detail) ? o.detail : o.detail ? [o.detail] : []))
      .map((line) => line.match(/→\s*(.+)$/)?.[1].trim() ?? '')
      .filter((effect) => /\+\s?(\d|Str|Dex|Con|Int|Wis|Cha)/.test(effect));
    expect(bonuses.length).toBeGreaterThan(0);
    for (const effect of new Set(bonuses)) {
      if (prose.has(effect)) expect(hookMath(effect).math, effect).toBeUndefined();
      else expect(hookMath(effect).math, effect).toBeDefined();
    }
  });

  it('covers the canonical rosters', () => {
    expect(FEATS.filter((f) => f.requires?.kind === 'proficiency').length).toBe(17 + 2);
    expect(FEATS.filter((f) => f.requires?.kind === 'damage-type')).toHaveLength(9);
    expect(FEATS.filter((f) => f.requires?.kind === 'malediction')).toHaveLength(6);
    expect(FEATS.filter((f) => f.requires?.kind === 'skill-rank')).toHaveLength(SKILLS.length);
    expect(FEATS.filter((f) => f.requires?.kind === 'attribute')).toHaveLength(12);
    expect(FEATS.filter((f) => f.requires?.kind === 'save-total')).toHaveLength(6);
    expect(FEATS.filter((f) => f.ladder)).toHaveLength(19 + SKILLS.length);
  });
});
