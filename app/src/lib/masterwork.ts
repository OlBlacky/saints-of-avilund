// Masterwork Qualities as typed rules data (mechanics/masterwork.md): each
// home market's à-la-carte menu. A Quality attaches to a Masterwork item
// instance at its home market — at purchase or as a later retrofit — and is
// priced as the master's days. At most MAX_QUALITIES per item, each once,
// with exclusions where the craft demands it (you cannot boil and layer the
// same hide). The engine reads Qualities by literal id: the flat ones join
// the sheet's arithmetic, the conditional ones print as situational lines.

import { ARMOURS, MELEE_WEAPONS, RANGED_WEAPONS, SHIELDS, type Cp } from './equipment';

export const MAX_QUALITIES = 2;

export interface Quality {
  /** Permanent stable id — never changes once published. */
  id: string;
  name: string;
  /** The rule, printed on the sheet beside the item. */
  effect: string;
  priceCp: Cp;
  days: number;
  /** The home market that works it (lib/markets.ts id). */
  marketId: string;
  /** Item ids this Quality may attach to. */
  fits: (itemId: string) => boolean;
  /** Quality ids that cannot share an item with this one. */
  excludes?: string[];
  /** What the work does to the item's weight: a multiplier on the base
   * pounds, and pounds the work puts on. Read by qualityWeightLb, so the
   * Load arithmetic follows. */
  weightFactor?: number;
  weightAddLb?: number;
  /** A multiplier on every one of the weapon's range increments. Read by
   * qualityRange, so the listed bands are the bands you shoot. */
  rangeFactor?: number;
  /** A replacement die for the item's own damage — the bossed buckler
   * bashes for 1d4 where the plain one bashes 1d3. Read by qualityDamage,
   * so the Attacks table prints the die the item actually throws. */
  damageDie?: string;
  /** Feet given back to the wearer's Speed and points given back to their
   * Stealth — an easing of the armour's drawbacks, never an increase. The
   * ease is capped at the penalty: articulation cannot make a Breastplate
   * faster than no armour at all. */
  speedEaseFt?: number;
  stealthEase?: number;
}

const PLATE = ['mw-breastplate', 'mw-full-plate'];

const LEATHERS = ['mw-leather', 'mw-studded-leather', 'mw-hide'];
const BOWS = ['mw-shortbow', 'mw-longbow'];
const isBlade = (itemId: string): boolean =>
  MELEE_WEAPONS.some(
    (w) => w.id === itemId && w.masterwork &&
      (w.group === 'Heavy Blades' || w.group === 'Light Blades'),
  );

