// Markets as typed rules data (mechanics/markets.md, builder spec §11).
//
// A Market is two lists: what it sells (item ids with prices) and what it
// buys (item ids with offered prices), plus a purse and an access rule.
// The Waldheim Market sells the standard catalogue at list and buys
// anything it sells at 25%; the specialty markets are Feat-gated stubs
// awaiting their catalogues; the Regional Markets chain origin → Feat →
// Market. The Black Faith Market is not in this file: fully hidden means
// not in the data the shop reads.
//
// Market lines carry cp values that may hold fractions (the 25% buyback
// of an odd list price). Fractions stay in the math; the FINAL price —
// after Commerce Feat percentages — rounds to the nearest cp, in
// buyPriceCp/sellPriceCp. Nothing displays a Market line raw.

import { CATALOGUE, type Cp } from './equipment';

export type MarketAccess =
  | { kind: 'open' }
  | { kind: 'feat'; featId: string };

export interface MarketLine {
  itemId: string;
  priceCp: Cp;
}

export interface Market {
  /** Permanent stable id — never changes once published. */
  id: string;
  name: string;
  location: string;
  /** The display's third element: "Market Name — Location — Market Type". */
  marketType: string;
  access: MarketAccess;
  sells: MarketLine[];
  buys: MarketLine[];
  /** null = bottomless. */
  purseCp: Cp | null;
}

// ── Trade goods ──────────────────────────────────────────────────
// Items that exist only through Markets (St. Ulric's Exchange). They carry
// per-market prices — the concrete form of "sellability lives on the item".

export interface TradeGood {
  id: string;
  name: string;
  weightLb: number | null;
}

export const TRADE_GOODS: TradeGood[] = [
  { id: 'animal-pelts-cured', name: 'Animal Pelts, Cured', weightLb: 10 },
  { id: 'stock-havilah', name: 'Free City of Havilah Ownership Stock Certificate', weightLb: null },
  { id: 'stock-bank-ulric', name: 'Bank of St. Ulric, Havilah, Ownership Stock Certificate', weightLb: null },
  { id: 'stock-rampart-mining', name: 'Imperial Rampart Mining Company Stock Certificate', weightLb: null },
];

/** Any purchasable thing: the standard catalogue plus the trade goods. */
export function itemName(itemId: string): string | undefined {
  return (
    CATALOGUE.find((e) => e.id === itemId)?.name ??
    TRADE_GOODS.find((t) => t.id === itemId)?.name
  );
}

export function itemWeightLb(itemId: string): number | null {
  const cat = CATALOGUE.find((e) => e.id === itemId);
  if (cat) return cat.weightLb;
  return TRADE_GOODS.find((t) => t.id === itemId)?.weightLb ?? null;
}

// ── The Waldheim Market (the Default Market) ─────────────────────

/** Sections that are services or board, not goods a character carries out
 * of the shop. They stay on the equipment page; the shop does not sell them. */
const UNSTOCKED_SECTIONS = ['Lodging', 'Passage', 'Hire'];

const stocked = CATALOGUE.filter(
  (e) => e.priceCp !== null && !UNSTOCKED_SECTIONS.includes(e.section),
);

/** The Waldheim Market buys anything it sells at 25% of list — and,
 * bespoke, the Havilah trade goods at stated prices. */
export const WALDHEIM_MARKET: Market = {
  id: 'waldheim',
  name: 'Waldheim Market',
  location: "Sever's Cross",
  marketType: 'the Default Market',
  access: { kind: 'open' },
  sells: stocked.map((e) => ({ itemId: e.id, priceCp: e.priceCp! })),
  buys: [
    ...stocked.map((e) => ({ itemId: e.id, priceCp: e.priceCp! * 0.25 })),
    { itemId: 'animal-pelts-cured', priceCp: 300 },
    { itemId: 'stock-havilah', priceCp: 550 },
    { itemId: 'stock-bank-ulric', priceCp: 1100 },
    { itemId: 'stock-rampart-mining', priceCp: 110 },
  ],
  purseCp: null,
};

// ── The specialty markets (catalogues to be authored) ────────────

const specialty = (
  id: string,
  name: string,
  location: string,
  marketType: string,
  featId: string,
): Market => ({
  id, name, location, marketType,
  access: { kind: 'feat', featId },
  sells: [],
  buys: [],
  purseCp: null,
});

