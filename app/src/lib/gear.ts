// Starting Gear — the second half of the creation package, rolled with the
// Quirk as one draw. See mechanics/characters/quirks.md for the design record.
//
// The seesaw: the package first rolls a category (even thirds), takes a Quirk
// from that pool, then takes Gear from the OPPOSITE pool — a Bad Quirk pulls
// Good Gear and vice versa; Neutral pulls Neutral. The wildness lives inside
// each roll; only the sum is tamed.
//
// A gear card is authored like a quirk: a mechanic (what the thing is and
// does, with typed Effects where the shared vocabulary reaches) and a
// provenance (where it came from — the story riding on the object). Slots
// resolve against the same setting tables. Full weapon/armour stat blocks are
// the Gear pillar's job later; these cards are self-contained until then.

import type { Effect, SeesawCategory, SlotSpec } from './quirks';
import {
  assertConditionalAttacks,
  fill,
  fillEffect,
  pick,
  resolveSlots,
  rollQuirk,
  type RolledQuirk,
} from './quirks';

export interface GearItem {
  id: string;
  name: string;        // may carry {slots}
  category: SeesawCategory;
  mechanic: string;    // what it is and does — may carry {slots}
  provenance: string;  // where it came from / the story attached — may carry {slots}
  effects: Effect[];
  slots?: Record<string, SlotSpec>;
  tags?: string[];
}

// ── The corpus ───────────────────────────────────────────────────
// Good gear is a genuinely fine thing. Bad gear is a problem you carry — a
// curse, a debt, contraband — never merely a shoddy version of normal kit
// (a junk sword is a dull result; a stolen one is a story). Neutral gear is
// a strange thing: no modifier, all hook.

export const GEAR: GearItem[] = [
  // ── Good ──
  {
    id: 'a-masters-work',
    name: "A Master's Work",
    category: 'good',
    mechanic:
      'A masterwork weapon — your pick from the {weapon} group. +1 to hit with this weapon, and it is worth a season of a master’s wages to the right buyer.',
    provenance:
      'The maker’s mark is stamped small near the base. Anyone with the Craft to read it will ask, carefully, how you came by it.',
    slots: { weapon: { table: 'weapon', tag: 'martial' } },
    effects: [
      { kind: 'attackMod', value: 1, when: { proficiency: '{weapon}', note: 'this weapon only' } },
    ],
    tags: ['masterwork'],
  },
  {
    id: 'a-relic-of-a-saint',
    name: 'A Relic of {saint}',
    category: 'good',
    mechanic: '+1 to Wisdom Saves while it is on your person.',
    provenance:
      'A knucklebone in a tin locket, pressed into your hand by a dying pilgrim who mistook you for somebody else. The Church would pay handsomely for it — or ask how you got it.',
    slots: { saint: { table: 'saint' } },
    effects: [{ kind: 'saveMod', value: 1, attr: 'Wisdom', when: { note: 'while carried' } }],
    tags: ['relic', 'pious'],
  },
  {
    id: 'a-letter-of-passage',
    name: 'A Letter of Passage',
    category: 'good',
    mechanic: '+1 to Diplomacy in {place}. The seal is real.',
    provenance:
      'Signed by an officer of {place} for a service your family rendered before you were born. The seal still opens doors; the debt behind it was paid long ago.',
    slots: { place: { table: 'place' } },
    effects: [{ kind: 'skillMod', value: 1, skill: 'Diplomacy', when: { place: '{place}' } }],
    tags: ['document'],
  },
  {
    id: 'a-wheellock-pistol',
    name: 'A Wheellock Pistol',
    category: 'good',
    mechanic:
      'A fine pistol (Pistols group), with powder and shot for twenty firings. Rare enough that selling it would keep you for a year; using it well requires the proficiency.',
    provenance:
      'Won at cards from a man who wanted it back. He sailed for Havilah before he could press the point.',
    effects: [],
    tags: ['firearm', 'rare'],
  },
  {
    id: 'a-physicians-kit',
    name: 'A Physician’s Kit, Fully Stocked',
    category: 'good',
    mechanic: 'A Healer’s Kit holding 10 Supplies (see the Heal skill).',
    provenance:
      'The late owner’s name is burned into the lid, and half the labels are in a shorthand you are still puzzling out.',
    effects: [],
    tags: ['kit'],
  },

  // ── Neutral ──
  {
    id: 'a-broken-orb',
    name: 'A Broken Orb',
    category: 'neutral',
    mechanic:
      'An Occultist’s Orb, cracked clean through. As an implement it is useless. As anything else, it is also useless.',
    provenance:
      'It hums, very faintly, on the feast days of {saint}. You have stopped mentioning this to people.',
    slots: { saint: { table: 'saint' } },
    effects: [],
    tags: ['occult'],
  },
  {
    id: 'a-dead-mans-diary',
    name: 'A Dead Man’s Diary',
    category: 'neutral',
    mechanic: 'A water-stained diary, written in {language}.',
    provenance: 'The last entry stops mid-sentence.',
    slots: { language: { table: 'language' } },
    effects: [],
    tags: ['document'],
  },
  {
    id: 'a-key-without-a-lock',
    name: 'A Key Without a Lock',
    category: 'neutral',
    mechanic: 'A heavy iron key bearing the arms of a house in {place}.',
    provenance: 'Your mother kept it sewn into her hem. She never said why, and now she cannot.',
    slots: { place: { table: 'place' } },
    effects: [],
    tags: ['mystery'],
  },
  {
    id: 'a-soldiers-weapon',
    name: 'A Soldier’s {weapon}',
    category: 'neutral',
    mechanic:
      'A plain, serviceable weapon of the {weapon} group. Nothing about it is special.',
    provenance:
      'Seventeen notches on the haft, and room left for more. Whoever cut them took care over it.',
    slots: { weapon: { table: 'weapon', tag: 'martial' } },
    effects: [],
    tags: ['veteran'],
  },
  {
    id: 'a-dog-of-no-particular-breed',
    name: 'A Dog of No Particular Breed',
    category: 'neutral',
    mechanic:
      'A dog follows you. It is not a trained companion (see Animal Companions); it is a dog.',
    provenance:
      'It was waiting outside your door one morning, as though you were the one who was late.',
    effects: [],
    tags: ['animal'],
  },

  // ── Bad ──
  {
    id: 'a-cursed-rabbits-foot',
    name: 'A Cursed Rabbit’s Foot',
    category: 'bad',
    mechanic: '−1 to Dexterity Saves while it is on your person.',
    provenance:
      'You have thrown it in a river, a fire, and another man’s cart. It is in your pocket now.',
    effects: [{ kind: 'saveMod', value: -1, attr: 'Dexterity', when: { note: 'while carried' } }],
    tags: ['cursed'],
  },
  {
    id: 'a-debt-come-due',
    name: 'A Debt Come Due',
    category: 'bad',
    mechanic:
      'You begin play owing 30 sp to a moneylender in {place}, and his collectors know your face.',
    provenance: 'You do not remember signing. It is your signature.',
    slots: { place: { table: 'place' } },
    effects: [],
    tags: ['debt'],
  },
  {
    id: 'another-mans-weapon',
    name: 'Another Man’s {weapon}',
    category: 'bad',
    mechanic:
      'A fine weapon of the {weapon} group, bearing a crest that is not yours. −1 on social checks in {place}, where the crest is known.',
    provenance:
      'How you came by it is your business. Whether anyone believes you is theirs.',
    slots: {
      weapon: { table: 'weapon', tag: 'martial' },
      place: { table: 'place' },
    },
    effects: [{ kind: 'socialPenalty', value: -1, when: { place: '{place}' } }],
    tags: ['stolen'],
  },
  {
    id: 'a-black-tongue-pamphlet',
    name: 'A Black Tongue Pamphlet',
    category: 'bad',
    mechanic:
      'A printed pamphlet in the Black Tongue. Possessing it is a crime wherever the Church holds sway, and only a Black Market will buy it.',
    provenance:
      'You cannot read it. You keep it anyway, which is the part you cannot explain.',
    effects: [],
    tags: ['contraband', 'black-faith'],
  },
];

