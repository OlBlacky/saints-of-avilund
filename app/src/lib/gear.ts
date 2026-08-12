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
  /** Fixed cards: starting coin in sp, overriding the category's rate. */
  coinSp?: number;
  /** Catalogue items the card hands over in place of one free-named thing.
   * The first grant is the anchor; `within: true` nests a grant inside it
   * (a kit's Supplies). `choice` renders into the instance name and may
   * carry a {slot}. */
  grants?: {
    itemId: string;
    qty?: number;
    within?: boolean;
    location?: 'worn' | 'equipped';
    choice?: string;
  }[];
}

/**
 * Starting coin leans against the Gear roll — the seesaw's money leg. Bad
 * gear pays you back; good gear was the payment. (Quirk category plays no
 * part: coin follows the GEAR.)
 */
export const STARTING_COIN: Record<SeesawCategory, number> = {
  bad: 200,
  neutral: 150,
  good: 100,
};

// ── The corpus ───────────────────────────────────────────────────
// The pools are price-anchored against the Equipment page:
//   Good    — a really nice thing, roughly 150–350 sp: a suit of armour, a
//             masterwork weapon or tools, a firearm.
//   Neutral — useful, relevant kit worth ~50–100 sp: a chain shirt, a
//             50 sp-tier weapon, a fitted trade chest. (Everyday kit is
//             cheap here — a stocked Healer's Kit is 12 sp — so Neutral
//             lives in the tier above ordinary.)
//   Bad     — useless or worse: curios, curses, debts, contraband. Never
//             merely a shoddy version of normal kit (a junk sword is a dull
//             result; a stolen one is a story).
// With coin, a Bad or Neutral start is worth roughly 200 sp; a Good start
// deliberately nets a little more — an unasked-for windfall may overshoot.
// Planned (see the spec's Finale section): draws that read the character —
// proficiency-weighted weapon/tool cards, origin-weighted {place} fills.

