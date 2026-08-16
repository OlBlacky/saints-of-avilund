// Masterwork Qualities as typed rules data (mechanics/masterwork.md): each
// home market's à-la-carte menu. A Quality attaches to a Masterwork item
// instance at its home market — at purchase or as a later retrofit — and is
// priced as the master's days. At most MAX_QUALITIES per item, each once,
// with exclusions where the craft demands it (you cannot boil and layer the
// same hide). The engine reads Qualities by literal id: the flat ones join
// the sheet's arithmetic, the conditional ones print as situational lines.

import { ARMOURS, MELEE_WEAPONS, RANGED_WEAPONS, type Cp } from './equipment';

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
}

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
  },
  {
    id: 'silken-bowstring', name: 'Silken Looped Bowstring & Beeswax',
    effect: '+1 Initiative if the bow is ready. Resistant to moisture.',
    priceCp: 1000, days: 10, marketId: 'long-butts',
    fits: (id) => BOWS.includes(id),
  },
  {
    id: 'composite-heartwood-belly', name: 'Composite Heartwood Belly',
    effect: '+100% Range Increments',
    priceCp: 2000, days: 20, marketId: 'long-butts',
    fits: (id) => BOWS.includes(id), excludes: ['heartwood-belly', 'laminated-warbow'],
  },
  {
    id: 'laminated-warbow', name: 'Laminated Warbow', effect: '+1 Damage',
    priceCp: 2000, days: 20, marketId: 'long-butts',
    fits: (id) => BOWS.includes(id), excludes: ['composite-heartwood-belly'],
  },

  // ── Blades — The Forge Monastery of San Corrado ────────────────
  {
    id: 'fuller-balanced', name: 'Fuller / Balanced',
    effect: '+1 Initiative if the blade is ready. The blade weighs 25% less.',
    priceCp: 1000, days: 10, marketId: 'forge-monastery',
    fits: isBlade,
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
];

export function qualityById(id: string): Quality | undefined {
  return QUALITIES.find((q) => q.id === id);
}

/** Whether a catalogue id is a Masterwork variant at all. */
export function isMasterworkItem(itemId: string): boolean {
  return [...MELEE_WEAPONS, ...RANGED_WEAPONS, ...ARMOURS].some(
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
