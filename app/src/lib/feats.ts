// The Feats pillar as typed rules data (builder spec §9, Layer A): stable
// ids, brief + full texts (§8 — the brief rides beside the name, the full is
// the tooltip and the printed appendix), costs, Level gates, requirements,
// and machine effects in the shared vocabulary.
//
// Availability is the can-use rule (Les, Aug 2026): a Specialization may be
// taken for something the build can actually use — a weapon or implement
// group you are proficient with, a damage type an owned Ability can deal, a
// Malediction one of your curses carries. The record engine checks it from
// state; there are no per-Class feat tables.

import type { Attribute, Effect } from './quirks';
import { SKILLS } from './skills';

/** What a Feat demands of the build before it may be taken. */
export type FeatRequirement =
  | { kind: 'proficiency'; group: string }
  | { kind: 'damage-type'; type: string }
  | { kind: 'malediction'; name: string }
  | { kind: 'skill-trained'; skill: string }
  | { kind: 'skill-rank'; skill: string; rank: number }
  | { kind: 'attribute'; attr: Attribute; value: number }
  /** The Save total after all modification (Attribute + Defence Ranks + steady bonuses). */
  | { kind: 'save-total'; attr: Attribute; value: number }
  /** Any one of the listed Attributes at the value. */
  | { kind: 'attribute-any'; attrs: Attribute[]; value: number };

/** One Rank of a Feat Ladder. */
export interface FeatRank {
  value: string;
  cost: 'm' | 'M';
  effects?: Effect[];
}

export interface Feat {
  /** Permanent stable id — never changes once published. */
  id: string;
  name: string;
  /** The one-line meta text shown beside the name. */
  brief: string;
  /** The full rules text — tooltip on screen, appendix in print. */
  full: string;
  /** Cost of a plain (non-Ladder) Feat. Ladder Ranks carry their own. */
  cost?: 'm' | 'M';
  /** Minimum Level (all Specializations open at Level 2). */
  levelGate?: number;
  requires?: FeatRequirement;
  /** A purchase-time choice (the Spell Market's tradition). */
  choice?: { key: string; label: string; options: string[] };
  /** Feat Ladder Ranks, climbed in order, one Rank per Level. */
  ladder?: FeatRank[];
  /** Machine effects while owned (plain Feats). */
  effects?: Effect[];
  /** Taking the Feat grants this Ability card, which then advances through
   * the ordinary Ability machinery (one Minor + one Major per Level). */
  grantsAbility?: { category: string; ability: string };
}

const SPEC_LEVEL = 2;

// ── Weapon & implement Specializations ──────────────────────────────────────

const WEAPON_SPEC_GROUPS = [
  'Axes', 'Heavy Blades', 'Light Blades', 'Hammers/Maces', 'Picks',
  'Flails/Chains', 'Polearms', 'Spears/Lances', 'Unarmed/Natural', 'Staves',
  'Bows', 'Crossbows', 'Slings', 'Thrown', 'Pistols', 'Rifles', 'Grenades',
];

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const weaponSpecs: Feat[] = WEAPON_SPEC_GROUPS.map((group) => ({
  id: `spec-${slug(group)}`,
  name: `Specialization — ${group}`,
  brief: `Unlocks the ${group} hooks on your Ability cards.`,
  full: `While wielding a ${group} weapon, the Weapon Specialization Hooks marked for ${group} on your Ability cards are unlocked. Opens at Level ${SPEC_LEVEL}. Requires proficiency with ${group}.`,
  cost: 'm' as const,
  levelGate: SPEC_LEVEL,
  requires: { kind: 'proficiency' as const, group },
}));

