// derive(state) → the sheet's numbers, every one as a breakdown
// (builder spec §9): derivation returns labeled components, never bare
// totals — show-the-work is the shape of the engine's output, not a
// display feature.
//
// This slice covers the numbers the rules data can already feed: attributes,
// Offences, Saves, Defences, HP, Level, skills, languages, proficiencies.
// Armour/gear contributions join when the gear pillar lands.

import { classById, DEFAULT_LANGUAGE } from '../classes';
import { GEAR } from '../gear';
import { ATTR_FULL, parseAttr } from '../notation';
import { fill, fillEffect, QUIRKS } from '../quirks';
import type { Attribute, Condition, Effect } from '../quirks';
import { classSkills, grantedProficiencies, levelFor, type CharacterState } from './replay';
import { SKILLS } from '../skills';

/** Using a Skill Untrained takes −1 (some Skills bar Untrained use entirely
 * — that flag joins the skills data when Les inventories them). */
export const UNTRAINED_PENALTY = -1;

/** One labeled component of a derived number. */
export interface Part {
  label: string;
  value: number;
}

/** A derived number that shows its work. */
export interface Breakdown {
  total: number;
  parts: Part[];
}

function sum(parts: Part[]): Breakdown {
  return { total: parts.reduce((t, p) => t + p.value, 0), parts };
}

const ATTRIBUTES: Attribute[] = [
  'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
];

export interface DerivedAttribute {
  attr: Attribute;
  value: Breakdown;
  offence: Breakdown;
  save: Breakdown;
  /** Target number, 10-based. Armoured adds armour when gear data lands. */
  unarmouredDefence: Breakdown;
  armouredDefence: Breakdown;
}

export interface DerivedSkill {
  skill: string;
  attr: Attribute;
  isClassSkill: boolean;
  /** True when the skill is listed only because a modifier touches it —
   * the Untrained −1 is then part of its breakdown. */
  untrained?: boolean;
  value: Breakdown;
}

/** A conditional modifier the sheet can show but not sum — it fires only
 * under its condition (at night, vs Ferals, while carried…). */
export interface SituationalMod {
  source: string; // e.g. "Quirk · Gutter Auld"
  text: string;   // e.g. "−1 social checks (speaking Auld Imperial)"
}

export interface DerivedSheet {
  level: number;
  attributes: DerivedAttribute[];
  hitPoints: Breakdown;
  speed: Breakdown;
  /** Trained skills, plus any skill a modifier touches. */
  skills: DerivedSkill[];
  languages: string[];
  /** Proficiency group → advancement bonus (granted and bought). */
  proficiencies: { group: string; rank: number; advanceable: boolean }[];
  /** Conditional modifiers from the Quirk & Gear package (later: Feats). */
  situational: SituationalMod[];
}

// ── The package's effects ───────────────────────────────────────────────────
// The event stores decisions (card id + slot fills); the effects re-derive
// from the corpus here, so a card retune reaches every sheet on next replay.

interface SourcedEffect {
  source: string;
  effect: Effect;
}

function packageEffects(state: CharacterState): SourcedEffect[] {
  const out: SourcedEffect[] = [];
  const quirk = state.quirk?.id ? QUIRKS.find((q) => q.id === state.quirk!.id) : undefined;
  if (quirk && state.quirk) {
    const fills = state.quirk.slots;
    for (const e of quirk.effects) {
      out.push({ source: `Quirk · ${fill(quirk.name, fills)}`, effect: fillEffect(e, fills) });
    }
  }
  const gear = state.gear?.id ? GEAR.find((g) => g.id === state.gear!.id) : undefined;
  if (gear && state.gear) {
    const fills = state.gear.slots;
    for (const e of gear.effects) {
      out.push({ source: `Gear · ${fill(gear.name, fills)}`, effect: fillEffect(e, fills) });
    }
  }
  return out;
}