export const QUALITIES: Quality[] = [
  // ── Leather Armour — Mantlethorn Castle Market ─────────────────
  {
    id: 'blackened', name: 'Blackened', effect: '+1 Stealth',
    priceCp: 1000, days: 10, marketId: 'mantlethorn-castle',
    fits: (id) => LEATHERS.includes(id),
  },
  {
    id: 'fur-lined', name: 'Fur Lined', effect: 'Resist Cold 1. +2 lb.',
    priceCp: 1000, days: 10, marketId: 'mantlethorn-castle',
    // Hide is already fur — Grim Trophy takes its slot.
    fits: (id) => id === 'mw-leather' || id === 'mw-studded-leather',
    weightAddLb: 2,
  },
  {
    id: 'grim-trophy', name: 'Grim Trophy', effect: '+1 Intimidate',
    priceCp: 1000, days: 10, marketId: 'mantlethorn-castle',
    fits: (id) => id === 'mw-hide',
  },
  {
    id: 'boiled-leather', name: 'Boiled Leather',
    effect: '+1 DR vs. Slashing and Piercing',
    priceCp: 2000, days: 20, marketId: 'mantlethorn-castle',
    fits: (id) => LEATHERS.includes(id), excludes: ['layered'],
  },
  {
    id: 'layered', name: 'Layered',
    effect: '+1 Dex Defence, +1 Dex Save, +1 DR vs. Area Effects',
    priceCp: 2000, days: 20, marketId: 'mantlethorn-castle',
    fits: (id) => LEATHERS.includes(id), excludes: ['boiled-leather'],
  },

  // ── Bows — The Long Butts ──────────────────────────────────────
  {
    id: 'heartwood-belly', name: 'Heartwood Belly', effect: '+50% Range Increments',
    priceCp: 1000, days: 10, marketId: 'long-butts',
    fits: (id) => BOWS.includes(id), excludes: ['composite-heartwood-belly'],
    rangeFactor: 1.5,
  },
  {
    id: 'silken-bowstring', name: 'Silken Looped Bowstring & Beeswax',
    effect: '+1 Initiative if the bow is Equipped. Resistant to moisture.',
    priceCp: 1000, days: 10, marketId: 'long-butts',
    fits: (id) => BOWS.includes(id),
  },
  {
    id: 'composite-heartwood-belly', name: 'Composite Heartwood Belly',
    effect: '+100% Range Increments',
    priceCp: 2000, days: 20, marketId: 'long-butts',
    fits: (id) => BOWS.includes(id), excludes: ['heartwood-belly', 'laminated-warbow'],
    rangeFactor: 2,
  },
  {
    id: 'laminated-warbow', name: 'Laminated Warbow', effect: '+1 Damage',
    priceCp: 2000, days: 20, marketId: 'long-butts',
    fits: (id) => BOWS.includes(id), excludes: ['composite-heartwood-belly'],
  },

  // ── Blades — The Forge Monastery of San Corrado ────────────────
  {
    id: 'fuller-balanced', name: 'Fuller / Balanced',
    effect: '+1 Initiative if the blade is Equipped. The blade weighs 25% less.',
    priceCp: 1000, days: 10, marketId: 'forge-monastery',
    fits: isBlade, weightFactor: 0.75,
  },
  {
    id: 'needle-point', name: 'Needle Point', effect: 'Ignore 1 DR',
    priceCp: 1000, days: 10, marketId: 'forge-monastery',
    fits: isBlade,
  },
  {
    id: 'crucible-steel', name: 'Crucible Steel', effect: '+1 Damage',
    priceCp: 2000, days: 20, marketId: 'forge-monastery',
    fits: isBlade,
  },
  {
    id: 'patterned-steel', name: 'Forge Monastery Patterned Steel',
    effect: 'Critical on 19, 20. A natural 19 is a Critical only if the attack hits.',
    priceCp: 3000, days: 30, marketId: 'forge-monastery',
    fits: isBlade,
  },

  // ── Plate — The Plattnerhalle ──────────────────────────────────
  // Breastplate and Full Plate share one menu. No exclusions: the two greats
  // are meant to be taken together where a character can afford both, and
  // they compound on purpose — a higher DR turns more attacks into the
  // failed sort, and Besagews takes even the last point off those.
  {
    id: 'deflective-design', name: 'Deflective Design',
    effect: 'The first Critical Hit against you each encounter is a normal hit instead.',
    priceCp: 1000, days: 10, marketId: 'plattnerhalle',
    fits: (id) => PLATE.includes(id),
  },
  {
    id: 'tailored-articulated', name: 'Tailored and Articulated',
    effect: "Eases the armour's drawbacks: 5' of Speed and 1 point of Stealth given back.",
    priceCp: 1000, days: 10, marketId: 'plattnerhalle',
    fits: (id) => PLATE.includes(id),
    speedEaseFt: 5, stealthEase: 1,
  },
  {
    id: 'case-hardened', name: 'Case Hardened', effect: '+1 DR',
    priceCp: 2000, days: 20, marketId: 'plattnerhalle',
    fits: (id) => PLATE.includes(id),
  },
  {
    id: 'besagews', name: 'Besagews, Gorgets & Goussets',
    effect: 'An attack whose maximum damage cannot beat your DR deals no damage at all, not 1.',
    priceCp: 2000, days: 20, marketId: 'plattnerhalle',
    fits: (id) => PLATE.includes(id),
  },

  // ── Buckler — The Plattnerhalle ────────────────────────────────
  // Two options, not the usual four, and you take one: a shield is a simple
  // thing and there are not four ways to better it (Les, Aug 16 2026). The
  // menu is the Buckler's alone — the larger shields are expected to get
  // traits of their own rather than share this bench.
  // Priced at half the standard good/great (Les, Aug 16 2026) — a buckler is
  // a small piece and the work is short. The days follow the price down: the
  // surcharge is the master's wage × the days, and that derivation holds.
  {
    id: 'bossed', name: 'Bossed',
    effect: 'The buckler bashes for 1d4 in place of 1d3.',
    priceCp: 500, days: 5, marketId: 'plattnerhalle',
    fits: (id) => id === 'mw-buckler', excludes: ['enarmed'],
    damageDie: '1d4',
  },
  {
    id: 'enarmed', name: 'Enarmed',
    effect: 'Reduce the action to Raise a Shield by one step: Standard → Move → Minor → Free.',
    priceCp: 1000, days: 10, marketId: 'plattnerhalle',
    fits: (id) => id === 'mw-buckler', excludes: ['bossed'],
  },
];