const implementSpecs: Feat[] = [
  {
    id: 'spec-scroll',
    name: 'Specialization — Scrolls',
    brief: 'A chance to keep the scroll, and its second boost set.',
    full: `When you cast from a scroll, roll a d20: on 11 or higher the scroll is not consumed. The second generic-boost set on scroll casting is unlocked. Opens at Level ${SPEC_LEVEL}. Requires proficiency with Scrolls.`,
    cost: 'm',
    levelGate: SPEC_LEVEL,
    requires: { kind: 'proficiency', group: 'Scrolls' },
  },
  {
    id: 'spec-spellbook',
    name: 'Specialization — Spellbooks',
    brief: 'Your Int joins a damaging spell cast from the book.',
    full: `Add your Int to the damage of a damaging spell cast from a spellbook. The second generic-boost set on spellbook casting is unlocked. Opens at Level ${SPEC_LEVEL}. Requires proficiency with Spellbooks.`,
    cost: 'm',
    levelGate: SPEC_LEVEL,
    requires: { kind: 'proficiency', group: 'Spellbooks' },
  },
  {
    id: 'spec-ritual',
    name: 'Specialization — Rituals',
    brief: '+1 to every roll a ritual asks of you.',
    full: `+1 to any d20 roll a ritual calls for, and the second boost set on Conduct Ritual is unlocked. Opens at Level ${SPEC_LEVEL}. Requires being Trained in Rituals.`,
    cost: 'm',
    levelGate: SPEC_LEVEL,
    requires: { kind: 'skill-trained', skill: 'Rituals' },
    effects: [{ kind: 'skillMod', value: 1, skill: 'Rituals' }],
  },
];

// ── Damage-type Specializations ─────────────────────────────────────────────

const DAMAGE_SPECS: { type: string; signature: string }[] = [
  { type: 'Fire', signature: 'Ongoing Damage, with Pierce at range and Retaliation up close' },
  { type: 'Acid', signature: 'Ongoing Damage, with Splash and Lingering on areas' },
  { type: 'Cold', signature: 'Movement effects (Slow into Immobilize), with Glancing' },
  { type: 'Lightning', signature: 'Action denial (Daze into Stun), with Pierce and Retaliation' },
  { type: 'Sonic', signature: 'Action denial (Daze into Stun), with Splash and Lingering' },
  { type: 'Force', signature: 'Push (and Prone), with Glancing' },
  { type: 'Radiant', signature: 'a Radiant damage Ladder' },
  { type: 'Necrotic', signature: 'Necrotic damage and its withering effects' },
  { type: 'Psychic', signature: 'a wider crit range (19–20), and Fear' },
];

const damageSpecs: Feat[] = DAMAGE_SPECS.map(({ type, signature }) => ({
  id: `spec-${slug(type)}`,
  name: `Specialization — ${type}`,
  brief: `Unlocks ${type}'s signature effect on your cards.`,
  full: `Your ${type}-dealing Abilities unlock the type's signature effect — ${signature} — as marked on their cards. Opens at Level ${SPEC_LEVEL}. Requires an Ability that deals ${type} damage.`,
  cost: 'm' as const,
  levelGate: SPEC_LEVEL,
  requires: { kind: 'damage-type' as const, type },
}));

// ── Malediction Specializations ─────────────────────────────────────────────

const MALEDICTION_SPECS: { name: string; hook: string }[] = [
  { name: 'Wasting', hook: '+1 to all Necrotic damage you deal' },
  { name: 'Ill Luck', hook: 'the cursed target may not use Rerolls' },
  { name: 'Palsy', hook: 'a Palsied target also cannot take Reactions or Opportunity Attacks' },
  { name: 'Stupor', hook: 'a Stupored target takes −2 to its Save against the curse' },
  { name: 'Enfeeblement', hook: 'the target cannot gain Temp HP while cursed' },
  { name: 'Dread', hook: 'enemies within 10′ of the cursed target take −1 to their attacks (Fear)' },
];

const maledictionSpecs: Feat[] = MALEDICTION_SPECS.map(({ name, hook }) => ({
  id: `spec-${slug(name)}`,
  name: `Specialization — ${name}`,
  brief: `+1 to hit when cursing with ${name}, and its standing Hook.`,
  full: `+1 to hit when you curse with ${name}, and its standing Hook: ${hook}. Opens at Level ${SPEC_LEVEL}. Requires a curse built with ${name}.`,
  cost: 'm' as const,
  levelGate: SPEC_LEVEL,
  requires: { kind: 'malediction' as const, name },
  effects: [{ kind: 'attackMod' as const, value: 1, when: { note: `cursing with ${name}` } }],
}));

