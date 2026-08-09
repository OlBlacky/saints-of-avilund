// derive(state) → the sheet's numbers, every one as a breakdown
// (builder spec §9): derivation returns labeled components, never bare
// totals — show-the-work is the shape of the engine's output, not a
// display feature.
//
// This slice covers the numbers the rules data can already feed: attributes,
// Offences, Saves, Defences, HP, Level, skills, languages, proficiencies.
// Armour/gear contributions join when the gear pillar lands.

import { classById } from '../classes';
import { DEFAULT_LANGUAGE } from '../languages';
import { GEAR, STARTING_COIN } from '../gear';
import { ATTR_FULL, parseAttr } from '../notation';
import type { Attribute, Condition, Effect } from '../quirks';
import {
  classSkills,
  grantedProficiencies,
  isConditional,
  levelFor,
  packageEffects,
  skillBase,
  type CharacterState,
} from './replay';
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
  /** Steady DR from any source; 0 parts until something grants it. */
  damageReduction: Breakdown;
  /** Initiative bonuses beyond the attribute; 0 parts until something grants one. */
  initiative: Breakdown;
  /** Trained skills, plus any skill a modifier touches. */
  skills: DerivedSkill[];
  /** One summary line per Skill Generalist Feat: its Attribute and the roll
   * bonus every covered Skill uses. */
  skillGeneralists: { attr: Attribute; total: number }[];
  languages: string[];
  /** Proficiency group → advancement bonus (granted and bought). */
  proficiencies: { group: string; rank: number; advanceable: boolean }[];
  /** Conditional modifiers from the Quirk & Gear package (later: Feats). */
  situational: SituationalMod[];
  /** Starting coin in sp, set by the Gear roll's category — bad 200,
   * neutral 150, good 100. Absent until the package is rolled (or on a
   * pre-gear log). Becomes the Wealth ledger's opening balance later. */
  startingCoin?: Breakdown;
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
    case 'saveMod': return `${signed(effect.value)} ${effect.attr ?? 'all'} Saves${suffix}`;
    case 'defenceMod': return `${signed(effect.value)} ${effect.attr ?? 'all'} Defence${suffix}`;
    case 'attackMod': return `${signed(effect.value)} to hit${suffix}`;
    case 'socialPenalty': return `${signed(effect.value)} social checks${suffix}`;
    case 'grantProficiency': return `Proficiency: ${effect.group}`;
    case 'grantLanguage': return `Language: ${effect.language}`;
    case 'maxHpMod': return `${signed(effect.value)} max HP`;
    case 'drMod': return `DR ${effect.value}${suffix}`;
    case 'initiativeMod': return `${signed(effect.value)} Initiative${suffix}`;
    case 'grantTrainedByAttr': return `Trained in ${effect.attr} Skills`;
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
    // An absent attr on the effect means all six (a Vow's blanket bonus).
    const saveMods = steadyParts((e) => e.kind === 'saveMod' && (e.attr ?? attr) === attr);
    const defenceMods = steadyParts((e) => e.kind === 'defenceMod' && (e.attr ?? attr) === attr);

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
    ...steadyParts((e) => e.kind === 'maxHpMod'),
  ]);

  const speed = sum([{ label: 'Base', value: 30 }]);

  const damageReduction = sum(steadyParts((e) => e.kind === 'drMod'));

  // Initiative = Dex or Wis, whichever is bigger, + modifiers (ruled Aug 2026).
  const dex = attributes.find((a) => a.attr === 'Dexterity')!.value.total;
  const wis = attributes.find((a) => a.attr === 'Wisdom')!.value.total;
  const initiative = sum([
    wis > dex ? { label: 'Wisdom', value: wis } : { label: 'Dexterity', value: dex },
    ...steadyParts((e) => e.kind === 'initiativeMod'),
  ]);

  // Trained Skills: every Class Skill (Trained free, +0 until advanced) plus
  // any off-list Skill made Trained with a Minor. Untrained use is −1. A
  // skill an unconditional modifier touches is listed even Untrained — the
  // modifier exists either way, and the sheet must show where it lands.
  const ownClassSkills = classSkills(state);
  const moddedSkills = steady
    .filter((se) => se.effect.kind === 'skillMod')
    .map((se) => (se.effect as Extract<Effect, { kind: 'skillMod' }>).skill);
  // A Skill Generalist counts as Trained in every Skill rolled with its
  // Attribute — those Skills list at +0 without the Untrained penalty.
  const generalistAttrs = new Set(
    steady
      .filter((se) => se.effect.kind === 'grantTrainedByAttr')
      .map((se) => (se.effect as Extract<Effect, { kind: 'grantTrainedByAttr' }>).attr),
  );
  const usesGeneralistAttr = (name: string): boolean => {
    const def = SKILLS.find((s) => s.name === skillBase(name));
    return (def?.attrs.split(',') ?? []).some((a) => {
      const short = parseAttr(a.trim());
      return short !== undefined && generalistAttrs.has(ATTR_FULL[short]);
    });
  };
  // Generalist-covered Skills are NOT listed one by one — the sheet carries
  // one summary line per Generalist instead (Les, Aug 2026). A covered Skill
  // still lists when something else puts it there (Ranks, a modifier), just
  // without the Untrained penalty.
  const skillGeneralists = [...generalistAttrs].map((attr) => ({
    attr,
    total: attrValue(attr).total,
  }));
  const trainedNames = [
    ...new Set([
      ...ownClassSkills,
      ...state.trainedSkills,
      ...Object.keys(state.skillRanks),
      ...moddedSkills,
    ]),
  ];
  const skills: DerivedSkill[] = trainedNames.map((skill) => {
    // The base name serves only to find the Skill's definition; the full
    // name — speciality and all — is what the sheet shows and compares.
    const rank = state.skillRanks[skill] ?? 0;
    const def = SKILLS.find((s) => s.name === skillBase(skill));
    // A skill's governing attribute is the first listed ("Dex, Wis" → Dex).
    const short = parseAttr(def?.attrs.split(',')[0] ?? '');
    const attr: Attribute = short ? ATTR_FULL[short] : 'Wisdom';
    const attrTotal = attrValue(attr).total;
    const isClassSkill = ownClassSkills.includes(skill);
    const untrained =
      !isClassSkill && !state.trainedSkills.includes(skill) && !usesGeneralistAttr(skill);
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

  // Coin re-derives from the gear card's category, like everything else —
  // re-pool a card and every sheet's purse updates on the next replay. The
  // label stays mute about the category: the seesaw is not shown to players.
  const gearCard = state.gear?.id ? GEAR.find((g) => g.id === state.gear!.id) : undefined;
  const startingCoin = gearCard
    ? sum([{ label: 'Starting coin', value: STARTING_COIN[gearCard.category] }])
    : undefined;

  return {
    level: levelFor(state.milestones, state.crystallized),
    attributes,
    hitPoints,
    speed,
    damageReduction,
    initiative,
    skills,
    skillGeneralists,
    languages,
    proficiencies,
    situational,
    ...(startingCoin ? { startingCoin } : {}),
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
