// Unit tests for the notation grammar, plus the corpus gate (builder spec
// §9): every damage, attack, and frequency value in the ability corpus must
// parse structured — a typo in a card fails the build, naming the card.

import { describe, expect, it } from 'vitest';

import { VAR_ORDER } from './abilities';
import { CATEGORIES } from './category-abilities';
import { SKILLS } from './skills';
import {
  parseAction,
  parseAttack,
  parseDamage,
  parseDuration,
  parseFrequency,
  parseRange,
  parseTargets,
  resolveDamage,
} from './notation';

describe('damage grammar', () => {
  it('parses weapon + attribute forms', () => {
    const d = parseDamage('1[W] + Str');
    expect(d.kind).toBe('damage');
    if (d.kind !== 'damage') return;
    expect(d.terms).toEqual([
      { kind: 'weapon', count: 1, sizeStep: undefined },
      { kind: 'attr', attr: 'Str' },
    ]);
  });

  it('accepts bare W as one weapon die', () => {
    const d = parseDamage('W + Dex');
    expect(d.kind).toBe('damage');
    if (d.kind !== 'damage') return;
    expect(d.terms[0]).toMatchObject({ kind: 'weapon', count: 1 });
  });

  it('parses the shield die', () => {
    const d = parseDamage('1[S]');
    expect(d.kind).toBe('damage');
    if (d.kind !== 'damage') return;
    expect(d.terms).toEqual([{ kind: 'shield', count: 1 }]);
    expect(resolveDamage(d, { attrs: {}, shieldDie: '1d4' })).toBe('1d4');
  });

  it('parses dice, flats, damage types, and named refs', () => {
    const d = parseDamage('2d8 + Wis Eldritch');
    expect(d).toMatchObject({ kind: 'damage', damageType: 'Eldritch' });
    const s = parseDamage('2[W] + Dex + the study bonus');
    expect(s.kind).toBe('damage');
    if (s.kind !== 'damage') return;
    expect(s.terms.at(-1)).toEqual({ kind: 'ref', text: 'the study bonus' });
  });

  it('parses the enlarged-weapon form', () => {
    const d = parseDamage('weapon one size larger, + Str');
    expect(d.kind).toBe('damage');
    if (d.kind !== 'damage') return;
    expect(d.terms[0]).toMatchObject({ kind: 'weapon', sizeStep: 1 });
  });

  it('treats None and — as no-damage, not errors', () => {
    expect(parseDamage('—').kind).toBe('none');
    expect(parseDamage('None — a false move, not a real one').kind).toBe('none');
  });

  it('resolves numbers for a specific character', () => {
    const d = parseDamage('1[W] + Str');
    if (d.kind !== 'damage') throw new Error('unexpected');
    expect(resolveDamage(d, { attrs: { Str: 3 }, weaponDie: '1d12' })).toBe('1d12+3');
    const two = parseDamage('2[W] + Dex');
    if (two.kind !== 'damage') throw new Error('unexpected');
    expect(resolveDamage(two, { attrs: { Dex: 1 }, weaponDie: '1d6' })).toBe('2d6+1');
  });
});

describe('attack grammar', () => {
  it('parses attribute vs AC and named defences', () => {
    expect(parseAttack('Strength vs AC')).toMatchObject({
      kind: 'attack',
      rollers: [{ kind: 'attr', attr: 'Str' }],
      defences: [{ kind: 'ac' }],
    });
    expect(parseAttack('Charisma vs Unarmoured Wisdom')).toMatchObject({
      kind: 'attack',
      defences: [{ kind: 'defence', armoured: false, attr: 'Wis' }],
    });
  });

  it('parses skill rollers and alternatives', () => {
    const a = parseAttack('Intimidate, Diplomacy, or Bluff vs the target’s matching Defence');
    expect(a.kind).toBe('attack');
    if (a.kind !== 'attack') return;
    expect(a.rollers).toHaveLength(3);
    expect(a.defences[0]).toEqual({ kind: 'matching' });
  });

  it('parses defence alternatives', () => {
    const a = parseAttack('Dexterity vs AC or Armoured Str');
    expect(a.kind).toBe('attack');
    if (a.kind !== 'attack') return;
    expect(a.defences).toEqual([
      { kind: 'ac' },
      { kind: 'defence', armoured: true, attr: 'Str' },
    ]);
  });

  it('rejects defences that do not exist', () => {
    expect(parseAttack('Charisma vs Unarmoured Will').kind).toBe('unparsed');
  });
});

