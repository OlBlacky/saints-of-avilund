// The record engine's suite: Gareth Ironside (the site's worked example)
// rebuilt event by event, plus the rules the engine must enforce — bank
// accounting, caps, pacing windows, access, and ordering.

import { describe, expect, it } from 'vitest';

import type { RecordEvent } from './events';
import { derive } from './derive';
import { accessibleCategories, levelFor, replay, windowFor } from './replay';

let n = 0;
/** Shorthand event factory — ids/timestamps are engine-opaque in tests. */
function ev<T extends RecordEvent['type']>(
  type: T,
  data: Omit<Extract<RecordEvent, { type: T }>, 'id' | 'at' | 'source' | 'type'>,
): Extract<RecordEvent, { type: T }> {
  n += 1;
  return { id: `e${n}`, at: '2026-08-06T00:00:00Z', source: 'player', type, ...data } as Extract<
    RecordEvent,
    { type: T }
  >;
}

/** The creation of Gareth Ironside, per the live Character Creation page:
 * Soldier (Vanguard), Str +3, Con +2, two Abilities, two Flaws (Int, Cha),
 * a Marking Strike bought with the Flaw Majors, and the Minor spread. */
function gareth(): RecordEvent[] {
  return [
    ev('class-chosen', { classId: 'soldier' }),
    ev('subclass-chosen', { subclassId: 'vanguard' }),
    // 11 Major: Str +3 (6), Con +2 (3), Martial Strike (1), Shield Bash (1)
    ev('attribute-bought', { attr: 'Strength' }),
    ev('attribute-bought', { attr: 'Strength' }),
    ev('attribute-bought', { attr: 'Strength' }),
    ev('attribute-bought', { attr: 'Constitution' }),
    ev('attribute-bought', { attr: 'Constitution' }),
    ev('ability-bought', { ref: { category: 'Arms', ability: 'Martial Strike' } }),
    ev('ability-bought', { ref: { category: 'Protection', ability: 'Shield Bash' } }),
    // The two-point Flaw: +2 Major, buying Marking Strike (1) with 1 to spare
    ev('flaw-taken', { attr: 'Intelligence' }),
    ev('flaw-taken', { attr: 'Charisma' }),
    ev('ability-bought', { ref: { category: 'Protection', ability: 'Marking Strike' } }),
    // 11 Minor: Str Offence +1, HP once, Con Defence +2, four Class Skills,
    // a Feat-less spread — proficiency advance + language stand in for the
    // Feat purchase until the Feat pillar lands.
    ev('offence-bought', { attr: 'Strength' }),
    ev('hp-bought', {}),
    ev('defence-bought', { attr: 'Constitution' }),
    ev('defence-bought', { attr: 'Constitution' }),
    ev('skill-bought', { skill: 'Endurance' }),
    ev('skill-bought', { skill: 'Intimidate' }),
    ev('skill-bought', { skill: 'Survival' }),
    ev('skill-bought', { skill: 'Perception' }),
    ev('proficiency-advanced', { group: 'Heavy Blades' }),
    ev('language-bought', { language: 'Kellish' }),
    // The finale
    ev('quirk-rolled', { quirkName: 'Gutter Auld', slots: {}, rerollsUsed: 1 }),
    ev('crystallized', {}),
  ];
}

describe('the worked example replays clean', () => {
  const { state, flags } = replay(gareth());

  it('raises no flags', () => {
    expect(flags).toEqual([]);
  });

  it('accounts the bank exactly', () => {
    // Majors: 11 + 2 (Flaws) − 6 − 3 − 1 − 1 − 1 = 1 left
    // Minors: 11 − 1 − 1 − (1+2) − 4 − 1 − 1 = 0 left
    expect(state.bank).toEqual({ major: 1, minor: 0 });
  });

  it('derives the site’s numbers', () => {
    const sheet = derive(state);
    const by = (attr: string) => sheet.attributes.find((a) => a.attr === attr)!;

    expect(by('Strength').value.total).toBe(3);
    expect(by('Strength').offence.total).toBe(4);        // Str 3 + Offence 1
    expect(by('Constitution').value.total).toBe(2);
    expect(by('Constitution').save.total).toBe(4);       // Con 2 + Defence 2
    expect(by('Constitution').unarmouredDefence.total).toBe(14);
    expect(by('Intelligence').value.total).toBe(-1);     // the Flaw
    expect(by('Charisma').value.total).toBe(-1);

    expect(sheet.hitPoints.total).toBe(8);               // 5 + Class HP 3
    expect(sheet.level).toBe(1);                         // crystallized, no milestones

    const endurance = sheet.skills.find((s) => s.skill === 'Endurance')!;
    expect(endurance.value.total).toBe(4);               // Con 2 + Class Skill 2
    expect(endurance.isClassSkill).toBe(true);

    expect(sheet.languages).toContain('Imperial');
    expect(sheet.languages).toContain('Kellish');

    const heavyBlades = sheet.proficiencies.find((p) => p.group === 'Heavy Blades')!;
    expect(heavyBlades).toMatchObject({ rank: 1, advanceable: true });
  });

  it('every derived number shows its work', () => {
    const sheet = derive(state);
    const str = sheet.attributes.find((a) => a.attr === 'Strength')!;
    expect(str.offence.parts).toEqual([
      { label: 'Strength', value: 3 },
      { label: 'Offence Ranks', value: 1 },
    ]);
    expect(sheet.hitPoints.parts[0]).toEqual({ label: 'Base', value: 5 });
  });
});