export const MARKETS: Market[] = [
  WALDHEIM_MARKET,
  {
    id: 'imperial-square',
    name: 'Imperial Square Market',
    location: "Saints' Island",
    marketType: 'Saintly Market',
    access: { kind: 'open' },
    sells: [], // catalogue to be authored (implements and goods of the faithful)
    buys: [],
    purseCp: null,
  },
  specialty('anselms-buttery', "Anselm's Buttery", "Lord's University", 'New Magic Market', 'market-anselms-buttery'),
  specialty('ignatius-archive', 'St. Ignatius College Archive', 'Elder Isle', 'Elder Magic Market', 'market-ignatius-archive'),
  specialty('theobalds-row', "Theobald's Row", "Sebald's Isle", 'Occult Market', 'market-theobalds-row'),
  specialty('astronomers', 'Society of Astronomers', 'Newton Hill', 'Market of the Outside', 'market-astronomers'),
  specialty('green-market', 'The Green Market', 'The Green', 'Old Magic Market', 'market-green'),
  specialty('blacks-road', "Black's Road Market", "Black's Road", 'Black Market', 'market-blacks-road'),
  {
    id: 'dunstans-magazine',
    name: "St. Dunstan's Magazine",
    location: 'Abbey of the Artillery, Lysander',
    marketType: 'Firearms Market',
    access: { kind: 'feat', featId: 'market-dunstans-magazine' },
    // Everything firearms-related at 50% of list: the Pistols and Rifles
    // groups, grenades, powder and shot, powder horns.
    sells: CATALOGUE.filter((e) =>
      ['flintlock-pistol', 'horse-pistol', 'musket', 'long-rifle', 'firebomb',
       'fragmentation-grenade', 'powder-horn', 'powder-and-shot'].includes(e.id),
    ).map((e) => ({ itemId: e.id, priceCp: Math.round(e.priceCp! * 0.5) })),
    buys: [],
    purseCp: null,
  },
  {
    id: 'ulrics-exchange',
    name: "St. Ulric's Exchange",
    location: 'Freehold of Havilah',
    marketType: 'Trade Market',
    access: { kind: 'feat', featId: 'market-ulrics-exchange' },
    sells: [
      { itemId: 'animal-pelts-cured', priceCp: 200 },
      { itemId: 'stock-havilah', priceCp: 500 },
      { itemId: 'stock-bank-ulric', priceCp: 1000 },
      { itemId: 'stock-rampart-mining', priceCp: 100 },
    ],
    buys: [
      { itemId: 'animal-pelts-cured', priceCp: 50 },
      { itemId: 'stock-havilah', priceCp: 490 },
      { itemId: 'stock-bank-ulric', priceCp: 990 },
      { itemId: 'stock-rampart-mining', priceCp: 50 },
    ],
    purseCp: null,
  },
];

export function marketById(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}

/** The Markets a character can shop, given the Feats they own. */
export function accessibleMarkets(ownedFeatIds: string[]): Market[] {
  return MARKETS.filter(
    (m) => m.access.kind === 'open' || ownedFeatIds.includes(m.access.featId),
  );
}

/** The Markets the shop lists. The Waldheim family is always shown (locked
 * ones by title, with the Feat named); Regional Markets appear only once
 * their Feat is owned — no grey rows, discovery lives in the Feat list. */
export function listedMarkets(ownedFeatIds: string[]): Market[] {
  const regional = ['dunstans-magazine', 'ulrics-exchange'];
  return MARKETS.filter(
    (m) =>
      !regional.includes(m.id) ||
      (m.access.kind === 'feat' && ownedFeatIds.includes(m.access.featId)),
  );
}

// ── Pricing with the Commerce Feat Ladder ────────────────────────
// Rank 1: buy 10% off · Rank 2: buy 20% off · Rank 3: sell 10% up.
// Fractions stay in the math; the final price rounds to the nearest cp.

export function buyPriceCp(market: Market, itemId: string, commerceRank = 0): Cp | undefined {
  const line = market.sells.find((l) => l.itemId === itemId);
  if (!line) return undefined;
  const discount = commerceRank >= 2 ? 0.8 : commerceRank >= 1 ? 0.9 : 1;
  return Math.round(line.priceCp * discount);
}

export function sellPriceCp(market: Market, itemId: string, commerceRank = 0): Cp | undefined {
  const line = market.buys.find((l) => l.itemId === itemId);
  if (!line) return undefined;
  const bonus = commerceRank >= 3 ? 1.1 : 1;
  return Math.round(line.priceCp * bonus);
}
