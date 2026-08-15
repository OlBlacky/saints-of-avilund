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

import { CRAFTS } from './equipment';
import type { Language } from './languages';
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
  | { kind: 'attribute-any'; attrs: Attribute[]; value: number }
  /** Knowing a Language ("Skills know, Languages read" — the magic Market
   * Feats gate on the tradition's tongue). */
  | { kind: 'language'; language: Language };

/** One Rank of a Feat Ladder. */
export interface FeatRank {
  value: string;
  cost: 'm' | 'M';
  /** Everything in force at this Rank, for the sheet — set when climbing
   * keeps earlier rungs alive or compounds them, so `value` alone would
   * understate the state. Falls back to `value`. */
  now?: string;
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
  /** What the Feat does for the character right now — the effect without
   * its gates. The sheet prints this. Falls back to `full`. */
  now?: string;
  /** Cost of a plain (non-Ladder) Feat. Ladder Ranks carry their own. */
  cost?: 'm' | 'M';
  /** Minimum Level (all Specializations open at Level 2). */
  levelGate?: number;
  requires?: FeatRequirement;
  /** A purchase-time choice (an element, a tradition). */
  choice?: { key: string; label: string; options: string[] };
  /** A location-gated Feat appears only for characters whose Place of
   * Origin is listed (Regional Market Feats — mechanics/markets.md).
   * Values match lib/places.ts exactly, and the replay enforces it against
   * the recorded Place of Origin. */
  originGate?: string[];
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

/** A plain Feat's texts from one source: the sheet prints the effect alone,
 * the full text (effect + gates) is the tooltip and the printed appendix. */
const gated = (effect: string, gates?: string) => ({
  now: effect,
  full: gates ? `${effect} ${gates}` : effect,
});

const weaponSpecs: Feat[] = WEAPON_SPEC_GROUPS.map((group) => ({
  id: `spec-${slug(group)}`,
  name: `Specialization — ${group}`,
  brief: `Unlocks the ${group} hooks on your Ability cards.`,
  ...gated(
    `While wielding a ${group} weapon, the Weapon Specialization Hooks marked for ${group} on your Ability cards are unlocked.`,
    `Opens at Level ${SPEC_LEVEL}. Requires proficiency with ${group}.`,
  ),
  cost: 'm' as const,
  levelGate: SPEC_LEVEL,
  requires: { kind: 'proficiency' as const, group },
}));

const implementSpecs: Feat[] = [
  {
    id: 'spec-scroll',
    name: 'Specialization — Scrolls',
    brief: 'A chance to keep the scroll, and its second boost set.',
    ...gated(
      'When you cast from a scroll, roll a d20: on 11 or higher the scroll is not consumed. The second generic-boost set on scroll casting is unlocked.',
      `Opens at Level ${SPEC_LEVEL}. Requires proficiency with Scrolls.`,
    ),
    cost: 'm',
    levelGate: SPEC_LEVEL,
    requires: { kind: 'proficiency', group: 'Scrolls' },
  },
  {
    id: 'spec-spellbook',
    name: 'Specialization — Spellbooks',
    brief: 'Your Int joins a damaging spell cast from the book.',
    ...gated(
      'Add your Int to the damage of a damaging spell cast from a spellbook. The second generic-boost set on spellbook casting is unlocked.',
      `Opens at Level ${SPEC_LEVEL}. Requires proficiency with Spellbooks.`,
    ),
    cost: 'm',
    levelGate: SPEC_LEVEL,
    requires: { kind: 'proficiency', group: 'Spellbooks' },
  },
  {
    id: 'spec-ritual',
    name: 'Specialization — Rituals',
    brief: '+1 to every roll a ritual asks of you.',
    ...gated(
      '+1 to any d20 roll a ritual calls for, and the second boost set on Conduct Ritual is unlocked.',
      `Opens at Level ${SPEC_LEVEL}. Requires being Trained in Rituals.`,
    ),
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
  ...gated(
    `Your ${type}-dealing Abilities unlock the type's signature effect — ${signature} — as marked on their cards.`,
    `Opens at Level ${SPEC_LEVEL}. Requires an Ability that deals ${type} damage.`,
  ),
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
  ...gated(
    `+1 to hit when you curse with ${name}, and its standing Hook: ${hook}.`,
    `Opens at Level ${SPEC_LEVEL}. Requires a curse built with ${name}.`,
  ),
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
  // Craft is an open speciality Skill: the Specialization anchors to one
  // trade from the common roster (the requirement checks that exact trade).
  ...(s.name === 'Craft'
    ? { choice: { key: 'speciality', label: 'Craft', options: [...CRAFTS, 'Poison'] } }
    : {}),
  ladder: [
    { value: 'Take 10', cost: 'm' as const },
    { value: 'Rolled values ×1.5', cost: 'm' as const, now: 'Take 10 · rolled values ×1.5' },
    { value: 'Rolled values ×2', cost: 'm' as const, now: 'Take 10 · rolled values ×2' },
    { value: 'Reroll 1/day', cost: 'M' as const, now: 'Take 10 · rolled values ×2 · Reroll 1/day' },
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
      { value: 'Reroll 1/day', cost: 'M' as const, now: 'Take 15 (takes longer) · Reroll 1/day' },
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
      { value: 'Reroll 1/encounter', cost: 'M' as const, now: `Reroll ${short} Saves 1/encounter` },
      {
        value: `DR 1 vs ${short} Defences`,
        cost: 'M' as const,
        now: `Reroll ${short} Saves 1/encounter · DR 1 vs ${short} Defences`,
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
    ...gated(
      `You count as Trained in every ${attr} Skill you are not Trained in.`,
      `Requires ${attr} +1.`,
    ),
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
    { value: 'Languages equal to Int, Wis or Cha', cost: 'm', now: 'Bonus languages equal to the best of Int, Wis, Cha' },
    { value: '+2 more languages', cost: 'm', now: 'Bonus languages: the best of Int, Wis, Cha, +2' },
    { value: 'Another +2', cost: 'm', now: 'Bonus languages: the best of Int, Wis, Cha, +4' },
    {
      value: 'Linguist',
      cost: 'M',
      now: 'Bonus languages: the best of Int, Wis, Cha, +4 · Linguist: you understand the basic verbs and nouns of nearly any language, at −1 to related Skill checks',
    },
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
    now: 'Grants the Second Wind Ability card.',
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
      { value: '+2 max HP', cost: 'm', now: '+3 max HP', effects: [{ kind: 'maxHpMod', value: 2 }] },
      { value: '+3 max HP', cost: 'm', now: '+6 max HP', effects: [{ kind: 'maxHpMod', value: 3 }] },
      { value: 'DR 1', cost: 'M', now: '+6 max HP · DR 1', effects: [{ kind: 'drMod', value: 1 }] },
    ],
  },
  {
    id: 'evasion',
    name: 'Evasion',
    brief: 'When a physical Save halves damage, you take less still.',
    full: 'When you succeed on a Strength, Dexterity, or Constitution Save that results in half damage, reduce the damage you take by a further 1, then 2, then 3. The final Rank reduces it to no damage. One Rank per Level.',
    ladder: [
      { value: 'Half damage −1', cost: 'm', now: 'A passed Str, Dex or Con Save for half damage: take 1 less' },
      { value: 'Half damage −2', cost: 'm', now: 'A passed Str, Dex or Con Save for half damage: take 2 less' },
      { value: 'Half damage −3', cost: 'm', now: 'A passed Str, Dex or Con Save for half damage: take 3 less' },
      { value: 'No damage', cost: 'M', now: 'A passed Str, Dex or Con Save for half damage: take none' },
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
      { value: 'Cannot be Surprised', cost: 'M', now: '+4 Initiative · cannot be Surprised' },
    ],
  },
  {
    id: 'resolution',
    name: 'Resolution',
    brief: 'When a mental Save halves damage, you take less still.',
    full: 'When you succeed on an Intelligence, Wisdom, or Charisma Save that results in half damage, reduce the damage you take by a further 1, then 2, then 3. The final Rank reduces it to no damage. One Rank per Level.',
    ladder: [
      { value: 'Half damage −1', cost: 'm', now: 'A passed Int, Wis or Cha Save for half damage: take 1 less' },
      { value: 'Half damage −2', cost: 'm', now: 'A passed Int, Wis or Cha Save for half damage: take 2 less' },
      { value: 'Half damage −3', cost: 'm', now: 'A passed Int, Wis or Cha Save for half damage: take 3 less' },
      { value: 'No damage', cost: 'M', now: 'A passed Int, Wis or Cha Save for half damage: take none' },
    ],
  },
  {
    id: 'encumbrance-ladder',
    name: 'Strongback',
    brief: 'Carry more; at its height, Heavy Loads count as Light.',
    full: 'Add to your Base Load: +15 lb, then +30 lb. The final Rank makes Heavy Loads count as Light Loads. One Rank per Level.',
    ladder: [
      { value: '+15 lb to your Base Load', cost: 'm' },
      { value: '+30 lb to your Base Load', cost: 'm' },
      { value: 'Heavy Loads count as Light Loads', cost: 'M', now: '+30 lb to your Base Load · Heavy Loads count as Light Loads' },
    ],
  },
  {
    id: 'commerce-ladder',
    name: 'Chaffer',
    brief: 'Buy cheaper; at its height, sell dearer too.',
    full: 'Purchase items for 10% less, then 20% less. The final Rank also sells items for 10% more. One Rank per Level. The percentages apply at every Market you can reach.',
    ladder: [
      { value: 'Purchase items for 10% less', cost: 'm' },
      { value: 'Purchase items for 20% less', cost: 'm' },
      { value: 'And sell items for 10% more', cost: 'M', now: 'Purchase items for 20% less · sell items for 10% more' },
    ],
  },
  // ── Market Access Feats ─────────────────────────────────────────────────
  // One per locked Market (mechanics/markets.md). Names are working names —
  // each locked shopfront shows the Feat that opens it. The last two are
  // Regional Market Feats: location-gated by Place of Origin.
  {
    id: 'market-anselms-buttery',
    name: "Anselm's Buttery",
    brief: 'The Buttery at Lord\'s University will serve you.',
    ...gated(
      "You gain access to Anselm's Buttery — Lord's University — New Magic Market.",
      'Requires the Arcane Tongue.',
    ),
    cost: 'm',
    requires: { kind: 'language', language: 'Arcane Tongue' },
  },
  {
    id: 'market-ignatius-archive',
    name: 'St. Ignatius College Archive',
    brief: 'The Archive on Elder Isle opens its stores to you.',
    ...gated(
      'You gain access to the St. Ignatius College Archive — Elder Isle — Elder Magic Market.',
      'Requires the Elder Arcana Tongue.',
    ),
    cost: 'm',
    requires: { kind: 'language', language: 'Elder Arcana Tongue' },
  },
  {
    id: 'market-theobalds-row',
    name: "Theobald's Row",
    brief: "The dealers of Theobald's Row know your face.",
    ...gated(
      "You gain access to Theobald's Row — Sebald's Isle — Occult Market.",
      'Requires the Black Tongue.',
    ),
    cost: 'm',
    requires: { kind: 'language', language: 'Black Tongue' },
  },
  {
    id: 'market-astronomers',
    name: 'Society of Astronomers',
    brief: 'The Society on Newton Hill admits you.',
    ...gated(
      'You gain access to the Society of Astronomers — Newton Hill — Market of the Outside.',
      'Requires the Eldritch Tongue.',
    ),
    cost: 'm',
    requires: { kind: 'language', language: 'Eldritch Tongue' },
  },
  {
    id: 'market-green',
    name: 'The Green Market',
    brief: 'The stalls at the edge of The Green will trade with you.',
    ...gated(
      'You gain access to The Green Market — The Green — Old Magic Market.',
      'Requires the First Tongue.',
    ),
    cost: 'm',
    requires: { kind: 'language', language: 'First Tongue' },
  },
  {
    id: 'market-blacks-road',
    name: "Black's Road Market",
    brief: "Black's Road does business with you.",
    full: "You gain access to the Black's Road Market — Black's Road — Black Market.",
    cost: 'm',
  },
  {
    id: 'market-dunstans-magazine',
    name: "St. Dunstan's Magazine",
    brief: 'The Abbey of the Artillery sells to you from its own magazine.',
    ...gated(
      "You gain access to St. Dunstan's Magazine — Abbey of the Artillery, Lysander — Firearms Market.",
      'Open to natives of Lysander and residents of the Bishopric of St. Dunstan.',
    ),
    cost: 'm',
    originGate: ['Lysander', 'the Bishopric of St. Dunstan'],
  },
  {
    id: 'market-ulrics-exchange',
    name: "St. Ulric's Exchange",
    brief: 'The merchant-houses of Havilah admit you to the Exchange.',
    ...gated(
      "You gain access to St. Ulric's Exchange — Freehold of Havilah — Trade Market.",
      'Open to natives and residents of the Freehold of Havilah.',
    ),
    cost: 'm',
    originGate: ['Havilah'],
  },
  {
    id: 'market-long-butts',
    name: 'The Long Butts',
    brief: 'The bowyers and fletchers of Bynithbrack sell to you.',
    ...gated(
      'You gain access to The Long Butts — Bynithbrack Water — Masterwork Bows Market.',
      'Open to natives and residents of Dunstanmoore.',
    ),
    cost: 'm',
    originGate: ['Dunstanmoore'],
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

/** The arithmetic half of a Hook — what it adds to the attack, the damage, or
 * the reach of the weapon it is read on. */
export interface HookMath {
  toHit?: number;
  /** A flat number added to damage. */
  damage?: number;
  /** An attribute added to damage; the sheet holds its value. */
  damageAttr?: string;
  /** Feet added to the Ability's reach. */
  reach?: number;
}

/** One Hook a card lists for a proficiency group, split at the arrow:
 * "Heavy Blades → +2 damage". */
export interface UnlockedHook {
  group: string;
  /** The Hook as authored, both halves of it. */
  effect: string;
  /** The arithmetic, when the Hook opens with an unconditional bonus. */
  math?: HookMath;
  /** What the Hook does beyond the arithmetic ("Push 5'"), when it does. */
  rest?: string;
}

// A Hook names its groups on the left of the arrow in the card's shorthand —
// "Hammers" for Hammers/Maces, "Bows / Crossbows" for both — so the names are
// compared bare: split on the slash, lowercased, and singular.
const hookTokens = (s: string): string[] =>
  s
    .split('/')
    .map((t) => t.trim().toLowerCase().replace(/s$/, ''))
    .filter(Boolean);

/** Whether a Hook written for `hookGroup` is the Proficiency group `profGroup`
 * — the card's shorthand against the roster's full name. */
export function hookMatchesGroup(hookGroup: string, profGroup: string): boolean {
  const held = hookTokens(profGroup);
  return hookTokens(hookGroup).some((g) => held.some((h) => h === g || h.endsWith(` ${g}`)));
}

// The Hook vocabulary that resolves to arithmetic. Everything else a Hook can
// say — Push, Bleed, ignore the target's shield — is prose the player applies,
// and the sheet prints it instead.
const HOOK_MATH: { re: RegExp; read: (m: RegExpMatchArray) => HookMath }[] = [
  { re: /^\+(\d+) damage\b/, read: (m) => ({ damage: Number(m[1]) }) },
  { re: /^\+(Str|Dex|Con|Int|Wis|Cha) damage\b/, read: (m) => ({ damageAttr: m[1] }) },
  { re: /^\+(\d+) to hit\b/, read: (m) => ({ toHit: Number(m[1]) }) },
  { re: /^\+(\d+) to the [^,.]*?attack roll\b/, read: (m) => ({ toHit: Number(m[1]) }) },
  { re: /^\+(\d+)['′] reach\b/, read: (m) => ({ reach: Number(m[1]) }) },
];

/** The arithmetic a Hook opens with, and whatever it says after that. A bonus
 * counts only when nothing qualifies it: "+2 damage" and "+2 damage and Push
 * 5'" are the row's to keep, while "+2 damage within the first increment" is a
 * condition the sheet cannot judge, so it stays prose. */
export function hookMath(effect: string): { math?: HookMath; rest?: string } {
  for (const { re, read } of HOOK_MATH) {
    const m = effect.match(re);
    if (!m) continue;
    const after = effect.slice(m[0].length);
    if (after === '') return { math: read(m) };
    const also = after.match(/^(?:,\s+and|,| and)\s+(.+)$/);
    if (!also) return {};
    return { math: read(m), rest: also[1][0].toUpperCase() + also[1].slice(1) };
  }
  return {};
}

/** The Specialization Hooks an owned Feat unlocks on an Ability card. A card
 * lists every group's Hook for reference; only the groups the character holds
 * the Specialization Feat for are in force, and those are what the sheet
 * prints. */
export function unlockedHooks(
  options: { label: string; detail?: string | string[] }[] | undefined,
  ownedFeatIds: string[],
): UnlockedHook[] {
  const owned = ownedFeatIds
    .map(featById)
    .flatMap((f) => (f?.requires?.kind === 'proficiency' ? hookTokens(f.requires.group) : []));
  if (owned.length === 0) return [];
  const hooks: UnlockedHook[] = [];
  for (const o of options ?? []) {
    if (!/\bHooks\b/.test(o.label)) continue;
    const lines = Array.isArray(o.detail) ? o.detail : o.detail ? [o.detail] : [];
    for (const line of lines) {
      const m = line.match(/^(.+?)\s*→\s*(.+)$/);
      if (!m) continue;
      const listed = hookTokens(m[1]);
      // A Feat's group may be the wider name ("Light Shield" for a card's
      // "Shields"), so a listed name also matches as the tail of one.
      const held = listed.some((g) => owned.some((o2) => o2 === g || o2.endsWith(` ${g}`)));
      const effect = m[2].trim();
      if (held) hooks.push({ group: m[1].trim(), effect, ...hookMath(effect) });
    }
  }
  return hooks;
}

export function specializationFor(ownedFeatIds: string[], choice: string): Feat | undefined {
  return ownedFeatIds
    .map(featById)
    .find((f): f is Feat => {
      const r = f?.requires;
      if (!r) return false;
      if (r.kind === 'malediction') return r.name === choice;
      if (r.kind === 'damage-type') return r.type === choice;
      return false;
    });
}