describe('enforcement', () => {
  it('blocks overspending the bank', () => {
    const { flags } = replay([
      ev('class-chosen', { classId: 'scholar' }),
      ev('subclass-chosen', { subclassId: 'arcanist' }),
      ...Array.from({ length: 5 }, () => ev('attribute-bought', { attr: 'Intelligence' as const })),
    ]);
    // Int +1(1) +2(2) +3(3) = 6 spent, cap +3 — the 4th step over-caps, and
    // even without the cap the 5th could not be afforded.
    expect(flags.some((f) => f.code === 'over-cap')).toBe(true);
  });

  it('caps non-class attributes at +2', () => {
    const { flags } = replay([
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('attribute-bought', { attr: 'Wisdom' }),
      ev('attribute-bought', { attr: 'Wisdom' }),
      ev('attribute-bought', { attr: 'Wisdom' }),
    ]);
    expect(flags).toHaveLength(1);
    expect(flags[0].code).toBe('over-cap');
  });

  it('opens the +4 attribute gate at Level 5', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('attribute-bought', { attr: 'Strength' }),
      ev('attribute-bought', { attr: 'Strength' }),
      ev('attribute-bought', { attr: 'Strength' }),
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0 }),
      ev('crystallized', {}),
    ];
    const blocked = replay([...base, ev('attribute-bought', { attr: 'Strength' })]);
    expect(blocked.flags.some((f) => f.code === 'over-cap')).toBe(true);

    // 12 milestones → Level 5; the bank has 12 more Majors, +4 costs 4.
    const milestones = Array.from({ length: 12 }, () => ev('milestone-granted', {}));
    const open = replay([...base, ...milestones, ev('attribute-bought', { attr: 'Strength' })]);
    expect(open.flags).toEqual([]);
    expect(open.state.attributeRanks.Strength).toBe(4);
  });

  it('refuses Abilities from Categories the build cannot reach', () => {
    const { flags } = replay([
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('ability-bought', { ref: { category: 'Witchcraft', ability: 'Hex' } }),
    ]);
    expect(flags.some((f) => f.code === 'no-access' || f.code === 'unknown-ref')).toBe(true);
  });

  it('re-opens once-per-Level HP at the first Milestone of the next triad', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('hp-bought', {}),
    ];
    const sameWindow = replay([...base, ev('hp-bought', {})]);
    expect(sameWindow.flags.some((f) => f.code === 'once-per-level')).toBe(true);

    const nextWindow = replay([...base, ev('milestone-granted', {}), ev('hp-bought', {})]);
    expect(nextWindow.flags).toEqual([]);
    expect(nextWindow.state.hpPurchases).toBe(2);
  });

  it('paces any one Ladder to one Rank per Level', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('ability-bought', { ref: { category: 'Arms', ability: 'Martial Strike' } }),
      ev('ability-advanced', { ref: { category: 'Arms', ability: 'Martial Strike' }, variable: 'damage', toRank: 1 }),
    ];
    const tooFast = replay([
      ...base,
      ev('ability-advanced', { ref: { category: 'Arms', ability: 'Martial Strike' }, variable: 'damage', toRank: 2 }),
    ]);
    expect(tooFast.flags.some((f) => f.code === 'ladder-pace')).toBe(true);

    const paced = replay([
      ...base,
      ev('milestone-granted', {}),
      ev('ability-advanced', { ref: { category: 'Arms', ability: 'Martial Strike' }, variable: 'damage', toRank: 2 }),
    ]);
    expect(paced.flags).toEqual([]);
  });

  it('keeps Flaws creation-only and at most two', () => {
    const three = replay([
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('flaw-taken', { attr: 'Intelligence' }),
      ev('flaw-taken', { attr: 'Charisma' }),
      ev('flaw-taken', { attr: 'Wisdom' }),
    ]);
    expect(three.flags.some((f) => f.code === 'over-cap')).toBe(true);

    const late = replay([
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0 }),
      ev('crystallized', {}),
      ev('flaw-taken', { attr: 'Wisdom' }),
    ]);
    expect(late.flags.some((f) => f.code === 'creation-only')).toBe(true);
  });

  it('requires the spine order: class, then subclass; Quirk before crystallizing', () => {
    const { flags } = replay([
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('crystallized', {}),
    ]);
    expect(flags.map((f) => f.code)).toEqual(['wrong-order', 'wrong-order']);
  });

  it('multiclassing prices 3 then 6 Major and widens Category access', () => {
    const events = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ...Array.from({ length: 9 }, () => ev('milestone-granted', {})),
      ev('class-added', { classId: 'friar', subclassId: 'mendicant' }),
      ev('class-added', { classId: 'scholar', subclassId: 'physician' }),
    ];
    const { state, flags } = replay(events);
    expect(flags).toEqual([]);
    // 11 + 9 − 3 − 6 = 11 Majors left
    expect(state.bank.major).toBe(11);
    expect(accessibleCategories(state)).toEqual(
      expect.arrayContaining(['Arms', 'Protection', 'Mercy', 'Forbearance', 'Letters', 'Medicine']),
    );
  });
});

describe('the derivation clock', () => {
  it('derives Level from Milestones per §7', () => {
    expect(levelFor(0, false)).toBe(0);   // creation
    expect(levelFor(0, true)).toBe(1);    // play begins
    expect(levelFor(2, true)).toBe(1);    // mid-triad
    expect(levelFor(3, true)).toBe(2);    // triad complete
    expect(levelFor(30, true)).toBe(11);  // the cap
    expect(levelFor(33, true)).toBe(11);  // never past it
  });

  it('opens once-per-Level windows at Milestones 1, 4, 7…', () => {
    expect(windowFor(0)).toBe(0);
    expect(windowFor(1)).toBe(1);
    expect(windowFor(3)).toBe(1);
    expect(windowFor(4)).toBe(2);
  });
});