/** An effect with any condition at all is situational — shown, never summed. */
function isConditional(effect: Effect): boolean {
  const when = 'when' in effect ? effect.when : undefined;
  return when !== undefined && Object.values(when).some(Boolean);
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

function describeCondition(when: Condition): string {
  const parts: string[] = [];
  if (when.targetTag) parts.push(`vs ${when.targetTag}`);
  if (when.proficiency) parts.push(`with ${when.proficiency}`);
  if (when.language) parts.push(`speaking ${when.language}`);
  if (when.place) parts.push(`in ${when.place}`);
  if (when.culture) parts.push(`with ${when.culture}`);
  if (when.note) parts.push(when.note);
  return parts.join(', ');
}

function describeEffect(effect: Effect): string {
  const cond = 'when' in effect && effect.when ? describeCondition(effect.when) : '';
  const suffix = cond ? ` (${cond})` : '';
  switch (effect.kind) {
    case 'skillMod': return `${signed(effect.value)} ${effect.skill}${suffix}`;
    case 'saveMod': return `${signed(effect.value)} ${effect.attr} Saves${suffix}`;
    case 'defenceMod': return `${signed(effect.value)} ${effect.attr} Defence${suffix}`;
    case 'attackMod': return `${signed(effect.value)} to hit${suffix}`;
    case 'socialPenalty': return `${signed(effect.value)} social checks${suffix}`;
    case 'grantProficiency': return `Proficiency: ${effect.group}`;
    case 'grantLanguage': return `Language: ${effect.language}`;
  }
}

export function derive(state: CharacterState): DerivedSheet {
  // The Quirk & Gear package: unconditional effects fold into the breakdowns
  // below (labeled with their source); conditional ones surface as
  // situational lines the sheet shows but never sums.
  const effects = packageEffects(state);
  const situational: SituationalMod[] = effects
    .filter((se) => isConditional(se.effect))
    .map((se) => ({ source: se.source, text: describeEffect(se.effect) }));
  const steady = effects.filter((se) => !isConditional(se.effect));
  const steadyParts = (match: (e: Effect) => boolean): Part[] =>
    steady
      .filter((se) => match(se.effect))
      .map((se) => ({ label: se.source, value: (se.effect as { value: number }).value }));

  const attrValue = (attr: Attribute): Breakdown => {
    const parts: Part[] = [];
    const bought = state.attributeRanks[attr] ?? 0;
    if (bought) parts.push({ label: 'Advances', value: bought });
    if (state.flaws.includes(attr)) parts.push({ label: 'Flaw', value: -1 });
    return sum(parts);
  };

  const attributes: DerivedAttribute[] = ATTRIBUTES.map((attr) => {
    const value = attrValue(attr);
    const off = state.offenceRanks[attr] ?? 0;
    const def = state.defenceRanks[attr] ?? 0;
    const base = (label: string): Part[] => [{ label, value: value.total }];
    const saveMods = steadyParts((e) => e.kind === 'saveMod' && e.attr === attr);
    const defenceMods = steadyParts((e) => e.kind === 'defenceMod' && e.attr === attr);

    return {
      attr,
      value,
      offence: sum([
        ...base(attr),
        ...(off ? [{ label: 'Offence Ranks', value: off }] : []),
      ]),
      // Save = Attribute + Defence Ranks (one track lifts both; ruled Aug 2026).
      save: sum([
        ...base(attr),
        ...(def ? [{ label: 'Defence Ranks', value: def }] : []),
        ...saveMods,
      ]),
      unarmouredDefence: sum([
        { label: 'Base', value: 10 },
        ...base(attr),
        ...(def ? [{ label: 'Defence Ranks', value: def }] : []),
        ...defenceMods,
      ]),
      // Armour's Equipment Bonus joins when the gear pillar lands.
      armouredDefence: sum([
        { label: 'Base', value: 10 },
        ...base(attr),
        ...(def ? [{ label: 'Defence Ranks', value: def }] : []),
        ...defenceMods,
      ]),
    };
  });

  const cls = state.classId ? classById(state.classId) : undefined;
  const hitPoints = sum([
    { label: 'Base', value: 5 },
    ...(state.hpPurchases && cls
      ? [{ label: `HP Advances ×${state.hpPurchases} (Class HP ${cls.classHP})`, value: state.hpPurchases * cls.classHP }]
      : []),
  ]);

  const speed = sum([{ label: 'Base', value: 30 }]);

  // Trained Skills: every Class Skill (Trained free, +0 until advanced) plus
  // any off-list Skill made Trained with a Minor. Untrained use is −1. A
  // skill an unconditional modifier touches is listed even Untrained — the
  // modifier exists either way, and the sheet must show where it lands.
  const ownClassSkills = classSkills(state);
  const moddedSkills = steady
    .filter((se) => se.effect.kind === 'skillMod')
    .map((se) => (se.effect as Extract<Effect, { kind: 'skillMod' }>).skill);
  const trainedNames = [
    ...new Set([
      ...ownClassSkills,
      ...state.trainedSkills,
      ...Object.keys(state.skillRanks),
      ...moddedSkills,
    ]),
  ];
  const skills: DerivedSkill[] = trainedNames.map((skill) => {
    const base = skill.replace(/\s*\(.*\)$/, '');
    const rank = state.skillRanks[skill] ?? 0;
    const def = SKILLS.find((s) => s.name === base);
    // A skill's governing attribute is the first listed ("Dex, Wis" → Dex).
    const short = parseAttr(def?.attrs.split(',')[0] ?? '');
    const attr: Attribute = short ? ATTR_FULL[short] : 'Wisdom';
    const attrTotal = attrValue(attr).total;
    const isClassSkill = ownClassSkills.includes(base);
    const untrained = !isClassSkill && !state.trainedSkills.includes(skill);
    return {
      skill,
      attr,
      isClassSkill,
      ...(untrained ? { untrained } : {}),
      value: sum([
        { label: attr, value: attrTotal },
        ...(untrained ? [{ label: 'Untrained', value: UNTRAINED_PENALTY }] : []),
        ...(rank ? [{ label: 'Ranks', value: rank }] : []),
        ...steadyParts((e) => e.kind === 'skillMod' && e.skill === skill),
      ]),
    };
  });

  const grantedLanguages = steady
    .filter((se) => se.effect.kind === 'grantLanguage')
    .map((se) => (se.effect as Extract<Effect, { kind: 'grantLanguage' }>).language);
  const languages = [
    DEFAULT_LANGUAGE,
    ...collectGrantedLanguages(state),
    ...grantedLanguages,
    ...state.languages,
  ].filter((l, i, xs) => xs.indexOf(l) === i);

  const granted = [...new Set(grantedProficiencies(state))];
  // Package grants behave like bought proficiencies: +0 forever, a door not a
  // career — and they never duplicate a group the build already has.
  const grantedByPackage = steady
    .filter((se) => se.effect.kind === 'grantProficiency')
    .map((se) => (se.effect as Extract<Effect, { kind: 'grantProficiency' }>).group)
    .filter((g) => !granted.includes(g) && !state.boughtProficiencies.includes(g));
  const proficiencies = [
    ...granted.map((group) => ({
      group,
      rank: state.proficiencyRanks[group] ?? 0,
      advanceable: true,
    })),
    ...state.boughtProficiencies.map((group) => ({ group, rank: 0, advanceable: false })),
    ...[...new Set(grantedByPackage)].map((group) => ({ group, rank: 0, advanceable: false })),
  ];

  return {
    level: levelFor(state.milestones, state.crystallized),
    attributes,
    hitPoints,
    speed,
    skills,
    languages,
    proficiencies,
    situational,
  };
}

function collectGrantedLanguages(state: CharacterState): string[] {
  const out: string[] = [];
  const pairs = [
    { classId: state.classId, subclassId: state.subclassId },
    ...state.addedClasses,
  ];
  for (const p of pairs) {
    const cls = p.classId ? classById(p.classId) : undefined;
    if (!cls) continue;
    out.push(...(cls.languages ?? []));
    const sub = cls.subclasses.find((s) => s.id === p.subclassId);
    out.push(...(sub?.languages ?? []));
  }
  return out;
}