describe('frequency grammar', () => {
  it('normalizes the standard vocabulary', () => {
    expect(parseFrequency('At-Will')).toMatchObject({ per: 'at-will' });
    expect(parseFrequency('Encounter')).toMatchObject({ per: 'encounter', count: 1 });
    expect(parseFrequency('Daily')).toMatchObject({ per: 'day', count: 1 });
    expect(parseFrequency('Twice per Encounter')).toMatchObject({ per: 'encounter', count: 2 });
    expect(parseFrequency('2 / encounter')).toMatchObject({ per: 'encounter', count: 2 });
    expect(parseFrequency('Uncapped (limited by time)')).toMatchObject({ per: 'uncapped' });
    expect(parseFrequency('Passive (always on)')).toMatchObject({ per: 'passive' });
  });

  it('keeps riders as notes', () => {
    expect(parseFrequency('At-Will — one prepared dose per use')).toMatchObject({
      per: 'at-will',
      note: 'one prepared dose per use',
    });
  });
});

describe('duration, range, targets, action grammars', () => {
  it('parses attribute-round durations with Save-ends riders', () => {
    expect(parseDuration('Wis + 1 rounds, and Save ends')).toMatchObject({
      form: 'rounds', attr: 'Wis', bonus: 1, saveEnds: true,
    });
    expect(parseDuration('Int ×2 rounds')).toMatchObject({ form: 'rounds', attr: 'Int', times: 2 });
    expect(parseDuration('Save ends')).toMatchObject({ form: 'save-ends' });
    expect(parseDuration('Until the end of your next turn')).toMatchObject({ form: 'until' });
    expect(parseDuration('24 hours')).toMatchObject({ form: 'time', amount: 24, unit: 'hour' });
  });

  it('parses distances, bursts, and WRI ranges', () => {
    expect(parseRange("30'")).toMatchObject({ form: 'distance', feet: 30 });
    expect(parseRange("60' (15' burst)")).toMatchObject({ form: 'distance', feet: 60, burstFeet: 15 });
    expect(parseRange("15' burst")).toMatchObject({ form: 'burst', feet: 15 });
    expect(parseRange('2×WRI')).toMatchObject({ form: 'wri', times: 2 });
    expect(parseRange('Self')).toMatchObject({ form: 'self' });
  });

  it('parses attribute-driven target counts', () => {
    expect(parseTargets('Cha + 1 patients')).toMatchObject({ attr: 'Cha', bonus: 1, noun: 'patients' });
    expect(parseTargets('One creature')).toMatchObject({ count: 1, noun: 'creature' });
    expect(parseTargets('Self')).toMatchObject({ count: 1, noun: 'self' });
  });

  it('parses the action vocabulary with triggers as notes', () => {
    expect(parseAction('Standard')).toMatchObject({ kind: 'action', action: 'standard' });
    expect(parseAction('Full-Round Action')).toMatchObject({ kind: 'action', action: 'full-round' });
    expect(parseAction('Interrupt — when an enemy attacks you')).toMatchObject({
      kind: 'action', action: 'interrupt', note: 'when an enemy attacks you',
    });
    expect(parseAction('Ritual — 4 hours')).toMatchObject({ kind: 'action', action: 'ritual', time: '4 hours' });
  });

  it('lets narrative values stay prose, honestly', () => {
    expect(parseAction('An evening’s fellowship').kind).toBe('prose');
    expect(parseRange('The camp').kind).toBe('prose');
    expect(parseTargets('Your company — those who travel and camp with you').kind).toBe('prose');
  });
});

