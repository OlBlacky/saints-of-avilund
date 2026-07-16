// Quirks — the wild card of character creation, rolled at the last step.
//
// A quirk gives something and takes something away. Each is hand-authored, but
// its text carries {slots} that resolve at roll time against the setting's own
// data (the saint catalogue, the polities, the languages, the 17 weapon groups),
// so one card yields many setting-true results. See mechanics/characters/quirks.md
// for the design record and the authoring standard.
//
// The effect vocabulary here is shared with the Feat pillar: a Feat is a chosen
// conditional modifier, a quirk is a rolled one with a sting attached. Both emit
// Effects, so the character sheet can resolve them in one pass.

import { SAINTS } from './saints';

export type Attribute =
  | 'Strength' | 'Dexterity' | 'Constitution'
  | 'Intelligence' | 'Wisdom' | 'Charisma';

// The 17 Weapon Proficiency groups — see mechanics/weapons.md.
export type WeaponGroup =
  | 'Axes' | 'Heavy Blades' | 'Light Blades' | 'Hammers/Maces' | 'Picks'
  | 'Flails/Chains' | 'Polearms' | 'Spears/Lances' | 'Unarmed/Natural' | 'Staves'
  | 'Bows' | 'Crossbows' | 'Slings' | 'Thrown' | 'Pistols' | 'Rifles' | 'Grenades';

export type Language =
  | 'Imperial' | 'Auld Imperial' | 'Elder' | 'Elder Arcana'
  | 'Black Tongue' | 'Kellish' | 'Common Feral';

/** The circumstances under which an effect fires. An empty condition = always. */
export interface Condition {
  targetTag?: string;      // e.g. 'feral' — a quality of the foe
  proficiency?: string;    // a Weapon Proficiency group (may be a {slot})
  language?: string;       // only while speaking this tongue
  place?: string;          // only in this polity or region
  culture?: string;        // only with these people
  note?: string;           // free-text scope the sheet shows but cannot compute
}

export type Effect =
  | { kind: 'skillMod'; value: number; skill: string; when?: Condition }
  | { kind: 'saveMod'; value: number; attr: Attribute; when?: Condition }
  | { kind: 'defenceMod'; value: number; attr: Attribute; when?: Condition }
  | { kind: 'attackMod'; value: number; when: Condition } // condition REQUIRED
  | { kind: 'grantProficiency'; group: string }           // may be a {slot}
  | { kind: 'grantLanguage'; language: string }           // may be a {slot}
  | { kind: 'socialPenalty'; value: number; when: Condition };

/** Which table a {slot} draws from, and how the draw is narrowed. */
export interface SlotSpec {
  table: 'place' | 'saint' | 'language' | 'weapon';
  tag?: string; // e.g. 'centre', 'fundator', 'melee'
}

export interface Quirk {
  id: string;
  name: string;       // may carry {slots}
  mechanic: string;   // player-facing text of the give/take — may carry {slots}
  esoteric: string;   // the behavioural sting — may carry {slots}
  effects: Effect[];
  slots?: Record<string, SlotSpec>;
  tags?: string[];    // for weighting later (nautical, pious, urban…)
}

// ── The slot tables ──────────────────────────────────────────────
// Places draw from the twelve polities; tags follow the three blocs.

interface SlotEntry { value: string; tags: string[] }

export const PLACES: SlotEntry[] = [
  { value: 'the Bishopric of St. Dunstan', tags: ['south', 'ecclesiastic'] },
  { value: 'Lysander', tags: ['south', 'city'] },
  { value: 'the Bishopric of St. Severinius', tags: ['south', 'ecclesiastic'] },
  { value: 'the Bishopric of St. Mairin', tags: ['south', 'ecclesiastic'] },
  { value: 'Valdenwail', tags: ['south', 'ecclesiastic'] },
  { value: 'Waldheim', tags: ['centre', 'republic', 'city'] },
  { value: 'Dunstanmoore', tags: ['centre', 'republic', 'coastal'] },
  { value: 'Isenveld', tags: ['centre', 'republic', 'coastal'] },
  { value: 'Havilah', tags: ['centre', 'colony', 'coastal'] },
  { value: 'the Bishopric of St. Ignatius', tags: ['centre', 'ecclesiastic'] },
  { value: 'Patrilund', tags: ['north', 'feudal'] },
  { value: 'Mantlethorn', tags: ['north', 'feudal'] },
  { value: 'Heirgallad', tags: ['north', 'feudal'] },
];

