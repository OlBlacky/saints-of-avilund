// The equipment catalogue — the standard price list (the Waldheim Market's
// stock), lifted from the hand-written tables of the old
// content/rules/equipment.md (Aug 10 2026). Single source of truth: the
// /system/equipment/ page renders from this file, and the Markets/shop
// machinery reads it.
//
// Prices are stored in COPPER (cp); 10 cp = 1 sp, 10 sp = 1 gp. Weights are
// in pounds. A null price means "not sold" (Club, Unarmed Strike); a null
// weight means negligible.
//
// Not lifted (kept as prose on the page): the Wealth fold's worldbuilding
// tables (wages, property, a day's living) and the sample poison card —
// poisons are a crafting system, not catalogue stock.

import { SAINTS } from './saints';

export type Cp = number;

/** The saint catalogue as a dropdown (Saint's medals). Obscure and folk
 * saints beyond the catalogue arrive via the free-text Other. */
const SAINT_NAMES = SAINTS.map((s) => `St. ${s.name}`);

// ── Money formatting ─────────────────────────────────────────────

/** List-price display: single denomination, as the book writes prices
 *  ("2 sp", "5 cp", "1,500 sp"). */
export function fmtPrice(cp: Cp | null): string {
  if (cp === null) return '—';
  if (cp % 10 === 0 && cp >= 10) return `${(cp / 10).toLocaleString('en-US')} sp`;
  return `${cp.toLocaleString('en-US')} cp`;
}

/** Wealth display: reduced to the fewest coins ("1 sp 1 cp", never "11 cp"). */
export function fmtCoins(cp: Cp): string {
  const sp = Math.floor(cp / 10);
  const rest = cp % 10;
  if (sp > 0 && rest > 0) return `${sp.toLocaleString('en-US')} sp ${rest} cp`;
  if (sp > 0) return `${sp.toLocaleString('en-US')} sp`;
  return `${rest} cp`;
}

export function fmtWeight(lb: number | null): string {
  if (lb === null) return '—';
  if (lb === 0.5) return '½ lb';
  return `${lb.toLocaleString('en-US')} lb`;
}

// ── Weapons ──────────────────────────────────────────────────────

export const WEAPON_GROUPS = [
  'Light Blades', 'Heavy Blades', 'Axes', 'Hammers/Maces', 'Picks',
  'Flails/Chains', 'Polearms', 'Spears/Lances', 'Staves', 'Unarmed/Natural',
  'Bows', 'Crossbows', 'Slings', 'Thrown', 'Pistols', 'Rifles', 'Grenades',
] as const;
export type WeaponGroup = (typeof WEAPON_GROUPS)[number];

export type DamageKind = 'Piercing' | 'Slashing' | 'Blunt';

export interface Weapon {
  id: string;
  name: string;
  group: WeaponGroup;
  type: DamageKind;
  damage: string;
  hands: '1H' | '2H';
  weightLb: number | null;
  priceCp: Cp | null;
  /** Range increments, e.g. "20/40/60" — null for melee-only. */
  range: string | null;
  properties: string[];
}