// ── The corpus gate ─────────────────────────────────────────────────────────

interface Failure {
  where: string;
  field: string;
  value: string;
}

/**
 * Fields under strict policy: every value must parse structured. Known
 * deliberate exceptions are listed per field, verbatim.
 */
const STRICT_EXCEPTIONS: Record<string, string[]> = {
  frequency: [],
  damage: [
    'The dog’s Bite (its Attack Ladder)',
  ],
  attack: [
    'The dog’s Bite vs AC',
    'Weapon (Str / Dex) vs AC',
    'Int (+ Scroll Specialization) vs the spell’s Defence',
    'Int (+ Spellbook Specialization) vs the spell’s Defence',
    'Ritual — Religion (Saintly Faith) vs the Condition’s DC, +2 (prayer book, holy symbol, 10 sp incense)',
    'Ritual — Sense Motive vs Unarmoured Wisdom, +2 (prayer book, holy symbol, 10 sp incense)',
    '+2; the Shift becomes 2 (10\')',
  ],
};

it('corpus gate: every strict-field value in every ability card parses', () => {
  const failures: Failure[] = [];

  const skillNames = new Set(SKILLS.map((s) => s.name));
  const validSkill = (name: string) =>
    skillNames.has(name.replace(/\s*\(.*\)$/, ''));

  const check = (where: string, field: string, value: string) => {
    if (STRICT_EXCEPTIONS[field]?.includes(value)) return;
    const result =
      field === 'damage' ? parseDamage(value)
      : field === 'attack' ? parseAttack(value)
      : parseFrequency(value);
    if (result.kind === 'unparsed') {
      failures.push({ where, field, value });
      return;
    }
    // Skill rollers and passive-skill defences must name real Skills — an
    // invented skill in a card is as much a bug as a typo'd defence.
    if (result.kind === 'attack') {
      for (const r of result.rollers) {
        if (r.kind === 'skill' && !validSkill(r.skill)) {
          failures.push({ where, field, value: `unknown skill "${r.skill}" in "${value}"` });
        }
      }
      for (const d of result.defences) {
        if (d.kind === 'skill' && !validSkill(d.skill)) {
          failures.push({ where, field, value: `unknown skill "${d.skill}" in "${value}"` });
        }
      }
    }
  };

  for (const cat of CATEGORIES) {
    for (const ab of cat.abilities) {
      for (const field of ['frequency', 'attack', 'damage'] as const) {
        const v = ab.vars[field];
        if (!v) continue;
        const where = `${cat.name} · ${ab.name}`;
        if (v.base) check(where, field, v.base);
        for (const adv of v.advances ?? []) {
          // Pure modifier advances ("+1 to the roll") are deltas, not
          // expressions — they ride the base value and are exempt.
          if (field === 'attack' && /^\+\d/.test(adv.value)) continue;
          check(where, field, adv.value);
        }
      }
    }
  }

  const report = failures
    .map((f) => `  ${f.where} [${f.field}]: "${f.value}"`)
    .join('\n');
  expect(failures, `unparseable card values:\n${report}`).toEqual([]);
});

it('corpus gate: the soft fields never crash the parser', () => {
  for (const cat of CATEGORIES) {
    for (const ab of cat.abilities) {
      for (const field of VAR_ORDER) {
        const v = ab.vars[field];
        if (!v) continue;
        const values = [v.base, ...(v.advances ?? []).map((a) => a.value)].filter(
          (x): x is string => Boolean(x),
        );
        for (const value of values) {
          parseDuration(value);
          parseRange(value);
          parseTargets(value);
          parseAction(value);
        }
      }
    }
  }
});