export function qualityById(id: string): Quality | undefined {
  return QUALITIES.find((q) => q.id === id);
}

/** One instance's weight after its Qualities have had their say — the
 * catalogue pounds, scaled by whatever the work took out of the piece, then
 * carrying whatever it put on. The scaling goes first: a lining is sewn into
 * the armour that arrives, not into the one it was cut from. */
export function qualityWeightLb(baseLb: number, qualities?: string[]): number {
  if (!qualities?.length) return baseLb;
  const worked = qualities.map((id) => qualityById(id)).filter((q) => q !== undefined) as Quality[];
  const scaled = worked.reduce((lb, q) => lb * (q.weightFactor ?? 1), baseLb);
  return worked.reduce((lb, q) => lb + (q.weightAddLb ?? 0), scaled);
}

/** One instance's range increments after its Qualities have had their say —
 * every band scaled by the work in the belly of the bow. The two Heartwood
 * Bellies exclude each other, so in practice at most one factor applies. */
export function qualityRange(range: string | null, qualities?: string[]): string | null {
  if (!range || !qualities?.length) return range;
  const factor = qualities
    .map((id) => qualityById(id))
    .reduce((f, q) => f * (q?.rangeFactor ?? 1), 1);
  if (factor === 1) return range;
  return range.split('/').map((n) => Math.round(Number(n) * factor)).join('/');
}

/** One instance's damage die after its Qualities have had their say. A
 * Quality that re-cuts the striking face replaces the die outright rather
 * than adding to it; the exclusions mean at most one can apply. */
export function qualityDamage(baseDie: string, qualities?: string[]): string {
  if (!qualities?.length) return baseDie;
  const worked = qualities.map((id) => qualityById(id)?.damageDie).find((d) => d);
  return worked ?? baseDie;
}

/** How much of a drawback the Qualities on one instance give back. Capped
 * against the armour's own penalty by the caller — an ease is a refund, not
 * a bonus. */
export function qualityEase(
  qualities: string[] | undefined,
  field: 'speedEaseFt' | 'stealthEase',
): number {
  if (!qualities?.length) return 0;
  return qualities.reduce((n, id) => n + (qualityById(id)?.[field] ?? 0), 0);
}

/** Whether a catalogue id is a Masterwork variant at all. */
export function isMasterworkItem(itemId: string): boolean {
  return [...MELEE_WEAPONS, ...RANGED_WEAPONS, ...ARMOURS, ...SHIELDS].some(
    (i) => i.id === itemId && i.masterwork,
  );
}

/** Whether it is a Masterwork weapon — the only items an owner may name. */
export function isMasterworkWeapon(itemId: string): boolean {
  return [...MELEE_WEAPONS, ...RANGED_WEAPONS].some(
    (w) => w.id === itemId && w.masterwork,
  );
}

/** The menu for one item — what its home market can work into it. */
export function qualitiesFor(itemId: string): Quality[] {
  return QUALITIES.filter((q) => q.fits(itemId));
}