export const LANGUAGES: SlotEntry[] = [
  { value: 'Imperial', tags: ['common'] },
  { value: 'Auld Imperial', tags: ['church', 'learned'] },
  { value: 'Elder', tags: ['learned'] },
  { value: 'Elder Arcana', tags: ['learned', 'arcane'] },
  { value: 'Kellish', tags: ['foreign'] },
  { value: 'Common Feral', tags: ['foreign'] },
];

export const WEAPONS: SlotEntry[] = [
  { value: 'Axes', tags: ['melee'] },
  { value: 'Heavy Blades', tags: ['melee'] },
  { value: 'Light Blades', tags: ['melee'] },
  { value: 'Hammers/Maces', tags: ['melee'] },
  { value: 'Picks', tags: ['melee'] },
  { value: 'Flails/Chains', tags: ['melee'] },
  { value: 'Polearms', tags: ['melee', 'martial'] },
  { value: 'Spears/Lances', tags: ['melee', 'martial'] },
  { value: 'Staves', tags: ['melee'] },
  { value: 'Bows', tags: ['ranged'] },
  { value: 'Crossbows', tags: ['ranged'] },
  { value: 'Slings', tags: ['ranged'] },
  { value: 'Thrown', tags: ['ranged'] },
];

// Saints come from the catalogue itself rather than a copied list, so the quirk
// engine can never drift from canon. Minores are excluded: a quirk should name a
// saint a player has heard of.
const SAINT_ENTRIES: SlotEntry[] = SAINTS
  .filter((s) => s.tier !== 'Minores')
  .map((s) => ({
    value: `St. ${s.name}`,
    tags: [s.tier.toLowerCase(), ...(s.fundator ? ['fundator'] : [])],
  }));

function table(name: SlotSpec['table']): SlotEntry[] {
  switch (name) {
    case 'place': return PLACES;
    case 'language': return LANGUAGES;
    case 'weapon': return WEAPONS;
    case 'saint': return SAINT_ENTRIES;
  }
}

// ── The corpus ───────────────────────────────────────────────────
// Every effect names a real handle: a skill from lib/skills.ts, one of the six
// attributes, one of the 17 weapon groups. Nothing here invents a stat.

export const QUIRKS: Quirk[] = [
  {
    id: 'veteran-of-the-ferals-war',
    name: 'Veteran of the Ferals War',
    mechanic: '+1 to hit against Ferals with {weapon}.',
    esoteric:
      'You cannot sleep indoors on your first night in any new settlement; you will make some excuse and take the yard.',
    slots: { weapon: { table: 'weapon', tag: 'martial' } },
    effects: [{ kind: 'attackMod', value: 1, when: { targetTag: 'feral', proficiency: '{weapon}' } }],
    tags: ['martial', 'veteran'],
  },
  {
    id: 'salt-blooded',
    name: 'Salt-Blooded',
    mechanic: '−1 to Athletics when swimming.',
    esoteric:
      'You will not eat fish caught within sight of {place}, and you will say why at the table, at length.',
    slots: { place: { table: 'place', tag: 'coastal' } },
    effects: [{ kind: 'skillMod', value: -1, skill: 'Athletics', when: { note: 'swimming' } }],
    tags: ['nautical'],
  },
  {
    id: 'gutter-auld',
    name: 'Gutter Auld',
    mechanic: 'You speak Auld Imperial — but −1 to Diplomacy whenever you use it.',
    esoteric: 'Every cleric who hears you knows exactly which parish raised you.',
    effects: [
      { kind: 'grantLanguage', language: 'Auld Imperial' },
      { kind: 'socialPenalty', value: -1, when: { language: 'Auld Imperial' } },
    ],
    tags: ['pious', 'lowborn'],
  },
  {
    id: 'left-the-order-at-compline',
    name: 'Left the Order at Compline',
    mechanic: '+1 to your Wisdom Defence.',
    esoteric:
      'No friar of {saint} will take a meal at your table, though none will ever say the reason aloud.',
    slots: { saint: { table: 'saint' } },
    effects: [{ kind: 'defenceMod', value: 1, attr: 'Wisdom' }],
    tags: ['pious', 'apostate'],
  },
  {
    id: 'bought-a-bow-in-waldheim',
    name: 'Bought a Bow in Waldheim',
    mechanic: 'Proficiency with {weapon}, whatever your Class and Path allow. It sits at +0 forever.',
    esoteric: 'You paid a man named Hesk for it, and you still owe him.',
    slots: { weapon: { table: 'weapon', tag: 'ranged' } },
    effects: [{ kind: 'grantProficiency', group: '{weapon}' }],
    tags: ['urban', 'debt'],
  },
  {
    id: 'cousin-to-the-kellish',
    name: 'Cousin to the Kellish',
    mechanic: 'You speak Kellish. −1 on social checks with Imperial officials.',
    esoteric: 'They hear the vowels and stop listening.',
    effects: [
      { kind: 'grantLanguage', language: 'Kellish' },
      { kind: 'socialPenalty', value: -1, when: { culture: 'Imperial officialdom' } },
    ],
    tags: ['foreign'],
  },
  {
    id: 'the-third-milestone',
    name: 'The Third Milestone',
    mechanic: '+1 to Dexterity saves.',
    esoteric:
      'You must touch every roadside shrine you pass. Prevented, you are foul company until the next one.',
    effects: [{ kind: 'saveMod', value: 1, attr: 'Dexterity' }],
    tags: ['pious', 'superstition'],
  },
  {
    id: 'read-one-page-too-many',
    name: 'Read One Page Too Many',
    mechanic:
      '+1 to History. −1 on your first save against anything written in Elder Arcana.',
    esoteric: 'You always read it before you resist it.',
    effects: [
      { kind: 'skillMod', value: 1, skill: 'History' },
      { kind: 'saveMod', value: -1, attr: 'Intelligence', when: { language: 'Elder Arcana', note: 'first save only' } },
    ],
    tags: ['learned', 'arcane'],
  },
  {
    id: 'hands-like-a-cooper',
    name: 'Hands Like a Cooper',
    mechanic: '+1 to Craft.',
    esoteric:
      'You cannot bring yourself to break a well-made thing, even when breaking it is the plan.',
    effects: [{ kind: 'skillMod', value: 1, skill: 'Craft' }],
    tags: ['tradesman'],
  },
  {
    id: 'owed-a-saints-debt',
    name: "Owed a Saint's Debt",
    mechanic: '+1 to Constitution saves.',
    esoteric:
      'You will not take payment for work done on the feast day of {saint} — and there are more feast days than you would think.',
    slots: { saint: { table: 'saint' } },
    effects: [{ kind: 'saveMod', value: 1, attr: 'Constitution' }],
    tags: ['pious'],
  },
];