export const MELEE_WEAPONS: Weapon[] = [
  { id: 'dagger', name: 'Dagger', group: 'Light Blades', type: 'Piercing', damage: '1d4', hands: '1H', weightLb: 1, priceCp: 20, range: '10/20/30', properties: ['Finesse', 'Thrown', 'Concealable'] },
  { id: 'parrying-dagger', name: 'Parrying Dagger', group: 'Light Blades', type: 'Piercing', damage: '1d4', hands: '1H', weightLb: 1, priceCp: 50, range: null, properties: ['Finesse', 'Defensive', 'Concealable'] },
  { id: 'shortsword', name: 'Shortsword', group: 'Light Blades', type: 'Piercing', damage: '1d6', hands: '1H', weightLb: 2, priceCp: 100, range: null, properties: ['Finesse'] },
  { id: 'rapier', name: 'Rapier', group: 'Light Blades', type: 'Piercing', damage: '1d8', hands: '1H', weightLb: 2, priceCp: 250, range: null, properties: ['Finesse'] },
  { id: 'scimitar', name: 'Scimitar', group: 'Heavy Blades', type: 'Slashing', damage: '1d6', hands: '1H', weightLb: 3, priceCp: 150, range: null, properties: ['Finesse'] },
  { id: 'longsword', name: 'Longsword', group: 'Heavy Blades', type: 'Slashing', damage: '1d8', hands: '1H', weightLb: 3, priceCp: 150, range: null, properties: ['Versatile (1d10)'] },
  { id: 'bastard-sword', name: 'Bastard Sword', group: 'Heavy Blades', type: 'Slashing', damage: '1d10', hands: '1H', weightLb: 6, priceCp: 350, range: null, properties: ['Versatile (1d12)'] },
  { id: 'greatsword', name: 'Greatsword', group: 'Heavy Blades', type: 'Slashing', damage: '2d6', hands: '2H', weightLb: 6, priceCp: 500, range: null, properties: [] },
  { id: 'hatchet', name: 'Hatchet', group: 'Axes', type: 'Slashing', damage: '1d4', hands: '1H', weightLb: 1, priceCp: 10, range: '10/20/30', properties: ['Thrown'] },
  { id: 'handaxe', name: 'Handaxe', group: 'Axes', type: 'Slashing', damage: '1d6', hands: '1H', weightLb: 2, priceCp: 50, range: '10/20/30', properties: ['Thrown'] },
  { id: 'battleaxe', name: 'Battleaxe', group: 'Axes', type: 'Slashing', damage: '1d8', hands: '1H', weightLb: 4, priceCp: 100, range: null, properties: ['Versatile (1d10)'] },
  { id: 'greataxe', name: 'Greataxe', group: 'Axes', type: 'Slashing', damage: '1d12', hands: '2H', weightLb: 7, priceCp: 300, range: null, properties: [] },
  { id: 'club', name: 'Club', group: 'Hammers/Maces', type: 'Blunt', damage: '1d4', hands: '1H', weightLb: 2, priceCp: null, range: null, properties: [] },
  { id: 'light-hammer', name: 'Light Hammer', group: 'Hammers/Maces', type: 'Blunt', damage: '1d4', hands: '1H', weightLb: 2, priceCp: 20, range: '10/20/30', properties: ['Thrown'] },
  { id: 'mace', name: 'Mace', group: 'Hammers/Maces', type: 'Blunt', damage: '1d6', hands: '1H', weightLb: 4, priceCp: 50, range: null, properties: [] },
  { id: 'warhammer', name: 'Warhammer', group: 'Hammers/Maces', type: 'Blunt', damage: '1d8', hands: '1H', weightLb: 5, priceCp: 150, range: null, properties: ['Versatile (1d10)'] },
  { id: 'morningstar', name: 'Morningstar', group: 'Hammers/Maces', type: 'Piercing', damage: '1d8', hands: '1H', weightLb: 4, priceCp: 100, range: null, properties: [] },
  { id: 'maul', name: 'Maul', group: 'Hammers/Maces', type: 'Blunt', damage: '2d6', hands: '2H', weightLb: 10, priceCp: 150, range: null, properties: [] },
  { id: 'war-pick', name: 'War Pick', group: 'Picks', type: 'Piercing', damage: '1d8', hands: '1H', weightLb: 4, priceCp: 80, range: null, properties: [] },
  { id: 'flail', name: 'Flail', group: 'Flails/Chains', type: 'Blunt', damage: '1d8', hands: '1H', weightLb: 3, priceCp: 100, range: null, properties: [] },
  { id: 'halberd', name: 'Halberd', group: 'Polearms', type: 'Slashing', damage: '1d10', hands: '2H', weightLb: 6, priceCp: 200, range: null, properties: ['Reach'] },
  { id: 'spear', name: 'Spear', group: 'Spears/Lances', type: 'Piercing', damage: '1d6', hands: '1H', weightLb: 3, priceCp: 50, range: '20/40/60', properties: ['Versatile (1d8)', 'Reach', 'Thrown'] },
  { id: 'trident', name: 'Trident', group: 'Spears/Lances', type: 'Piercing', damage: '1d8', hands: '1H', weightLb: 4, priceCp: 120, range: '10/20/30', properties: ['Thrown'] },
  { id: 'longspear', name: 'Longspear', group: 'Spears/Lances', type: 'Piercing', damage: '1d8', hands: '2H', weightLb: 5, priceCp: 100, range: null, properties: ['Reach'] },
  { id: 'pike', name: 'Pike', group: 'Spears/Lances', type: 'Piercing', damage: '1d10', hands: '2H', weightLb: 8, priceCp: 150, range: null, properties: ['Reach'] },
  { id: 'lance', name: 'Lance', group: 'Spears/Lances', type: 'Piercing', damage: '1d10', hands: '1H', weightLb: 7, priceCp: 250, range: null, properties: ['Reach'] },
  { id: 'quarterstaff', name: 'Quarterstaff', group: 'Staves', type: 'Blunt', damage: '1d6', hands: '2H', weightLb: 4, priceCp: 10, range: null, properties: ['Defensive'] },
  { id: 'iron-shod-staff', name: 'Iron-Shod Staff', group: 'Staves', type: 'Blunt', damage: '1d8', hands: '2H', weightLb: 6, priceCp: 80, range: null, properties: ['Defensive'] },
  { id: 'unarmed-strike', name: 'Unarmed Strike', group: 'Unarmed/Natural', type: 'Blunt', damage: '1d3', hands: '1H', weightLb: null, priceCp: null, range: null, properties: [] },
  { id: 'cestus', name: 'Cestus', group: 'Unarmed/Natural', type: 'Blunt', damage: '1d4', hands: '1H', weightLb: 1, priceCp: 50, range: null, properties: ['Concealable'] },
];

