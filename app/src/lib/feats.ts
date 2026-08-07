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

import type { Effect } from './quirks';

/** What a Feat demands of the build before it may be taken. */
export type FeatRequirement =
  | { kind: 'proficiency'; group: string }
  | { kind: 'damage-type'; type: string }
  | { kind: 'malediction'; name: string }
  | { kind: 'skill-trained'; skill: string };

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

// ── Feat Ladders & Market access ────────────────────────────────────────────

const ladders: Feat[] = [
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
  ...ladders,
];

export function featById(id: string): Feat | undefined {
  return FEATS.find((f) => f.id === id);
}