// ── Skill Specializations ───────────────────────────────────────────────────
// One per Skill, open once the Skill holds Rank +1 (Les, Aug 2026). The base
// purchase is the Ladder's first Rank.

const skillSpecs: Feat[] = SKILLS.map((s) => ({
  id: `skill-spec-${slug(s.name)}`,
  name: `Skill Specialization — ${s.name}`,
  brief: `Take 10 on ${s.name}; at the height, a daily Reroll.`,
  full: `Requires Rank +1 in ${s.name}. You may Take 10 on ${s.name} rolls. The later Ranks multiply numeric values derived from a ${s.name} roll — distance jumped, money earned — by 1.5, then 2. The final Rank grants one Reroll of a ${s.name} roll per day. One Rank per Level.`,
  requires: { kind: 'skill-rank' as const, skill: s.name, rank: 1 },
  ladder: [
    { value: 'Take 10', cost: 'm' as const },
    { value: 'Rolled values ×1.5', cost: 'm' as const },
    { value: 'Rolled values ×2', cost: 'm' as const },
    { value: 'Reroll 1/day', cost: 'M' as const },
  ],
}));

// ── Attribute Skills Specializations ────────────────────────────────────────
// One per Attribute, covering every Skill rolled with it. Opens at +2 in the
// Attribute (Les, Aug 2026). The base purchase is the Ladder's first Rank.

const ATTRIBUTE_LIST: Attribute[] = [
  'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
];

const attrSkillSpecs: Feat[] = ATTRIBUTE_LIST.map((attr) => {
  const short = attr.slice(0, 3);
  return {
    id: `attr-skills-spec-${short.toLowerCase()}`,
    name: `${short} Skills Specialization`,
    brief: `Take 10 on ${attr} Skill rolls; at the height, a daily Reroll.`,
    full: `Requires ${attr} +2. You may Take 10 on Skill rolls made with ${attr}. The later Ranks raise it to Take 12, then Take 15. A Take 15 check takes twice as long, or one Action-Step more: a Move becomes a Standard, a Standard becomes a Full Round. The final Rank grants one Reroll per day on a ${attr} Skill roll. One Rank per Level.`,
    requires: { kind: 'attribute' as const, attr, value: 2 },
    ladder: [
      { value: 'Take 10', cost: 'm' as const },
      { value: 'Take 12', cost: 'm' as const },
      { value: 'Take 15 (takes longer)', cost: 'm' as const },
      { value: 'Reroll 1/day', cost: 'M' as const },
    ],
  };
});

// ── Defensive Specializations ───────────────────────────────────────────────
// One per Attribute: the Save Reroll economy, opening once the whole build —
// Attribute, Defence Ranks, steady bonuses — carries that Save to +3
// (Les, Aug 2026). The base purchase is the Ladder's first Rank.

const defensiveSpecs: Feat[] = ATTRIBUTE_LIST.map((attr) => {
  const short = attr.slice(0, 3);
  return {
    id: `defensive-spec-${short.toLowerCase()}`,
    name: `${short} Defensive Specialization`,
    brief: `Reroll ${short} Saves; at the height, DR 1 on that front.`,
    full: `Requires a ${attr} Save total of +3, after all modification. You gain one Reroll per day on ${attr} Saves. The second Rank makes it one Reroll per encounter. The final Rank adds DR 1 against attacks that target your ${attr} Defences. One Rank per Level.`,
    requires: { kind: 'save-total' as const, attr, value: 3 },
    ladder: [
      { value: `Reroll ${short} Saves 1/day`, cost: 'm' as const },
      { value: 'Reroll 1/encounter', cost: 'M' as const },
      {
        value: `DR 1 vs ${short} Defences`,
        cost: 'M' as const,
        effects: [{
          kind: 'drMod' as const,
          value: 1,
          when: { note: `vs attacks targeting your ${attr} Defences` },
        }],
      },
    ],
  };
});