export const RANGED_WEAPONS: Weapon[] = [
  { id: 'shortbow', name: 'Shortbow', group: 'Bows', type: 'Piercing', damage: '1d6', hands: '2H', weightLb: 2, priceCp: 250, range: '60/120/180', properties: [] },
  { id: 'longbow', name: 'Longbow', group: 'Bows', type: 'Piercing', damage: '1d8', hands: '2H', weightLb: 2, priceCp: 500, range: '100/200/300', properties: [] },
  { id: 'hand-crossbow', name: 'Hand Crossbow', group: 'Crossbows', type: 'Piercing', damage: '1d6', hands: '1H', weightLb: 3, priceCp: 750, range: '30/60/90', properties: ['Loading', 'Concealable'] },
  { id: 'light-crossbow', name: 'Light Crossbow', group: 'Crossbows', type: 'Piercing', damage: '1d8', hands: '2H', weightLb: 5, priceCp: 250, range: '80/160/240', properties: ['Loading'] },
  { id: 'crossbow', name: 'Crossbow', group: 'Crossbows', type: 'Piercing', damage: '1d10', hands: '2H', weightLb: 6, priceCp: 350, range: '100/200/300', properties: ['Loading'] },
  { id: 'heavy-crossbow', name: 'Heavy Crossbow', group: 'Crossbows', type: 'Piercing', damage: '1d12', hands: '2H', weightLb: 10, priceCp: 500, range: '120/240/360', properties: ['Loading'] },
  { id: 'sling', name: 'Sling', group: 'Slings', type: 'Blunt', damage: '1d4', hands: '1H', weightLb: null, priceCp: 10, range: '50/100/150', properties: [] },
  { id: 'staff-sling', name: 'Staff Sling', group: 'Slings', type: 'Blunt', damage: '1d6', hands: '2H', weightLb: 3, priceCp: 50, range: '60/120/180', properties: [] },
  { id: 'javelin', name: 'Javelin', group: 'Thrown', type: 'Piercing', damage: '1d6', hands: '1H', weightLb: 2, priceCp: 10, range: '30/60/90', properties: ['Thrown'] },
  { id: 'flintlock-pistol', name: 'Flintlock Pistol', group: 'Pistols', type: 'Piercing', damage: '1d8', hands: '1H', weightLb: 3, priceCp: 1000, range: '40/80/120', properties: ['Loading', 'Concealable'] },
  { id: 'horse-pistol', name: 'Horse Pistol', group: 'Pistols', type: 'Piercing', damage: '1d10', hands: '1H', weightLb: 4, priceCp: 1500, range: '50/100/150', properties: ['Loading'] },
  { id: 'musket', name: 'Musket', group: 'Rifles', type: 'Piercing', damage: '1d12', hands: '2H', weightLb: 10, priceCp: 2000, range: '80/160/240', properties: ['Loading'] },
  { id: 'long-rifle', name: 'Long Rifle', group: 'Rifles', type: 'Piercing', damage: '2d6', hands: '2H', weightLb: 11, priceCp: 3500, range: '120/240/360', properties: ['Loading'] },
  { id: 'firebomb', name: 'Firebomb', group: 'Grenades', type: 'Blunt', damage: '1d6', hands: '1H', weightLb: 1, priceCp: 250, range: '20/40/60', properties: ['Thrown'] },
  { id: 'fragmentation-grenade', name: 'Fragmentation Grenade', group: 'Grenades', type: 'Blunt', damage: '2d6', hands: '1H', weightLb: 1, priceCp: 500, range: '20/40/60', properties: ['Thrown'] },
];

export interface WeaponProperty { name: string; effect: string }
export const WEAPON_PROPERTIES: WeaponProperty[] = [
  { name: 'Finesse', effect: 'Use Dexterity instead of Strength for attack and damage.' },
  { name: 'Reach', effect: "Melee range is 10' instead of 5'." },
  { name: 'Thrown', effect: 'May be thrown, using the listed range increments.' },
  { name: 'Versatile', effect: 'May be used one- or two-handed; two-handed steps the damage die up one.' },
  { name: 'Loading', effect: 'Costs a Minor Action to reload between shots.' },
  { name: 'Concealable', effect: 'May be hidden on the body.' },
  { name: 'Defensive', effect: '+1 to a Defence Target while wielded.' },
];

// ── Simple catalogue items ───────────────────────────────────────

/** A purchase-time choice on an item (the mechanism Feats and builder
 * cards already use): Artisan's tools name their Craft, a Saint's medal
 * its saint. The pick renders in the instance's name and different picks
 * never stack. `other` allows a free-text entry beyond the options. */
export interface ItemChoice {
  key: string;
  label: string;
  options: string[];
  other?: boolean;
}

/** The common Crafts (Craft is an open speciality Skill — this is the
 * shop's dropdown, not a cap). Poison is deliberately absent from every
 * lawful shopfront; Black's Road offers it (markets.ts choiceExtras). */
export const CRAFTS = [
  'Apothecary', 'Armourer', 'Baker', 'Blacksmith', 'Bookbinder', 'Bowyer',
  'Brewer', 'Butcher', 'Carpenter', 'Chandler', 'Cobbler', 'Cook', 'Cooper',
  'Dyer', 'Fletcher', 'Furrier', 'Glassblower', 'Goldsmith', 'Gunsmith',
  'Jeweller', 'Leatherworker', 'Locksmith', 'Mason', 'Potter', 'Printer',
  'Ropemaker', 'Saddler', 'Shipwright', 'Tailor', 'Tanner', 'Vintner',
  'Weaponsmith', 'Weaver', 'Wheelwright',
];

export interface SimpleItem {
  id: string;
  name: string;
  priceCp: Cp | null;
  weightLb: number | null;
  /** Pricing unit where not "per item": 'per day', 'per mile', 'per night'… */
  unit?: string;
  /** Display override where a single number can't say it ("8–10 sp"). */
  priceText?: string;
  /** Container coefficient for Load (mechanics/encumbrance.md): purpose-built
   * carriers pack their contents at ×0.9 (Masterwork ×0.8, when those exist);
   * bulk vessels carry at full weight. */
  coefficient?: number;
  /** Container capacity in lb (mechanics/encumbrance.md). */
  capacityLb?: number;
  choice?: ItemChoice;
}

