// The record engine's suite: Gareth Ironside (the site's worked example)
// rebuilt event by event, plus the rules the engine must enforce — bank
// accounting, caps, pacing windows, access, and ordering.

import { describe, expect, it } from 'vitest';

import type { RecordEvent } from './events';
import { derive } from './derive';
import { accessibleCategories, companionLevel, levelFor, replay, windowFor } from './replay';

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
    ev('skill-advanced', { skill: 'Endurance' }),
    ev('skill-advanced', { skill: 'Intimidate' }),
    ev('skill-advanced', { skill: 'Survival' }),
    ev('skill-advanced', { skill: 'Perception' }),
    ev('proficiency-advanced', { group: 'Heavy Blades' }),
    ev('language-bought', { language: 'Kellish' }),
    // The finale
    ev('quirk-rolled', { quirkName: 'Gutter Auld', slots: {}, rerollsUsed: 1, gearName: 'The Rare Musket', gearSlots: {} }),
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
    expect(endurance.value.total).toBe(3);               // Con 2 + Rank 1
    expect(endurance.isClassSkill).toBe(true);

    // Class Skills arrive Trained (+0) even unadvanced — all six present.
    const trained = sheet.skills.map((s) => s.skill);
    for (const s of ['Endurance', 'Intimidate', 'Survival', 'Perception']) {
      expect(trained).toContain(s);
    }

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
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
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

  it('paces each Ability to one Minor and one Major advance per Level', () => {
    const ms = { category: 'Arms', ability: 'Martial Strike' };
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('ability-bought', { ref: ms }),
      // The 0-level allotment: one m (damage Rank 1) + one M (frequency Rank 1).
      ev('ability-advanced', { ref: ms, variable: 'damage', toRank: 1 }),
      ev('ability-advanced', { ref: ms, variable: 'frequency', toRank: 1 }),
    ];
    expect(replay(base).flags).toEqual([]);

    // A second Minor-cost advance in the same Level is refused…
    const secondMinor = replay([
      ...base,
      ev('ability-advanced', { ref: ms, variable: 'damage', toRank: 2 }),
    ]);
    expect(secondMinor.flags.some((f) => f.code === 'ladder-pace')).toBe(true);

    // …and opens again at the next Milestone.
    const paced = replay([
      ...base,
      ev('milestone-granted', {}),
      ev('ability-advanced', { ref: ms, variable: 'damage', toRank: 2 }),
    ]);
    expect(paced.flags).toEqual([]);
  });

  it('enforces a Rank’s own Level note (damage 2[W] waits for L5)', () => {
    const ms = { category: 'Arms', ability: 'Martial Strike' };
    const toRank3 = (extra: RecordEvent[]) =>
      replay([
        ev('class-chosen', { classId: 'soldier' }),
        ev('subclass-chosen', { subclassId: 'vanguard' }),
        ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
        ev('crystallized', {}),
        ev('ability-bought', { ref: ms }),
        ev('ability-advanced', { ref: ms, variable: 'damage', toRank: 1 }),
        ev('milestone-granted', {}),
        ev('ability-advanced', { ref: ms, variable: 'damage', toRank: 2 }),
        ...extra,
        ev('ability-advanced', { ref: ms, variable: 'damage', toRank: 3 }),
      ]);
    // Milestone 2 — nowhere near Level 5: the L5-noted Rank refuses.
    expect(
      toRank3([ev('milestone-granted', {})]).flags.some((f) =>
        f.message.includes('Level 5'),
      ),
    ).toBe(true);
    // 12 milestones in → Level 5: it opens.
    const open = toRank3(
      Array.from({ length: 11 }, () => ev('milestone-granted', {})),
    );
    expect(open.flags).toEqual([]);
  });

  it('runs the Skill track: Trained +0, +1 open, +2 at Level 3, +3 at Level 5', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
      ev('crystallized', {}),
      ev('skill-advanced', { skill: 'Endurance' }),
    ];
    // +2 before Level 3 is refused…
    const early = replay([...base, ev('skill-advanced', { skill: 'Endurance' })]);
    expect(early.flags.some((f) => f.code === 'over-cap')).toBe(true);

    // …opens at Level 3 (6 Milestones), and +3 waits for Level 5.
    const toL3 = Array.from({ length: 6 }, () => ev('milestone-granted', {}));
    const atL3 = replay([...base, ...toL3, ev('skill-advanced', { skill: 'Endurance' })]);
    expect(atL3.flags).toEqual([]);
    expect(atL3.state.skillRanks.Endurance).toBe(2);

    const plus3Early = replay([
      ...base, ...toL3,
      ev('skill-advanced', { skill: 'Endurance' }),
      ev('skill-advanced', { skill: 'Endurance' }),
    ]);
    expect(plus3Early.flags.some((f) => f.message.includes('Level 5'))).toBe(true);
  });

  it('lets anyone train an off-list Skill, capped at +1 forever', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
    ];
    // Advancing untrained is refused; train first, then +1, then never +2.
    const untrained = replay([...base, ev('skill-advanced', { skill: 'Stealth' })]);
    expect(untrained.flags.some((f) => f.code === 'wrong-order')).toBe(true);

    const track = replay([
      ...base,
      ev('skill-trained', { skill: 'Stealth' }),
      ev('skill-advanced', { skill: 'Stealth' }),
      ev('skill-advanced', { skill: 'Stealth' }),
    ]);
    expect(track.flags).toHaveLength(1);
    expect(track.flags[0].message).toContain('never passes +1');
    expect(track.state.skillRanks.Stealth).toBe(1);

    // Training a Class Skill is refused — it's already Trained, free.
    const redundant = replay([...base, ev('skill-trained', { skill: 'Endurance' })]);
    expect(redundant.flags.some((f) => f.code === 'duplicate')).toBe(true);
  });

  it('builds spell-builder instances: many copies, named, each with its choice', () => {
    const ref = { category: 'New Magic', ability: 'Telum Eminus' };
    const base = [
      ev('class-chosen', { classId: 'scholar' }),
      ev('subclass-chosen', { subclassId: 'arcanist' }),
    ];

    // Two copies with different elements — both legal, separately laddered.
    const two = replay([
      ...base,
      ev('ability-bought', { ref, instanceId: 'sp1', instanceName: 'Anselm’s Dart', choices: { element: 'Fire' } }),
      ev('ability-bought', { ref, instanceId: 'sp2', choices: { element: 'Cold' } }),
      ev('ability-advanced', { ref, instanceId: 'sp1', variable: 'damage', toRank: 1 }),
      ev('ability-advanced', { ref, instanceId: 'sp2', variable: 'damage', toRank: 1 }),
      ev('ability-renamed', { ref, instanceId: 'sp2', name: 'Winter’s Tooth' }),
    ]);
    expect(two.flags).toEqual([]);
    expect(two.state.abilities).toHaveLength(2);
    expect(two.state.abilities[0].name).toBe('Anselm’s Dart');
    expect(two.state.abilities[1].name).toBe('Winter’s Tooth');
    expect(two.state.abilities[1].choices).toEqual({ element: 'Cold' });

    // Missing or invented choices are refused; so are reused instance ids.
    const noChoice = replay([...base, ev('ability-bought', { ref, instanceId: 'x' })]);
    expect(noChoice.flags[0].message).toContain('Element');
    const badChoice = replay([
      ...base,
      ev('ability-bought', { ref, instanceId: 'x', choices: { element: 'Gravy' } }),
    ]);
    expect(badChoice.flags[0].message).toContain('Gravy');
    const dupId = replay([
      ...base,
      ev('ability-bought', { ref, instanceId: 'x', choices: { element: 'Fire' } }),
      ev('ability-bought', { ref, instanceId: 'x', choices: { element: 'Cold' } }),
    ]);
    expect(dupId.flags.some((f) => f.code === 'duplicate')).toBe(true);

    // A builder purchase without an instance id is refused outright.
    const bare = replay([...base, ev('ability-bought', { ref })]);
    expect(bare.flags.some((f) => f.code === 'wrong-order')).toBe(true);

    // Non-builder cards still refuse duplicates.
    const martial = replay([
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('ability-bought', { ref: { category: 'Arms', ability: 'Martial Strike' } }),
      ev('ability-bought', { ref: { category: 'Arms', ability: 'Martial Strike' } }),
    ]);
    expect(martial.flags.some((f) => f.code === 'duplicate')).toBe(true);
  });

  it('applies Vow passives to the sheet, labeled by source', () => {
    const { state, flags } = replay([
      ev('class-chosen', { classId: 'friar' }),
      ev('subclass-chosen', { subclassId: 'mendicant' }),
      ev('ability-bought', { ref: { category: 'Forbearance', ability: 'Vow of Poverty' } }),
      ev('ability-bought', { ref: { category: 'Forbearance', ability: 'Vow of Abstinence' } }),
    ]);
    expect(flags).toEqual([]);
    const sheet = derive(state);
    for (const a of sheet.attributes) {
      // Vow of Poverty: +1 to every Defence, named on the breakdown.
      expect(a.unarmouredDefence.total).toBe(10 + a.value.total + 1);
      expect(a.unarmouredDefence.parts).toContainEqual({ label: 'Vow of Poverty', value: 1 });
      expect(a.armouredDefence.parts).toContainEqual({ label: 'Vow of Poverty', value: 1 });
      // Vow of Abstinence: +1 to every Save.
      expect(a.save.parts).toContainEqual({ label: 'Vow of Abstinence', value: 1 });
    }
  });

  it('applies skill passives (Beast-Wise reaches Handle Animal)', () => {
    const { state } = replay([
      ev('class-chosen', { classId: 'naturalist' }),
      ev('subclass-chosen', { subclassId: 'shepherd' }),
      ev('ability-bought', { ref: { category: 'Harvest', ability: 'Beast-Wise' } }),
    ]);
    const handle = derive(state).skills.find((s) => s.skill === 'Handle Animal')!;
    expect(handle.value.parts).toContainEqual({ label: 'Beast-Wise', value: 1 });
  });

  it('gates Feats by the can-use rule and the Level 2 door', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
      ev('crystallized', {}),
    ];
    const toL2 = Array.from({ length: 3 }, () => ev('milestone-granted', {}));

    // Before Level 2 the Specialization refuses; at Level 2, a proficient
    // group opens and an unproficient one still refuses.
    const early = replay([...base, ev('feat-bought', { featId: 'spec-heavy-blades' })]);
    expect(early.flags.some((f) => f.message.includes('Level 2'))).toBe(true);

    const atL2 = replay([...base, ...toL2, ev('feat-bought', { featId: 'spec-heavy-blades' })]);
    expect(atL2.flags).toEqual([]);
    expect(atL2.state.feats).toContainEqual({ featId: 'spec-heavy-blades', choices: undefined, rank: 1 });

    const noProf = replay([...base, ...toL2, ev('feat-bought', { featId: 'spec-bows' })]);
    expect(noProf.flags.some((f) => f.code === 'no-access')).toBe(true);

    // A bought proficiency is a real door: buy Bows, then the Feat opens.
    const bought = replay([
      ...base, ...toL2,
      ev('proficiency-bought', { group: 'Bows' }),
      ev('feat-bought', { featId: 'spec-bows' }),
    ]);
    expect(bought.flags).toEqual([]);
  });

  it('gates damage-type and Malediction Specializations on what the build can deal', () => {
    const arcanist = [
      ev('class-chosen', { classId: 'scholar' }),
      ev('subclass-chosen', { subclassId: 'arcanist' }),
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
      ev('crystallized', {}),
      ...Array.from({ length: 3 }, () => ev('milestone-granted', {})),
    ];
    // No Fire ability yet: refused. Build a Fire spell: opens.
    const cold = replay([...arcanist, ev('feat-bought', { featId: 'spec-fire' })]);
    expect(cold.flags.some((f) => f.code === 'no-access')).toBe(true);

    const fire = replay([
      ...arcanist,
      ev('ability-bought', {
        ref: { category: 'New Magic', ability: 'Telum Eminus' },
        instanceId: 'sp1', choices: { element: 'Fire' },
      }),
      ev('feat-bought', { featId: 'spec-fire' }),
    ]);
    expect(fire.flags).toEqual([]);
  });

  it('runs Feat Ladders on the standard pacing, and applies feat effects', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('feat-bought', { featId: 'commerce-ladder' }),
    ];
    // Rank 2 in the same Level refuses; the next Milestone opens it.
    const tooFast = replay([...base, ev('feat-advanced', { featId: 'commerce-ladder', toRank: 2 })]);
    expect(tooFast.flags.some((f) => f.code === 'ladder-pace')).toBe(true);

    const paced = replay([
      ...base,
      ev('milestone-granted', {}),
      ev('feat-advanced', { featId: 'commerce-ladder', toRank: 2 }),
    ]);
    expect(paced.flags).toEqual([]);
    expect(paced.state.feats[0].rank).toBe(2);

    // A Market Access Feat is a plain Minor purchase.
    const marketFeat = replay([...base, ev('feat-bought', { featId: 'market-theobalds-row' })]);
    expect(marketFeat.flags).toEqual([]);
    expect(marketFeat.state.feats.some((f) => f.featId === 'market-theobalds-row')).toBe(true);

    // A plain Feat's unconditional effect reaches the sheet, labeled.
    const ritualist = replay([
      ev('class-chosen', { classId: 'naturalist' }),
      ev('subclass-chosen', { subclassId: 'drymann' }),
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
      ev('crystallized', {}),
      ...Array.from({ length: 3 }, () => ev('milestone-granted', {})),
      ev('feat-bought', { featId: 'spec-ritual' }),
    ]);
    expect(ritualist.flags).toEqual([]);
    const rituals = derive(ritualist.state).skills.find((s) => s.skill === 'Rituals')!;
    expect(rituals.value.parts).toContainEqual({ label: 'Specialization — Rituals', value: 1 });
  });

  it('sums Toughness Ranks into HP and its capstone into DR', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('feat-bought', { featId: 'toughness' }),
    ];
    const one = derive(replay(base).state);
    expect(one.hitPoints.parts).toContainEqual({ label: 'Toughness', value: 1 });
    expect(one.damageReduction.total).toBe(0);

    const climbs = [2, 3, 4].flatMap((toRank) => [
      ev('milestone-granted', {}),
      ev('milestone-granted', {}),
      ev('milestone-granted', {}),
      ev('feat-advanced', { featId: 'toughness', toRank }),
    ]);
    const topped = replay([...base, ...climbs]);
    expect(topped.flags).toEqual([]);
    const sheet = derive(topped.state);
    // Ranks 1–3 stack: +1, +2, +3 max HP.
    expect(sheet.hitPoints.parts.filter((p) => p.label === 'Toughness')).toHaveLength(3);
    expect(sheet.damageReduction.total).toBe(1);
    expect(sheet.damageReduction.parts).toContainEqual({ label: 'Toughness', value: 1 });
  });

  it('advances named Ladders: Generic Advances buyable, Scribe / Create gated, shared pace', () => {
    const ref = { category: 'Letters', ability: 'Read Scrolls' };
    const base = [
      ev('class-chosen', { classId: 'scholar' }),
      ev('subclass-chosen', { subclassId: 'arcanist' }),
      ev('ability-bought', { ref }),
    ];
    const ga = replay([...base, ev('ability-advanced', { ref, variable: 'Generic Advances', toRank: 1 })]);
    expect(ga.flags).toEqual([]);
    expect(ga.state.abilities[0].ranks['Generic Advances']).toBe(1);

    // Scribe / Create's first Rank opens at Level 3.
    const early = replay([...base, ev('ability-advanced', { ref, variable: 'Scribe / Create', toRank: 1 })]);
    expect(early.flags.some((f) => f.code === 'over-cap')).toBe(true);

    // Named Ladders share the card's one-Minor-one-Major-per-Level pace.
    const paced = replay([
      ...base,
      ev('ability-advanced', { ref, variable: 'effects', toRank: 1 }),
      ev('ability-advanced', { ref, variable: 'Generic Advances', toRank: 1 }),
    ]);
    expect(paced.flags.some((f) => f.code === 'ladder-pace')).toBe(true);

    // A Companion's stat Ladders are not reachable this way — they belong to
    // the Companion economy.
    const dogRef = { category: 'Husbandry', ability: 'Shepherd’s Dog' };
    const dog = replay([
      ev('class-chosen', { classId: 'naturalist' }),
      ev('subclass-chosen', { subclassId: 'shepherd' }),
      ev('ability-bought', { ref: dogRef }),
      ev('ability-advanced', { ref: dogRef, variable: 'HP', toRank: 1 }),
    ]);
    expect(dog.flags.some((f) => f.code === 'unknown-ref')).toBe(true);
  });

  it('bonds, names, and advances a Companion on the two-bank economy', () => {
    const ref = { category: 'Husbandry', ability: 'Shepherd’s Dog' };
    const base = [
      ev('class-chosen', { classId: 'naturalist' }),
      ev('subclass-chosen', { subclassId: 'shepherd' }),
      ev('ability-bought', { ref }),
      ev('companion-named', { ref, name: 'Bram', description: 'A wiry grey herder' }),
    ];
    const bonded = replay(base);
    expect(bonded.flags).toEqual([]);
    const dog = bonded.state.abilities[0];
    expect(dog.companion?.name).toBe('Bram');
    expect(companionLevel(bonded.state, dog)).toBe(0);

    // At Level 0 the dog has no bank of its own — the owner's Minors pay.
    const invested = replay([...base, ev('companion-advanced', { ref, ladder: 'HP', toRank: 1 })]);
    expect(invested.flags).toEqual([]);
    expect(invested.state.abilities[0].companion?.ownerSpent.minor).toBe(1);

    // One Rank per Ladder per Level — but investment moves other Ladders.
    const tooFast = replay([
      ...base,
      ev('companion-advanced', { ref, ladder: 'HP', toRank: 1 }),
      ev('companion-advanced', { ref, ladder: 'HP', toRank: 2 }),
    ]);
    expect(tooFast.flags.some((f) => f.code === 'ladder-pace')).toBe(true);
    const twoLadders = replay([
      ...base,
      ev('companion-advanced', { ref, ladder: 'HP', toRank: 1 }),
      ev('companion-advanced', { ref, ladder: 'Attack', toRank: 1 }),
    ]);
    expect(twoLadders.flags).toEqual([]);

    // A Level later the dog's own earned Minor pays before the owner's bank.
    const grown = replay([
      ...base,
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
      ev('crystallized', {}),
      ...Array.from({ length: 3 }, () => ev('milestone-granted', {})),
      ev('companion-advanced', { ref, ladder: 'HP', toRank: 1 }),
    ]);
    expect(grown.flags).toEqual([]);
    const grownDog = grown.state.abilities[0];
    expect(companionLevel(grown.state, grownDog)).toBe(1);
    expect(grownDog.companion?.ownSpent.minor).toBe(1);
    expect(grownDog.companion?.ownerSpent.minor).toBe(0);
    // The owner's Minors are untouched: 11 creation + 3 milestones.
    expect(grown.state.bank.minor).toBe(14);
  });

  it('Polyglot opens on any one of Int, Wis, or Cha at +2', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
    ];
    const none = replay([...base, ev('feat-bought', { featId: 'polyglot' })]);
    expect(none.flags.some((f) => f.code === 'no-access')).toBe(true);

    const cha = replay([
      ...base,
      ev('attribute-bought', { attr: 'Charisma' }),
      ev('attribute-bought', { attr: 'Charisma' }),
      ev('feat-bought', { featId: 'polyglot' }),
    ]);
    expect(cha.flags).toEqual([]);

    // Rank 1 grants free languages equal to the best of Int/Wis/Cha (2 here):
    // two cost nothing, the third costs the usual Minor.
    const spoken = replay([
      ...base,
      ev('attribute-bought', { attr: 'Charisma' }),
      ev('attribute-bought', { attr: 'Charisma' }),
      ev('feat-bought', { featId: 'polyglot' }),
      ev('language-bought', { language: 'Kellish' }),
      ev('language-bought', { language: 'Elder' }),
      ev('language-bought', { language: 'Archipelago' }),
    ]);
    expect(spoken.flags).toEqual([]);
    expect(spoken.state.languages).toHaveLength(3);
    expect(spoken.state.freeLanguagesUsed).toBe(2);
    // 11 Minors − 1 (Polyglot) − 1 (the third language) = 9.
    expect(spoken.state.bank.minor).toBe(9);
  });

  it('gates Defensive Specialization on the whole Save total, not the Attribute alone', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('attribute-bought', { attr: 'Strength' }),
      ev('attribute-bought', { attr: 'Strength' }),
    ];
    // Str +2 alone is not a +3 Save.
    const atTwo = replay([...base, ev('feat-bought', { featId: 'defensive-spec-str' })]);
    expect(atTwo.flags.some((f) => f.code === 'no-access')).toBe(true);

    // A Defence Rank lifts the Save to +3 and opens the Feat.
    const atThree = replay([
      ...base,
      ev('defence-bought', { attr: 'Strength' }),
      ev('feat-bought', { featId: 'defensive-spec-str' }),
    ]);
    expect(atThree.flags).toEqual([]);
  });

  it('a Skill Generalist counts as Trained across its Attribute', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('attribute-bought', { attr: 'Intelligence' }),
      ev('feat-bought', { featId: 'skill-generalist-int' }),
    ];
    const result = replay(base);
    expect(result.flags).toEqual([]);

    // Covered Skills are not listed one by one — the sheet carries one
    // summary line: Int Skills Generalist +1 (the attribute, Trained +0).
    const sheet = derive(result.state);
    expect(sheet.skills.find((s) => s.skill === 'History')).toBeUndefined();
    expect(sheet.skillGeneralists).toContainEqual({ attr: 'Intelligence', total: 1 });

    // And "counts as Trained" satisfies other Feats' Trained requirements:
    // Specialization — Rituals opens at Level 2 without separate training.
    const spec = replay([
      ...base,
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
      ev('crystallized', {}),
      ...Array.from({ length: 3 }, () => ev('milestone-granted', {})),
      ev('feat-bought', { featId: 'spec-ritual' }),
    ]);
    expect(spec.flags).toEqual([]);
  });

  it('gates Attribute Skills Specialization on +2 in the Attribute', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
    ];
    const atOne = replay([
      ...base,
      ev('attribute-bought', { attr: 'Strength' }),
      ev('feat-bought', { featId: 'attr-skills-spec-str' }),
    ]);
    expect(atOne.flags.some((f) => f.code === 'no-access')).toBe(true);

    const atTwo = replay([
      ...base,
      ev('attribute-bought', { attr: 'Strength' }),
      ev('attribute-bought', { attr: 'Strength' }),
      ev('feat-bought', { featId: 'attr-skills-spec-str' }),
    ]);
    expect(atTwo.flags).toEqual([]);
    expect(atTwo.state.feats).toContainEqual({ featId: 'attr-skills-spec-str', choices: undefined, rank: 1 });
  });

  it('gates Skill Specialization on Rank +1 in the Skill', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
    ];
    // Trained is not enough — the Skill must hold Rank +1. Endurance is a
    // Soldier Class Skill: Trained free, no Ranks yet.
    const untrained = replay([...base, ev('feat-bought', { featId: 'skill-spec-endurance' })]);
    expect(untrained.flags.some((f) => f.code === 'no-access')).toBe(true);

    const ranked = replay([
      ...base,
      ev('skill-advanced', { skill: 'Endurance' }),
      ev('feat-bought', { featId: 'skill-spec-endurance' }),
    ]);
    expect(ranked.flags).toEqual([]);
    expect(ranked.state.feats).toContainEqual({ featId: 'skill-spec-endurance', choices: undefined, rank: 1 });
  });

  it('computes Initiative as the better of Dex and Wis, plus Danger Sense Ranks', () => {
    const events = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('attribute-bought', { attr: 'Wisdom' }),
      ev('feat-bought', { featId: 'danger-sense' }),
      ev('milestone-granted', {}),
      ev('milestone-granted', {}),
      ev('milestone-granted', {}),
      ev('feat-advanced', { featId: 'danger-sense', toRank: 2 }),
    ];
    const result = replay(events);
    expect(result.flags).toEqual([]);
    const initiative = derive(result.state).initiative;
    // Wis 1 beats Dex 0; Danger Sense Ranks 1–2 add 2 + 1.
    expect(initiative.parts[0]).toEqual({ label: 'Wisdom', value: 1 });
    expect(initiative.total).toBe(4);
  });

  it('grants Second Wind through its Feat, never by direct purchase', () => {
    const base = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
    ];
    const ref = { category: 'General', ability: 'Second Wind' };

    // The General Category is not buyable — only the Feat opens the card.
    const direct = replay([...base, ev('ability-bought', { ref })]);
    expect(direct.flags.some((f) => f.code === 'no-access')).toBe(true);

    const granted = replay([...base, ev('feat-bought', { featId: 'second-wind' })]);
    expect(granted.flags).toEqual([]);
    expect(granted.state.abilities).toContainEqual({ ref, ranks: {} });

    // The card advances on the ordinary machinery: one Minor + one Major
    // per Level, Ranks in order.
    const advanced = replay([
      ...base,
      ev('feat-bought', { featId: 'second-wind' }),
      ev('ability-advanced', { ref, variable: 'action', toRank: 1 }),
      ev('ability-advanced', { ref, variable: 'frequency', toRank: 1 }),
    ]);
    expect(advanced.flags).toEqual([]);
    const owned = advanced.state.abilities.find((a) => a.ref.ability === 'Second Wind')!;
    expect(owned.ranks).toEqual({ action: 1, frequency: 1 });

    // A second Minor advance in the same Level refuses.
    const tooFast = replay([
      ...base,
      ev('feat-bought', { featId: 'second-wind' }),
      ev('ability-advanced', { ref, variable: 'action', toRank: 1 }),
      ev('ability-advanced', { ref, variable: 'effects', toRank: 1 }),
    ]);
    expect(tooFast.flags.some((f) => f.code === 'ladder-pace')).toBe(true);
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
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} }),
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

  it('keeps a speciality Skill’s full name: the faith shows, and faiths are distinct Skills', () => {
    const base = [
      ev('class-chosen', { classId: 'friar' }),
      ev('subclass-chosen', { subclassId: 'mendicant' }),
    ];
    const { state } = replay(base);
    const names = derive(state).skills.map((s) => s.skill);
    expect(names).toContain('Religion (Saintly Faith)');
    expect(names).not.toContain('Religion');

    // A different faith is a different Skill — trainable, never a duplicate.
    const other = replay([...base, ev('skill-trained', { skill: 'Religion (Black Faith)' })]);
    expect(other.flags).toEqual([]);

    // The granted faith itself is refused: Trained already, free.
    const dup = replay([...base, ev('skill-trained', { skill: 'Religion (Saintly Faith)' })]);
    expect(dup.flags.some((f) => f.code === 'duplicate')).toBe(true);
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

describe('the package deploys to the sheet', () => {
  const base = () => [
    ev('class-chosen', { classId: 'soldier' }),
    ev('subclass-chosen', { subclassId: 'vanguard' }),
  ];
  /** A finale event from real corpus cards, with the fills a roll would draw. */
  const pkg = (
    quirkId: string, quirkName: string, slots: Record<string, string>,
    gearId: string, gearName: string, gearSlots: Record<string, string>,
  ) => ev('quirk-rolled', { quirkId, quirkName, slots, rerollsUsed: 0, gearId, gearName, gearSlots });

  it('folds unconditional modifiers into the breakdowns, labeled with their source', () => {
    // Left the Order at Compline: +1 Wisdom Defence, unconditional.
    const { state } = replay([...base(), pkg(
      'left-the-order-at-compline', 'Left the Order at Compline', { saint: 'St. Avitus' },
      'a-cursed-rabbits-foot', "A Cursed Rabbit's Foot", {},
    )]);
    const sheet = derive(state);
    const wis = sheet.attributes.find((a) => a.attr === 'Wisdom')!;
    expect(wis.unarmouredDefence.total).toBe(11);
    expect(wis.unarmouredDefence.parts).toContainEqual({
      label: 'Quirk · Left the Order at Compline', value: 1,
    });
    // The foot's −1 Dex Saves is conditional (while carried) — never summed.
    expect(sheet.attributes.find((a) => a.attr === 'Dexterity')!.save.total).toBe(0);
    expect(sheet.situational).toContainEqual({
      source: 'Gear · A Cursed Rabbit’s Foot',
      text: '−1 Dexterity Saves (while carried)',
    });
  });

  it('surfaces a skill modifier even on an Untrained skill, penalty and all', () => {
    // Hands Like a Cooper: +1 Craft — not a Soldier Class Skill.
    const { state } = replay([...base(), pkg(
      'hands-like-a-cooper', 'Hands Like a Cooper', {},
      'another-mans-weapon', "Another Man's {weapon}", { weapon: 'Axes', place: 'Waldheim' },
    )]);
    const sheet = derive(state);
    const craft = sheet.skills.find((s) => s.skill === 'Craft')!;
    expect(craft.untrained).toBe(true);
    expect(craft.value.parts).toContainEqual({ label: 'Untrained', value: -1 });
    expect(craft.value.parts).toContainEqual({ label: 'Quirk · Hands Like a Cooper', value: 1 });
    // The stolen weapon's scoped penalty resolves its {place} fill.
    expect(sheet.situational).toContainEqual({
      source: 'Gear · Another Man’s Axes',
      text: '−1 social checks (in Waldheim)',
    });
  });

  it('turns grants into real languages and proficiencies', () => {
    // Gutter Auld grants Auld Imperial; Bought a Bow grants a {weapon} group.
    const auld = replay([...base(), pkg(
      'gutter-auld', 'Gutter Auld', {},
      'a-physicians-chest', 'A Physician’s Chest', {},
    )]);
    expect(derive(auld.state).languages).toContain('Auld Imperial');

    const bow = replay([...base(), pkg(
      'bought-a-bow-in-waldheim', 'Bought a Bow in Waldheim', { weapon: 'Bows' },
      'a-black-tongue-pamphlet', 'A Black Tongue Pamphlet', {},
    )]);
    const bows = derive(bow.state).proficiencies.find((p) => p.group === 'Bows');
    expect(bows).toMatchObject({ rank: 0, advanceable: false });
  });

  it('refuses to crystallize on half a package', () => {
    const { flags } = replay([
      ...base(),
      ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0 }),
      ev('crystallized', {}),
    ]);
    expect(flags.some((f) => f.code === 'wrong-order' && f.message.includes('package'))).toBe(true);
  });

  it('a reroll replaces both halves — the package is one draw', () => {
    const { state } = replay([
      ...base(),
      pkg('gutter-auld', 'Gutter Auld', {}, 'a-physicians-chest', 'A Physician’s Chest', {}),
      pkg('hands-like-a-cooper', 'Hands Like a Cooper', {}, 'a-debt-come-due', 'A Debt Come Due', { place: 'Lysander' }),
    ]);
    expect(state.quirk?.id).toBe('hands-like-a-cooper');
    expect(state.gear?.id).toBe('a-debt-come-due');
    // No trace of the first roll's grants survives the replacement.
    expect(derive(state).languages).not.toContain('Auld Imperial');
  });

  it('starting coin leans against the Gear roll: bad 200, neutral 150, good 100', () => {
    const coin = (quirkId: string, quirkName: string, gearId: string, gearName: string) => {
      const { state } = replay([...base(), pkg(quirkId, quirkName, {}, gearId, gearName, {})]);
      return derive(state).startingCoin;
    };
    // Good quirk → bad gear → the fattest purse. The label never names the
    // category: the seesaw is not shown to players.
    expect(coin('hands-like-a-cooper', 'Hands Like a Cooper', 'a-cursed-rabbits-foot', 'A Cursed Rabbit’s Foot'))
      .toEqual({ total: 200, parts: [{ label: 'Starting coin', value: 200 }] });
    expect(coin('gutter-auld', 'Gutter Auld', 'a-physicians-chest', 'A Physician’s Chest')?.total).toBe(150);
    expect(coin('the-arrow-stayed-in', 'The Arrow Stayed In', 'a-masters-work', 'A Master’s Work')?.total).toBe(100);

    // A pre-gear log (or an unknown card) has no purse to derive.
    const legacy = replay([...base(), ev('quirk-rolled', { quirkName: 'Q', slots: {}, rerollsUsed: 0, gearName: 'G', gearSlots: {} })]);
    expect(derive(legacy.state).startingCoin).toBeUndefined();
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
