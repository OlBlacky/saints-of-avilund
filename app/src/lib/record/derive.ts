// derive(state) → the sheet's numbers, every one as a breakdown
// (builder spec §9): derivation returns labeled components, never bare
// totals — show-the-work is the shape of the engine's output, not a
// display feature.
//
// This slice covers the numbers the rules data can already feed: attributes,
// Offences, Saves, Defences, HP, Level, skills, languages, proficiencies.
// Armour/gear contributions join when the gear pillar lands.

import { classById, DEFAULT_LANGUAGE } from '../classes';
import { ATTR_FULL, parseAttr } from '../notation';
import type { Attribute } from '../quirks';
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
  value: Breakdown;
}

export interface DerivedSheet {
  level: number;
  attributes: DerivedAttribute[];
  hitPoints: Breakdown;
  speed: Breakdown;
  /** Trained skills only — untrained roll bare attribute. */
  skills: DerivedSkill[];
  languages: string[];
  /** Proficiency group → advancement bonus (granted and bought). */
  proficiencies: { group: string; rank: number; advanceable: boolean }[];
}

export function derive(state: CharacterState): DerivedSheet {
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
      ]),
      unarmouredDefence: sum([
        { label: 'Base', value: 10 },
        ...base(attr),
        ...(def ? [{ label: 'Defence Ranks', value: def }] : []),
      ]),
      // Armour's Equipment Bonus joins when the gear pillar lands.
      armouredDefence: sum([
        { label: 'Base', value: 10 },
        ...base(attr),
        ...(def ? [{ label: 'Defence Ranks', value: def }] : []),
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
  // any off-list Skill made Trained with a Minor. Untrained use is −1.
  const ownClassSkills = classSkills(state);
  const trainedNames = [
    ...new Set([...ownClassSkills, ...state.trainedSkills, ...Object.keys(state.skillRanks)]),
  ];
  const skills: DerivedSkill[] = trainedNames.map((skill) => {
    const base = skill.replace(/\s*\(.*\)$/, '');
    const rank = state.skillRanks[skill] ?? 0;
    const def = SKILLS.find((s) => s.name === base);
    // A skill's governing attribute is the first listed ("Dex, Wis" → Dex).
    const short = parseAttr(def?.attrs.split(',')[0] ?? '');
    const attr: Attribute = short ? ATTR_FULL[short] : 'Wisdom';
    const attrTotal = attrValue(attr).total;
    return {
      skill,
      attr,
      isClassSkill: ownClassSkills.includes(base),
      value: sum([
        { label: attr, value: attrTotal },
        ...(rank ? [{ label: 'Ranks', value: rank }] : []),
      ]),
    };
  });

  const languages = [DEFAULT_LANGUAGE, ...collectGrantedLanguages(state), ...state.languages]
    .filter((l, i, xs) => xs.indexOf(l) === i);

  const granted = [...new Set(grantedProficiencies(state))];
  const proficiencies = [
    ...granted.map((group) => ({
      group,
      rank: state.proficiencyRanks[group] ?? 0,
      advanceable: true,
    })),
    ...state.boughtProficiencies.map((group) => ({ group, rank: 0, advanceable: false })),
  ];

  return {
    level: levelFor(state.milestones, state.crystallized),
    attributes,
    hitPoints,
    speed,
    skills,
    languages,
    proficiencies,
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