export const AMMUNITION: SimpleItem[] = [
  { id: 'sling-bullets', name: 'Sling bullets (10)', priceCp: 1, weightLb: 1 },
  { id: 'arrows', name: 'Arrows (20)', priceCp: 10, weightLb: 3 },
  { id: 'quiver', name: 'Quiver (holds 20)', priceCp: 10, weightLb: 2 },
  { id: 'crossbow-bolts', name: 'Crossbow bolts (10)', priceCp: 10, weightLb: 1 },
  { id: 'bolt-case', name: 'Bolt case (holds 10)', priceCp: 10, weightLb: 1 },
  { id: 'powder-horn', name: 'Powder horn', priceCp: 20, weightLb: 1 },
  { id: 'powder-and-shot', name: 'Powder and shot (10 rounds)', priceCp: 30, weightLb: 2 },
];

export const CONTAINERS: SimpleItem[] = [
  { id: 'belt-pouch', name: 'Belt pouch', priceCp: 5, weightLb: null, coefficient: 0.9, capacityLb: 2 },
  { id: 'sack-large', name: 'Sack, large', priceCp: 2, weightLb: 1, coefficient: 1, capacityLb: 40 },
  { id: 'basket', name: 'Basket', priceCp: 4, weightLb: 1, coefficient: 1, capacityLb: 25 },
  { id: 'satchel', name: 'Satchel', priceCp: 10, weightLb: 1, coefficient: 0.9, capacityLb: 15 },
  { id: 'backpack', name: 'Backpack', priceCp: 20, weightLb: 2, coefficient: 0.9, capacityLb: 50 },
  { id: 'waterskin', name: 'Waterskin (full)', priceCp: 10, weightLb: 4 },
  { id: 'flask-tin', name: 'Flask, tin', priceCp: 3, weightLb: null },
  { id: 'vial-glass', name: 'Vial, glass', priceCp: 5, weightLb: null },
  { id: 'chest-wooden', name: 'Chest, wooden', priceCp: 20, weightLb: 25, coefficient: 1, capacityLb: 150 },
  { id: 'strongbox', name: 'Strongbox, iron-bound (with lock)', priceCp: 100, weightLb: 15, coefficient: 1, capacityLb: 50 },
  { id: 'barrel', name: 'Barrel', priceCp: 20, weightLb: 30, coefficient: 1, capacityLb: 250 },
  { id: 'saddlebags', name: 'Saddlebags', priceCp: 40, weightLb: 8, coefficient: 0.9, capacityLb: 60 },
];

export interface LightSource extends SimpleItem {
  light: string | null;
  burns: string | null;
}

export const LIGHT_AND_FIRE: LightSource[] = [
  { id: 'candle', name: 'Candle', priceCp: 1, weightLb: null, light: "5'", burns: '1 hour' },
  { id: 'torch', name: 'Torch', priceCp: 1, weightLb: 1, light: "20'", burns: '1 hour' },
  { id: 'flask-of-oil', name: 'Flask of oil', priceCp: 1, weightLb: 1, light: null, burns: '6 hours (in a lamp)' },
  { id: 'tinderbox', name: 'Tinderbox', priceCp: 5, weightLb: 1, light: null, burns: null },
  { id: 'lamp-common', name: 'Lamp, common', priceCp: 10, weightLb: 1, light: "15'", burns: 'per flask' },
  { id: 'hooded-lantern', name: 'Hooded lantern', priceCp: 70, weightLb: 2, light: "30'", burns: 'per flask' },
  { id: 'bullseye-lantern', name: 'Bullseye lantern', priceCp: 120, weightLb: 3, light: "60' (cone)", burns: 'per flask' },
];

export const CAMP_AND_TRAIL: SimpleItem[] = [
  { id: 'bedroll', name: 'Bedroll', priceCp: 2, weightLb: 5 },
  { id: 'blanket-wool', name: 'Blanket, wool', priceCp: 5, weightLb: 3 },
  { id: 'whetstone', name: 'Whetstone', priceCp: 1, weightLb: 1 },
  { id: 'cooking-pot', name: 'Cooking pot', priceCp: 3, weightLb: 4 },
  { id: 'rations-trail', name: 'Rations, trail (one day)', priceCp: 5, weightLb: 1 },
  { id: 'fishing-tackle', name: 'Fishing tackle', priceCp: 10, weightLb: 2 },
  { id: 'fishing-net', name: 'Fishing net', priceCp: 40, weightLb: 5 },
  { id: 'tent-one-man', name: 'Tent, one man', priceCp: 80, weightLb: 20 },
  { id: 'tent-pavilion', name: 'Tent, pavilion (four)', priceCp: 300, weightLb: 60 },
];