// ── The engine ───────────────────────────────────────────────────

export interface RolledQuirk {
  id: string;
  name: string;
  mechanic: string;
  esoteric: string;
  effects: Effect[];
  fills: Record<string, string>; // which value each slot drew
}

/** Replace every {slot} token in a string with its drawn value. */
function fill(text: string, fills: Record<string, string>): string {
  return text.replace(/\{(\w+)(?::\w+)?\}/g, (whole, key: string) =>
    key in fills ? fills[key] : whole,
  );
}

function fillEffect(effect: Effect, fills: Record<string, string>): Effect {
  const out: any = { ...effect };
  if (typeof out.group === 'string') out.group = fill(out.group, fills);
  if (typeof out.language === 'string') out.language = fill(out.language, fills);
  if (typeof out.skill === 'string') out.skill = fill(out.skill, fills);
  if (out.when) {
    const when: any = { ...out.when };
    for (const k of Object.keys(when)) {
      if (typeof when[k] === 'string') when[k] = fill(when[k], fills);
    }
    out.when = when;
  }
  return out as Effect;
}

/**
 * The one enforced rule: an attackMod must carry a condition. A flat +1 to hit
 * is a Feat's job. Throws at build time rather than shipping a broken quirk.
 */
function assertConditionalAttacks(quirks: Quirk[]): void {
  for (const q of quirks) {
    for (const e of q.effects) {
      if (e.kind !== 'attackMod') continue;
      const conditions = e.when ? Object.values(e.when).filter(Boolean) : [];
      if (conditions.length === 0) {
        throw new Error(`Quirk "${q.id}": attackMod must carry a condition.`);
      }
    }
  }
}
assertConditionalAttacks(QUIRKS);

function pick<T>(list: T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)];
}

/** Roll one quirk and resolve its slots. Pass an rng for a repeatable draw. */
export function rollQuirk(rng: () => number = Math.random): RolledQuirk {
  const quirk = pick(QUIRKS, rng);
  const fills: Record<string, string> = {};

  for (const [key, spec] of Object.entries(quirk.slots ?? {})) {
    const rows = table(spec.table);
    const pool = spec.tag ? rows.filter((r) => r.tags.includes(spec.tag!)) : rows;
    // A tag that matches nothing falls back to the whole table rather than
    // throwing — a mistyped tag should not break the roll on a live page.
    fills[key] = pick(pool.length ? pool : rows, rng).value;
  }

  return {
    id: quirk.id,
    name: fill(quirk.name, fills),
    mechanic: fill(quirk.mechanic, fills),
    esoteric: fill(quirk.esoteric, fills),
    effects: quirk.effects.map((e) => fillEffect(e, fills)),
    fills,
  };
}