export const GEAR: GearItem[] = [
  // ── Good ──
  {
    id: 'a-masters-work',
    name: "A Master's Work",
    category: 'good',
    mechanic:
      'A masterwork weapon — your pick from the {weapon} group. +1 to hit with this weapon, and it is worth upward of 200 sp to the right buyer.',
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
      'A fine pistol (Pistols group), with powder and shot for twenty firings. Rare enough that selling it would keep you through a winter; using it well requires the proficiency.',
    provenance:
      'Won at cards from a man who wanted it back. He sailed for Havilah before he could press the point.',
    effects: [],
    tags: ['firearm', 'rare'],
  },
  {
    id: 'a-suit-of-splint-mail',
    name: 'A Suit of Splint Mail',
    category: 'good',
    mechanic:
      'A full suit of Splint Mail (Heavy Armour; see Equipment) — 200 sp of armourer’s work, and it fits you.',
    provenance:
      'Made to the measure of a man who died between the fitting and the collection. The armourer wanted it out of his shop.',
    effects: [],
    tags: ['armour'],
  },
  {
    id: 'a-masters-tools',
    name: 'A Master’s Tools',
    category: 'good',
    mechanic:
      'Masterwork tools of a trade: +1 to checks made with them, stacking past the training cap (see Equipment). Worth 100 sp over ordinary tools.',
    provenance:
      'The former owner’s initials are inlaid in brass on every handle, and tradesmen who recognize the set will ask after him.',
    effects: [{ kind: 'skillMod', value: 1, skill: 'Craft', when: { note: 'with these tools' } }],
    tags: ['masterwork', 'tools'],
  },

  // ── Neutral ──
  {
    id: 'a-soldiers-weapon',
    name: 'A Soldier’s {weapon}',
    category: 'neutral',
    mechanic:
      'A war-kept weapon of the {weapon} group — plain, perfectly serviceable, and a good 50 sp of smithwork.',
    provenance:
      'Seventeen notches on the haft, and room left for more. Whoever cut them took care over it.',
    slots: { weapon: { table: 'weapon', tag: 'martial' } },
    effects: [],
    tags: ['veteran'],
  },
  {
    id: 'a-chain-shirt',
    name: 'A Chain Shirt of Good Make',
    category: 'neutral',
    mechanic: 'A Chain Shirt (Medium Armour; see Equipment) — 50 sp new, and this one is nearly new.',
    provenance:
      'One split ring over the heart has been mended with wire of a different colour.',
    effects: [],
    tags: ['armour'],
  },
  {
    id: 'a-hand-crossbow',
    name: 'A Hand Crossbow',
    category: 'neutral',
    mechanic:
      'A Hand Crossbow (75 sp) with a case of bolts. Concealable; using it well requires the proficiency.',
    provenance:
      'It was sold to you as a lady’s hunting piece. It has killed at least one man.',
    effects: [],
    tags: ['weapon'],
  },
  {
    id: 'a-physicians-chest',
    name: 'A Physician’s Chest',
    category: 'neutral',
    mechanic:
      'A fitted chest holding a Healer’s Kit stocked to 20 Supplies, with fine instruments — 60 sp to a man of the trade (see the Heal skill).',
    provenance:
      'The late owner’s name is burned into the lid, and half the labels are in a shorthand you are still puzzling out.',
    effects: [],
    tags: ['kit'],
  },

  // ── Bad ──
  {
    id: 'a-broken-orb',
    name: 'A Broken Orb',
    category: 'bad',
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
    category: 'bad',
    mechanic: 'A water-stained diary, written in {language}. It has no price a shop would recognize.',
    provenance: 'The last entry stops mid-sentence.',
    slots: { language: { table: 'language' } },
    effects: [],
    tags: ['document'],
  },
  {
    id: 'a-key-without-a-lock',
    name: 'A Key Without a Lock',
    category: 'bad',
    mechanic: 'A heavy iron key bearing the arms of a house in {place}. Worth nothing to anyone who is not you.',
    provenance: 'Your mother kept it sewn into her hem. She never said why, and now she cannot.',
    slots: { place: { table: 'place' } },
    effects: [],
    tags: ['mystery'],
  },
  {
    id: 'a-dog-of-no-particular-breed',
    name: 'A Dog of No Particular Breed',
    category: 'bad',
    mechanic:
      'A dog follows you. It is not a trained companion (see Animal Companions); it is a dog, and it eats.',
    provenance:
      'It was waiting outside your door one morning, as though you were the one who was late.',
    effects: [],
    tags: ['animal'],
  },
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

// ── Fixed gear ───────────────────────────────────────────────────
// Outside the seesaw pools entirely. The Vow of Poverty fixes the Starting
// Gear: no roll, no coin — and the Quirk draws from the Good pool alone
// (mechanics/characters/quirks.md). The saint of the medal is the player's
// pick, written into the roll's gearSlots.

export const VOW_OF_POVERTY_GEAR: GearItem = {
  id: 'the-mendicants-portion',
  name: 'The Mendicant’s Portion',
  category: 'neutral',
  mechanic:
    'A Friar’s Kit, half-filled (10 Supplies), and a wooden medal of {saint}. You begin with no coin.',
  provenance:
    'The order’s issue, pressed into your hands the day you took the Vow. [[add text]]',
  slots: { saint: { table: 'saint' } },
  effects: [],
  coinSp: 0,
  grants: [
    { itemId: 'friars-kit' },
    { itemId: 'supplies', qty: 1, within: true, choice: "Friar's Kit" },
    { itemId: 'saints-medal-wood', location: 'worn', choice: '{saint}' },
  ],
  tags: ['fixed', 'vow'],
};

/** Find a gear card by id — the rolled pools plus the fixed cards. */
export function gearById(id: string): GearItem | undefined {
  if (id === VOW_OF_POVERTY_GEAR.id) return VOW_OF_POVERTY_GEAR;
  return GEAR.find((g) => g.id === id);
}

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
  /** Starting coin in sp, set by the gear's category (the money leg). */
  coin: number;
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
    coin: item.coinSp ?? STARTING_COIN[item.category],
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
export function rollPackage(
  rng: () => number = Math.random,
  opts: { vowOfPoverty?: boolean } = {},
): CreationPackage {
  // The Vow of Poverty escapes the seesaw: the gear is fixed, the Quirk
  // draws from the Good pool alone.
  if (opts.vowOfPoverty) {
    return { quirk: rollQuirk(rng, 'good'), gear: resolveGear(VOW_OF_POVERTY_GEAR, rng) };
  }
  const category = pick(CATEGORIES, rng);
  const quirk = rollQuirk(rng, category);
  const gear = rollGear(OPPOSITE[category], rng);
  return { quirk, gear };
}