export const ROPE_IRON_CLIMBING: SimpleItem[] = [
  { id: 'piton', name: 'Piton', priceCp: 1, weightLb: 0.5 },
  { id: 'hammer', name: 'Hammer', priceCp: 5, weightLb: 2 },
  { id: 'ladder-10ft', name: "Ladder, 10'", priceCp: 5, weightLb: 20 },
  { id: 'grappling-hook', name: 'Grappling hook', priceCp: 8, weightLb: 4 },
  { id: 'rope-hemp', name: "Rope, hemp (50')", priceCp: 10, weightLb: 10 },
  { id: 'caltrops', name: 'Caltrops (bag)', priceCp: 10, weightLb: 2 },
  { id: 'crowbar', name: 'Crowbar', priceCp: 20, weightLb: 5 },
  { id: 'shovel', name: 'Shovel', priceCp: 20, weightLb: 8 },
  { id: 'chain-10ft', name: "Chain, 10'", priceCp: 30, weightLb: 10 },
  { id: 'miners-pick', name: "Miner's pick", priceCp: 30, weightLb: 10 },
  { id: 'climbers-kit', name: "Climber's kit", priceCp: 80, weightLb: 5 },
  { id: 'rope-silk', name: "Rope, silk (50')", priceCp: 100, weightLb: 5 },
  { id: 'manacles', name: 'Manacles', priceCp: 150, weightLb: 2 },
];

export const TOOLS_AND_IMPLEMENTS: SimpleItem[] = [
  { id: 'chalk', name: 'Chalk', priceCp: 1, weightLb: null },
  { id: 'soap', name: 'Soap', priceCp: 1, weightLb: null },
  { id: 'sealing-wax', name: 'Sealing wax', priceCp: 1, weightLb: null },
  { id: 'quill', name: 'Quill', priceCp: 1, weightLb: null },
  { id: 'parchment', name: 'Parchment (sheet)', priceCp: 2, weightLb: null },
  { id: 'paper', name: 'Paper (sheet)', priceCp: 4, weightLb: null },
  { id: 'whistle', name: 'Whistle', priceCp: 5, weightLb: null },
  { id: 'sewing-needle', name: 'Sewing needle', priceCp: 5, weightLb: null },
  { id: 'bell', name: 'Bell', priceCp: 10, weightLb: null },
  { id: 'signal-horn', name: 'Signal horn', priceCp: 10, weightLb: 2 },
  { id: 'lock-simple', name: 'Lock, simple', priceCp: 20, weightLb: 1 },
  { id: 'merchants-scale', name: "Merchant's scale", priceCp: 20, weightLb: 1 },
  { id: 'lock-good', name: 'Lock, good', priceCp: 40, weightLb: 1 },
  { id: 'artisans-tools', name: "Artisan's tools", priceCp: 50, weightLb: 5, choice: { key: 'speciality', label: 'Craft', options: CRAFTS, other: true } },
  { id: 'signet-ring', name: 'Signet ring', priceCp: 50, weightLb: null },
  { id: 'ink', name: 'Ink (1 oz)', priceCp: 80, weightLb: null },
  { id: 'lock-superior', name: 'Lock, superior', priceCp: 80, weightLb: 1 },
  { id: 'magnifying-glass', name: 'Magnifying glass', priceCp: 100, weightLb: null },
  { id: 'mirror-steel', name: 'Mirror, small steel', priceCp: 100, weightLb: 0.5 },
  { id: 'hourglass', name: 'Hourglass', priceCp: 250, weightLb: 1 },
  { id: 'thieves-tools', name: "Thieves' tools", priceCp: 300, weightLb: 1 },
  { id: 'spyglass', name: 'Spyglass', priceCp: 1500, weightLb: 1 },
];

export const CLOTHING: SimpleItem[] = [
  { id: 'hat', name: 'Hat', priceCp: 2, weightLb: null },
  { id: 'cloak-wool', name: 'Cloak, wool', priceCp: 5, weightLb: 2 },
  { id: 'common-outfit', name: 'Common outfit', priceCp: 10, weightLb: 3 },
  { id: 'travellers-outfit', name: "Traveller's outfit", priceCp: 10, weightLb: 5 },
  { id: 'boots-sturdy', name: 'Boots, sturdy', priceCp: 10, weightLb: 2 },
  { id: 'oilskin-cloak', name: 'Oilskin cloak', priceCp: 20, weightLb: 3 },
  { id: 'scholars-robes', name: "Scholar's robes", priceCp: 50, weightLb: 6 },
  { id: 'clerics-vestments', name: "Cleric's vestments", priceCp: 50, weightLb: 6 },
  { id: 'cold-weather-outfit', name: 'Cold-weather outfit', priceCp: 80, weightLb: 7 },
  { id: 'courtiers-outfit', name: "Courtier's outfit", priceCp: 300, weightLb: 6 },
  { id: 'nobles-outfit', name: "Noble's outfit", priceCp: 750, weightLb: 10 },
];

// ── Starting clothes ─────────────────────────────────────────────
// Every character dresses free at creation: one outfit from the drop-down,
// the base pair open to all, the Class (and a few Subclasses) opening its
// own. Ids reference CLOTHING; a wrong id fails the test suite, not the
// player.

export const STARTING_CLOTHES: {
  /** Open to every character. */
  base: string[];
  /** Extra options a Class opens (classes.ts ids). */
  byClass: Record<string, string[]>;
  /** Extra options a Subclass opens (classes.ts ids). */
  bySubclass: Record<string, string[]>;
} = {
  base: ['common-outfit', 'travellers-outfit'],
  byClass: {
    soldier: ['cold-weather-outfit'],
    friar: ['clerics-vestments'],
    scholar: ['scholars-robes'],
    occultist: ['scholars-robes'],
    naturalist: ['cold-weather-outfit'],
  },
  bySubclass: {
    commander: ['courtiers-outfit'],
    charlatan: ['courtiers-outfit'],
  },
};