// ── Attribute Skill Generalists ─────────────────────────────────────────────
// One per Attribute: count as Trained in every Skill rolled with it. Opens at
// +1 in the Attribute (Les, Aug 2026 — the Bardic Knowledge replacement).

const skillGeneralists: Feat[] = ATTRIBUTE_LIST.map((attr) => {
  const short = attr.slice(0, 3);
  return {
    id: `skill-generalist-${short.toLowerCase()}`,
    name: `${short} Skill Generalist`,
    brief: `Trained in every ${attr} Skill you are not Trained in.`,
    full: `Requires ${attr} +1. You count as Trained in every ${attr} Skill you are not Trained in.`,
    cost: 'm' as const,
    requires: { kind: 'attribute' as const, attr, value: 1 },
    effects: [{ kind: 'grantTrainedByAttr' as const, attr }],
  };
});

const polyglot: Feat = {
  id: 'polyglot',
  name: 'Polyglot',
  brief: 'Tongues come easily; at the height, none is wholly foreign.',
  full: 'Requires +2 in Intelligence, Wisdom, or Charisma. You know additional languages equal to the best of your Intelligence, Wisdom, and Charisma. The later Ranks add 2 more languages, then another 2. The final Rank makes you a Linguist: you can understand the basic verbs and nouns of just about any language you do not know, at −1 to any related Skill check for that language. One Rank per Level.',
  requires: {
    kind: 'attribute-any',
    attrs: ['Intelligence', 'Wisdom', 'Charisma'],
    value: 2,
  },
  ladder: [
    { value: 'Languages equal to Int, Wis or Cha', cost: 'm' },
    { value: '+2 more languages', cost: 'm' },
    { value: 'Another +2', cost: 'm' },
    { value: 'Linguist', cost: 'M' },
  ],
};

// A placeholder: the slot is reserved, the rules are not yet designed
// (Les, Aug 2026). Replace the [[text here]] cues when they are.
const craftingSpec: Feat = {
  id: 'crafting-specialization',
  name: 'Crafting Specialization',
  brief: '[[text here]]',
  full: '[[text here — rules not yet designed]]',
  cost: 'm',
};

// ── Feat Ladders & Market access ────────────────────────────────────────────