assertConditionalAttacks(GEAR);

// ── The package roll ─────────────────────────────────────────────

export const CATEGORIES: SeesawCategory[] = ['good', 'neutral', 'bad'];

/** The seesaw: a Quirk's category pulls Gear from the opposite pool. */
export const OPPOSITE: Record<SeesawCategory, SeesawCategory> = {
  good: 'bad',
  neutral: 'neutral',
  bad: 'good',
};

export interface RolledGear {
  id: string;
  name: string;
  category: SeesawCategory;
  mechanic: string;
  provenance: string;
  effects: Effect[];
  fills: Record<string, string>;
}

export interface CreationPackage {
  quirk: RolledQuirk;
  gear: RolledGear;
}

/** Resolve one specific gear card's slots. Exposed so tests can cover every card. */
export function resolveGear(item: GearItem, rng: () => number): RolledGear {
  const fills = resolveSlots(item.slots, rng);
  return {
    id: item.id,
    name: fill(item.name, fills),
    category: item.category,
    mechanic: fill(item.mechanic, fills),
    provenance: fill(item.provenance, fills),
    effects: item.effects.map((e) => fillEffect(e, fills)),
    fills,
  };
}

/** Roll one gear card from the named pool. */
export function rollGear(
  category: SeesawCategory,
  rng: () => number = Math.random,
): RolledGear {
  const pool = GEAR.filter((g) => g.category === category);
  return resolveGear(pick(pool, rng), rng);
}

/**
 * The Finale roll: Quirk and Starting Gear together, as one package.
 * Category first (even thirds — the seesaw already tames the sum, so the
 * extremes stay common), then a uniform draw within each pool. Starting coin
 * rolls separately and is not seesawed.
 */
export function rollPackage(rng: () => number = Math.random): CreationPackage {
  const category = pick(CATEGORIES, rng);
  const quirk = rollQuirk(rng, category);
  const gear = rollGear(OPPOSITE[category], rng);
  return { quirk, gear };
}