/** The outfits a build may start in: base + Class + Subclass options. */
export function startingClothesFor(classId?: string, subclassId?: string): string[] {
  return [
    ...STARTING_CLOTHES.base,
    ...(classId ? (STARTING_CLOTHES.byClass[classId] ?? []) : []),
    ...(subclassId ? (STARTING_CLOTHES.bySubclass[subclassId] ?? []) : []),
  ].filter((id, i, xs) => xs.indexOf(id) === i);
}

export const FAITH_AND_SUPERSTITION: SimpleItem[] = [
  { id: 'votive-candle', name: 'Votive candle', priceCp: 1, weightLb: null },
  { id: 'incense-stick', name: 'Incense (stick)', priceCp: 2, weightLb: null },
  { id: 'saints-medal-wood', name: "Saint's medal, wooden", priceCp: 1, weightLb: null, choice: { key: 'saint', label: 'Saint', options: SAINT_NAMES, other: true } },
  { id: 'saints-medal-tin', name: "Saint's medal, tin", priceCp: 2, weightLb: null, choice: { key: 'saint', label: 'Saint', options: SAINT_NAMES, other: true } },
  { id: 'pilgrims-badge', name: "Pilgrim's badge", priceCp: 3, weightLb: null },
  { id: 'prayer-beads', name: 'Prayer beads', priceCp: 5, weightLb: null },
  { id: 'saints-medal-silver', name: "Saint's medal, silver", priceCp: 50, weightLb: null, choice: { key: 'saint', label: 'Saint', options: SAINT_NAMES, other: true } },
  { id: 'reliquary-empty', name: 'Reliquary, empty', priceCp: 200, weightLb: 2 },
];

// ── Armour & shields ─────────────────────────────────────────────

export type ArmourTier = 'Light' | 'Medium' | 'Heavy';
export const ARMOUR_TIER_AC: Record<ArmourTier, number> = { Light: 1, Medium: 2, Heavy: 3 };

export interface Armour {
  id: string;
  name: string;
  tier: ArmourTier;
  dr: number;
  drNote?: string;
  trait: string | null;
  speedPenaltyFt: number;
  stealthPenalty: number;
  strReq: number | null; // as a modifier: +1, +2
  priceCp: Cp;
  weightLb: number;
}

export const ARMOURS: Armour[] = [
  { id: 'leather', name: 'Leather', tier: 'Light', dr: 0, trait: null, speedPenaltyFt: 0, stealthPenalty: 0, strReq: null, priceCp: 100, weightLb: 15 },
  { id: 'studded-leather', name: 'Studded Leather', tier: 'Light', dr: 1, trait: null, speedPenaltyFt: 0, stealthPenalty: 0, strReq: null, priceCp: 250, weightLb: 20 },
  { id: 'hide', name: 'Hide', tier: 'Light', dr: 1, trait: 'Resist Cold 1', speedPenaltyFt: 0, stealthPenalty: 0, strReq: null, priceCp: 150, weightLb: 25 },
  { id: 'chain-shirt', name: 'Chain Shirt', tier: 'Medium', dr: 1, trait: null, speedPenaltyFt: 5, stealthPenalty: 1, strReq: null, priceCp: 500, weightLb: 25 },
  { id: 'scale-ring-mail', name: 'Scale / Ring Mail', tier: 'Medium', dr: 2, trait: null, speedPenaltyFt: 5, stealthPenalty: 1, strReq: null, priceCp: 1000, weightLb: 30 },
  { id: 'breastplate', name: 'Breastplate', tier: 'Medium', dr: 2, trait: 'Mobility', speedPenaltyFt: 0, stealthPenalty: 1, strReq: null, priceCp: 2000, weightLb: 20 },
  { id: 'chain-mail', name: 'Chain Mail', tier: 'Heavy', dr: 2, trait: null, speedPenaltyFt: 10, stealthPenalty: 2, strReq: 1, priceCp: 1500, weightLb: 40 },
  { id: 'splint-banded-mail', name: 'Splint / Banded Mail', tier: 'Heavy', dr: 3, trait: null, speedPenaltyFt: 10, stealthPenalty: 2, strReq: 2, priceCp: 2000, weightLb: 45 },
  { id: 'full-plate', name: 'Full Plate', tier: 'Heavy', dr: 3, drNote: '4 vs Area-Effect', trait: 'sealed vs blasts', speedPenaltyFt: 10, stealthPenalty: 2, strReq: 2, priceCp: 15000, weightLb: 50 },
];

export interface Shield {
  id: string;
  name: string;
  proficiency: 'Light Shield' | 'Heavy Shield';
  ac: number;
  dr: number;
  /** The shield's own damage die — what a bash deals. Notation: 1[S]. */
  damage: string;
  type: DamageKind;
  speedPenaltyFt: number;
  priceCp: Cp;
  weightLb: number;
}