const ladders: Feat[] = [
  {
    id: 'second-wind',
    name: 'Second Wind',
    brief: 'Catch your breath: a guard of Temp HP, or true healing.',
    full: 'Grants the Second Wind Ability: Daily, as a Move Action, gain 2 Temp HP or heal 2 HP. The card advances like any Ability.',
    cost: 'm',
    grantsAbility: { category: 'General', ability: 'Second Wind' },
  },
  {
    id: 'toughness',
    name: 'Toughness',
    brief: 'Hardier by degrees; at its height, a layer of DR.',
    full: 'Each Rank raises your maximum HP: +1, then +2, then +3. The final Rank grants DR 1. One Rank per Level.',
    ladder: [
      { value: '+1 max HP', cost: 'm', effects: [{ kind: 'maxHpMod', value: 1 }] },
      { value: '+2 max HP', cost: 'm', effects: [{ kind: 'maxHpMod', value: 2 }] },
      { value: '+3 max HP', cost: 'm', effects: [{ kind: 'maxHpMod', value: 3 }] },
      { value: 'DR 1', cost: 'M', effects: [{ kind: 'drMod', value: 1 }] },
    ],
  },
  {
    id: 'evasion',
    name: 'Evasion',
    brief: 'When a physical Save halves damage, you take less still.',
    full: 'When you succeed on a Strength, Dexterity, or Constitution Save that results in half damage, reduce the damage you take by a further 1, then 2, then 3. The final Rank reduces it to no damage. One Rank per Level.',
    ladder: [
      { value: 'Half damage −1', cost: 'm' },
      { value: 'Half damage −2', cost: 'm' },
      { value: 'Half damage −3', cost: 'm' },
      { value: 'No damage', cost: 'M' },
    ],
  },
  {
    id: 'danger-sense',
    name: 'Danger Sense',
    brief: 'Quicker to the fray; at its height, never surprised.',
    full: 'Add to your Initiative: +2, then +3, then +4. The final Rank means you cannot be Surprised. One Rank per Level.',
    ladder: [
      // Effects stack Rank by Rank, so each grants the increment.
      { value: '+2 Initiative', cost: 'm', effects: [{ kind: 'initiativeMod', value: 2 }] },
      { value: '+3 Initiative', cost: 'm', effects: [{ kind: 'initiativeMod', value: 1 }] },
      { value: '+4 Initiative', cost: 'm', effects: [{ kind: 'initiativeMod', value: 1 }] },
      { value: 'Cannot be Surprised', cost: 'M' },
    ],
  },
  {
    id: 'resolution',
    name: 'Resolution',
    brief: 'When a mental Save halves damage, you take less still.',
    full: 'When you succeed on an Intelligence, Wisdom, or Charisma Save that results in half damage, reduce the damage you take by a further 1, then 2, then 3. The final Rank reduces it to no damage. One Rank per Level.',
    ladder: [
      { value: 'Half damage −1', cost: 'm' },
      { value: 'Half damage −2', cost: 'm' },
      { value: 'Half damage −3', cost: 'm' },
      { value: 'No damage', cost: 'M' },
    ],
  },
  {
    // Working name from mechanics/encumbrance.md; Les renames at will —
    // the id never changes.
    id: 'encumbrance-ladder',
    name: 'Encumbrance Feat Ladder',
    brief: 'Carry like a stronger man; at its height, Heavy Loads count as Light.',
    full: 'Count your Str as greater for the purposes of Encumbrance: +1, then +2. The final Rank makes Heavy Loads count as Light Loads. One Rank per Level.',
    ladder: [
      { value: 'Count your Str as +1 greater for Encumbrance', cost: 'm' },
      { value: 'Count your Str as +2 greater for Encumbrance', cost: 'm' },
      { value: 'Heavy Loads count as Light Loads', cost: 'M' },
    ],
  },
  {
    id: 'commerce-ladder',
    name: 'Commerce Feat Ladder',
    brief: 'Buy cheaper; at its height, sell dearer too.',
    full: 'Purchase items for 10% less, then 20% less. The final Rank also sells items for 10% more. One Rank per Level. The percentages apply at every Market you can reach.',
    ladder: [
      { value: 'Purchase items for 10% less', cost: 'm' },
      { value: 'Purchase items for 20% less', cost: 'm' },
      { value: 'And sell items for 10% more', cost: 'M' },
    ],
  },
  {
    id: 'market-spell',
    name: 'Default Spell Market',
    brief: 'The local guild or university will deal with you.',
    full: 'You gain access to the local guild or university of your chosen tradition. Opens the Default Spell Market for that tradition.',
    cost: 'm',
    choice: {
      key: 'tradition',
      label: 'Tradition',
      options: ['New Magic', 'Elder Magic', 'Old Magic', 'Witchcraft', 'The Outside'],
    },
  },
  {
    id: 'market-black',
    name: 'Default Black Market',
    brief: 'The surface of the local Black Market knows your face.',
    full: 'You gain access to the surface level of the local Black Market. Opens the Default Black Market.',
    cost: 'm',
  },
];

export const FEATS: Feat[] = [
  ...weaponSpecs,
  ...implementSpecs,
  ...damageSpecs,
  ...maledictionSpecs,
  ...skillSpecs,
  ...attrSkillSpecs,
  ...skillGeneralists,
  ...defensiveSpecs,
  polyglot,
  craftingSpec,
  ...ladders,
];

export function featById(id: string): Feat | undefined {
  return FEATS.find((f) => f.id === id);
}