export const SHIELDS: Shield[] = [
  { id: 'buckler', name: 'Buckler', proficiency: 'Light Shield', ac: 1, dr: 0, damage: '1d3', type: 'Blunt', speedPenaltyFt: 0, priceCp: 50, weightLb: 3 },
  { id: 'standard-shield', name: 'Standard Shield', proficiency: 'Light Shield', ac: 1, dr: 1, damage: '1d4', type: 'Blunt', speedPenaltyFt: 0, priceCp: 120, weightLb: 6 },
  { id: 'heater-kite-round', name: 'Heater / Kite / Round', proficiency: 'Heavy Shield', ac: 2, dr: 1, damage: '1d4', type: 'Blunt', speedPenaltyFt: 5, priceCp: 300, weightLb: 12 },
  { id: 'tower-shield', name: 'Tower Shield', proficiency: 'Heavy Shield', ac: 2, dr: 2, damage: '1d4', type: 'Blunt', speedPenaltyFt: 10, priceCp: 600, weightLb: 25 },
];

// ── Masterwork ───────────────────────────────────────────────────

export interface MasterworkGrade {
  id: string;
  item: string;
  benefit: string;
  surchargeCp: Cp;
  days: number;
}

export const MASTERWORK: MasterworkGrade[] = [
  { id: 'mw-shield', item: 'Shield', benefit: '−5 lb', surchargeCp: 500, days: 5 },
  { id: 'mw-tools', item: 'Tools', benefit: '+1 to checks made with them', surchargeCp: 1000, days: 10 },
  { id: 'mw-weapon', item: 'Weapon', benefit: '+1 to attack', surchargeCp: 2000, days: 20 },
  { id: 'mw-armour', item: 'Armour', benefit: "−10 lb, and one drawback eased (Stealth by 1, or Speed by 5')", surchargeCp: 3000, days: 30 },
];

// ── Lodging, travel & hire ───────────────────────────────────────

export const FOOD_AND_DRINK: SimpleItem[] = [
  { id: 'bread-loaf', name: 'Bread, loaf', priceCp: 1, weightLb: null },
  { id: 'cheese-wedge', name: 'Cheese, wedge', priceCp: 1, weightLb: null },
  { id: 'ale-mug', name: 'Ale, mug', priceCp: 1, weightLb: null },
  { id: 'meat-joint', name: 'Meat, joint', priceCp: 2, weightLb: null },
  { id: 'wine-common', name: 'Wine, common (pitcher)', priceCp: 2, weightLb: null },
  { id: 'ale-gallon', name: 'Ale, gallon', priceCp: 5, weightLb: null },
  { id: 'wine-fine', name: 'Wine, fine (bottle)', priceCp: 10, weightLb: null },
  { id: 'meal-poor', name: 'Meal, poor', priceCp: 1, weightLb: null },
  { id: 'meal-common', name: 'Meal, common', priceCp: 2, weightLb: null },
  { id: 'meal-good', name: 'Meal, good', priceCp: 5, weightLb: null },
  { id: 'banquet', name: 'Banquet', priceCp: 10, weightLb: null, unit: 'per head' },
];

export const LODGING: SimpleItem[] = [
  { id: 'common-room-floor', name: 'Space on the common-room floor', priceCp: 2, weightLb: null, unit: 'per night' },
  { id: 'common-room-bed', name: 'A bed in the common room', priceCp: 4, weightLb: null, unit: 'per night' },
  { id: 'private-room-modest', name: 'Private room, modest', priceCp: 8, weightLb: null, unit: 'per night' },
  { id: 'stabling', name: 'Stabling (per animal)', priceCp: 5, weightLb: null, unit: 'per night' },
  { id: 'bath', name: 'Bath', priceCp: 1, weightLb: null },
  { id: 'laundry', name: 'Laundry', priceCp: 1, weightLb: null },
  { id: 'private-room-good', name: 'Private room, good', priceCp: 20, weightLb: null, unit: 'per night' },
  { id: 'fine-lodging', name: 'Fine lodging', priceCp: 50, weightLb: null, unit: 'per night' },
];

export const MOUNTS_AND_VEHICLES: SimpleItem[] = [
  { id: 'feed', name: 'Feed (per day)', priceCp: 5, weightLb: 10, unit: 'per day' },
  { id: 'bit-and-bridle', name: 'Bit and bridle', priceCp: 20, weightLb: 1 },
  { id: 'pack-saddle', name: 'Pack saddle', priceCp: 50, weightLb: 15 },
  { id: 'mule-or-donkey', name: 'Mule or donkey', priceCp: 80, weightLb: null },
  { id: 'riding-saddle', name: 'Riding saddle', priceCp: 100, weightLb: 25 },
  { id: 'cart', name: 'Cart', priceCp: 150, weightLb: 200 },
  { id: 'military-saddle', name: 'Military saddle', priceCp: 200, weightLb: 30 },
  { id: 'pony', name: 'Pony', priceCp: 300, weightLb: null },
  { id: 'wagon', name: 'Wagon', priceCp: 350, weightLb: 400 },
  { id: 'riding-horse', name: 'Riding horse', priceCp: 750, weightLb: null },
  { id: 'carriage', name: 'Carriage', priceCp: 1000, weightLb: null },
  { id: 'warhorse-light', name: 'Warhorse, light', priceCp: 1500, weightLb: null },
  { id: 'draught-horse', name: 'Draught horse', priceCp: 2000, weightLb: null },
  { id: 'rowboat', name: 'Rowboat', priceCp: 500, weightLb: null },
  { id: 'warhorse-heavy', name: 'Warhorse, heavy', priceCp: 4000, weightLb: null },
];

export const PASSAGE: SimpleItem[] = [
  { id: 'passage-coach', name: 'By coach', priceCp: 1, weightLb: null, unit: 'per mile' },
  { id: 'passage-barge', name: 'By river barge', priceCp: 1, weightLb: null, unit: 'per 2 miles' },
  { id: 'passage-ship', name: 'By ship, coastal', priceCp: 10, weightLb: null, unit: 'per day' },
];

export const HIRE: SimpleItem[] = [
  { id: 'porter', name: 'Porter', priceCp: 10, weightLb: null, unit: 'per day' },
  { id: 'messenger', name: 'Messenger', priceCp: 2, weightLb: null, unit: 'per mile' },
  { id: 'untrained-labourer', name: 'Untrained labourer', priceCp: 10, weightLb: null, unit: 'per day' },
  { id: 'guide', name: 'Guide', priceCp: 30, weightLb: null, unit: 'per day' },
  { id: 'guard', name: 'Guard or sword-for-hire', priceCp: 30, weightLb: null, unit: 'per day' },
  { id: 'scribe', name: 'Scribe', priceCp: 30, weightLb: null, unit: 'per day' },
  { id: 'teamster', name: 'Teamster (with wagon)', priceCp: 50, weightLb: null, unit: 'per day' },
  { id: 'barrister', name: 'Barrister', priceCp: 50, weightLb: null, unit: 'per day' },
  { id: 'physician', name: 'Physician', priceCp: 50, weightLb: null, unit: 'per visit' },
  { id: 'master-craftsman', name: 'Master craftsman', priceCp: null, weightLb: null, unit: 'per day', priceText: '8–10 sp' },
];

// ── Medical & ministration kits ──────────────────────────────────

export interface KitItem extends SimpleItem {
  /** Supply granted per purchase (the Supplies line); kits themselves are empty. */
  supply: number | null;
}

// The kits are bags: each is a Container (×1 — a working bag, not a
// packed load) so its Supplies can live inside it.
export const KITS: KitItem[] = [
  { id: 'healers-kit', name: "Healer's Kit (empty — tools & bag)", priceCp: 100, weightLb: 3, supply: null, coefficient: 0.9, capacityLb: 3 },
  { id: 'friars-kit', name: "Friar's Kit (empty — oils, incense & implements)", priceCp: 100, weightLb: 3, supply: null, coefficient: 0.9, capacityLb: 3 },
  { id: 'herbalists-bag', name: "Herbalist's Bag (empty — knives, mortar & pouches)", priceCp: 100, weightLb: 3, supply: null, coefficient: 0.9, capacityLb: 3 },
  { id: 'offerings-bag', name: 'Offerings Bag (empty — pouches, knots & charms)', priceCp: 100, weightLb: 3, supply: null, coefficient: 0.9, capacityLb: 3 },
  { id: 'supplies', name: 'Supplies (per 10)', priceCp: 10, weightLb: 1, supply: 10, choice: { key: 'kit', label: 'Kit', options: ["Healer's Kit", "Friar's Kit", "Herbalist's Bag", 'Offerings Bag'] } },
];

/** A Container's Load coefficient — undefined for non-containers. The
 * kits count: each is a bag that holds its Supplies. */
export function containerCoefficient(itemId: string): number | undefined {
  return (
    CONTAINERS.find((c) => c.id === itemId)?.coefficient ??
    KITS.find((k) => k.id === itemId)?.coefficient
  );
}

/** A Container's capacity in lb — undefined for non-containers. */
export function containerCapacityLb(itemId: string): number | undefined {
  return (
    CONTAINERS.find((c) => c.id === itemId)?.capacityLb ??
    KITS.find((k) => k.id === itemId)?.capacityLb
  );
}

// ── The whole catalogue, flat ────────────────────────────────────

export interface CatalogueEntry {
  id: string;
  name: string;
  priceCp: Cp | null;
  weightLb: number | null;
  section: string;
  choice?: ItemChoice;
}

const flat = (section: string, items: { id: string; name: string; priceCp: Cp | null; weightLb: number | null; choice?: ItemChoice }[]): CatalogueEntry[] =>
  items.map((i) => ({ id: i.id, name: i.name, priceCp: i.priceCp, weightLb: i.weightLb, section, choice: i.choice }));

export const CATALOGUE: CatalogueEntry[] = [
  ...flat('Melee Weapons', MELEE_WEAPONS),
  ...flat('Ranged Weapons', RANGED_WEAPONS),
  ...flat('Ammunition', AMMUNITION),
  ...flat('Armour', ARMOURS),
  ...flat('Shields', SHIELDS),
  ...flat('Packs & Containers', CONTAINERS),
  ...flat('Light & Fire', LIGHT_AND_FIRE),
  ...flat('Camp & Trail', CAMP_AND_TRAIL),
  ...flat('Rope, Iron & Climbing', ROPE_IRON_CLIMBING),
  ...flat('Tools & Implements', TOOLS_AND_IMPLEMENTS),
  ...flat('Clothing', CLOTHING),
  ...flat('Faith & Superstition', FAITH_AND_SUPERSTITION),
  ...flat('Food & Drink', FOOD_AND_DRINK),
  ...flat('Lodging', LODGING),
  ...flat('Mounts & Vehicles', MOUNTS_AND_VEHICLES),
  ...flat('Passage', PASSAGE),
  ...flat('Hire', HIRE),
  ...flat('Kits', KITS),
];
