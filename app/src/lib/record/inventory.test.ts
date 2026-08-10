// Wealth, inventory, and Markets in the record engine (builder spec §11,
// mechanics/markets.md): opening coin from the Starting Gear category, the
// atomic Basket transaction, the creation no-sell rule, the one-Session
// lock on rolled Starting Gear, Market access via Feats, and the Commerce
// Feat Ladder's percentages.

import { describe, expect, it } from 'vitest';
import { GEAR, STARTING_COIN } from '../gear';
import {
  MARKETS,
  WALDHEIM_MARKET,
  accessibleMarkets,
  buyPriceCp,
  listedMarkets,
  marketById,
  sellPriceCp,
} from '../markets';
import type { RecordEvent } from './events';
import { replay } from './replay';

let seq = 0;
function ev<T extends RecordEvent['type']>(
  type: T,
  fields: Omit<Extract<RecordEvent, { type: T }>, 'id' | 'at' | 'source' | 'type'>,
): RecordEvent {
  seq += 1;
  return {
    id: `e${seq}`,
    at: '2026-08-10T12:00:00Z',
    source: 'player',
    type,
    ...fields,
  } as RecordEvent;
}

const badGear = GEAR.find((g) => g.category === 'bad')!;
const goodGear = GEAR.find((g) => g.category === 'good')!;

const creation = (gear = badGear) => [
  ev('class-chosen', { classId: 'soldier' }),
  ev('subclass-chosen', { subclassId: 'vanguard' }),
  ev('quirk-rolled', {
    quirkName: 'Q', slots: {}, rerollsUsed: 0,
    gearId: gear.id, gearName: gear.name, gearSlots: {},
  }),
];

const crystallized = (gear = badGear) => [...creation(gear), ev('crystallized', {})];

describe('the Markets roster', () => {
  it('holds the named Waldheim family plus the two Regional Markets', () => {
    expect(MARKETS.map((m) => m.id)).toEqual([
      'waldheim', 'imperial-square', 'anselms-buttery', 'ignatius-archive',
      'theobalds-row', 'astronomers', 'green-market', 'blacks-road',
      'dunstans-magazine', 'ulrics-exchange',
    ]);
  });

  it('the Waldheim Market buys anything it sells at 25% of list', () => {
    for (const line of WALDHEIM_MARKET.sells) {
      const buy = WALDHEIM_MARKET.buys.find((b) => b.itemId === line.itemId)!;
      expect(buy.priceCp).toBe(line.priceCp * 0.25); // fraction kept; rounds at query
    }
  });

  it('does not stock board and services', () => {
    expect(WALDHEIM_MARKET.sells.some((l) => l.itemId === 'fine-lodging')).toBe(false);
    expect(WALDHEIM_MARKET.sells.some((l) => l.itemId === 'porter')).toBe(false);
    expect(WALDHEIM_MARKET.sells.some((l) => l.itemId === 'rations-trail')).toBe(true);
  });

  it('access: open markets for everyone, Feat markets for Feat owners', () => {
    expect(accessibleMarkets([]).map((m) => m.id)).toEqual(['waldheim', 'imperial-square']);
    expect(accessibleMarkets(['market-theobalds-row']).map((m) => m.id)).toContain('theobalds-row');
  });

  it('listing: the Waldheim family always shows; Regional Markets only once open', () => {
    const anon = listedMarkets([]).map((m) => m.id);
    expect(anon).toContain('theobalds-row'); // locked but listed
    expect(anon).not.toContain('dunstans-magazine');
    expect(anon).not.toContain('ulrics-exchange');
    expect(listedMarkets(['market-dunstans-magazine']).map((m) => m.id)).toContain('dunstans-magazine');
  });

  it("St. Dunstan's Magazine sells firearms at half list", () => {
    const magazine = marketById('dunstans-magazine')!;
    expect(buyPriceCp(magazine, 'musket')).toBe(1000);
    expect(buyPriceCp(magazine, 'powder-and-shot')).toBe(15);
    expect(buyPriceCp(magazine, 'longsword')).toBeUndefined();
  });

  it('the Commerce Feat Ladder discounts buys and lifts sells', () => {
    expect(buyPriceCp(WALDHEIM_MARKET, 'longsword', 0)).toBe(150);
    expect(buyPriceCp(WALDHEIM_MARKET, 'longsword', 1)).toBe(135);
    expect(buyPriceCp(WALDHEIM_MARKET, 'longsword', 2)).toBe(120);
    expect(sellPriceCp(WALDHEIM_MARKET, 'longsword', 0)).toBe(38); // 37.5 → 38
    expect(sellPriceCp(WALDHEIM_MARKET, 'longsword', 3)).toBe(41); // 41.25 → 41
  });
});

describe('opening coin and Starting Gear', () => {
  it('the Gear category fixes the opening balance, in cp', () => {
    expect(replay(creation(badGear)).state.wealthCp).toBe(STARTING_COIN.bad * 10);
    expect(replay(creation(goodGear)).state.wealthCp).toBe(STARTING_COIN.good * 10);
  });

  it('the rolled Gear becomes an inventory instance', () => {
    const { state } = replay(creation());
    const inst = state.inventory.find((i) => i.origin === 'starting-gear')!;
    expect(inst.qty).toBe(1);
    expect(inst.location).toBe('carried');
  });

  it('a reroll replaces the instance and re-fixes the coin', () => {
    const { state } = replay([
      ...creation(badGear),
      ev('quirk-rolled', {
        quirkName: 'Q2', slots: {}, rerollsUsed: 1,
        gearId: goodGear.id, gearName: goodGear.name, gearSlots: {},
      }),
    ]);
    expect(state.inventory.filter((i) => i.origin === 'starting-gear')).toHaveLength(1);
    expect(state.wealthCp).toBe(STARTING_COIN.good * 10);
  });
});

describe('the Basket transaction', () => {
  it('buys at list, stacks identical items, and adjusts the coin', () => {
    const { state, flags } = replay([
      ...creation(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'waldheim', itemId: 'torch', qty: 5 },
        { direction: 'buy', marketId: 'waldheim', itemId: 'longsword', qty: 1 },
        { direction: 'buy', marketId: 'waldheim', itemId: 'torch', qty: 5 },
      ] }),
    ]);
    expect(flags).toEqual([]);
    const torches = state.inventory.find((i) => i.itemId === 'torch')!;
    expect(torches.qty).toBe(10);
    expect(state.wealthCp).toBe(2000 - 10 - 150);
  });

  it('no coin exists before the Starting Gear roll', () => {
    const { flags } = replay([
      ev('class-chosen', { classId: 'soldier' }),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'waldheim', itemId: 'torch', qty: 1 }] }),
    ]);
    expect(flags.some((f) => f.code === 'wrong-order')).toBe(true);
  });

  it('the Basket is atomic — one bad line refuses the whole trip', () => {
    const { state, flags } = replay([
      ...creation(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'waldheim', itemId: 'torch', qty: 1 },
        { direction: 'buy', marketId: 'waldheim', itemId: 'not-a-thing', qty: 1 },
      ] }),
    ]);
    expect(flags).toHaveLength(1);
    expect(state.inventory.some((i) => i.itemId === 'torch')).toBe(false);
    expect(state.wealthCp).toBe(2000);
  });

  it('a trip past the purse is refused whole', () => {
    const { state, flags } = replay([
      ...creation(goodGear), // 100 sp
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'waldheim', itemId: 'full-plate', qty: 1 }] }),
    ]);
    expect(flags.some((f) => f.code === 'insufficient-funds')).toBe(true);
    expect(state.wealthCp).toBe(1000);
  });

  it('a Feat-gated Market refuses strangers and serves Feat owners at its prices', () => {
    const denied = replay([
      ...creation(),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'dunstans-magazine', itemId: 'musket', qty: 1 }] }),
    ]);
    expect(denied.flags.some((f) => f.code === 'no-access')).toBe(true);

    const served = replay([
      ...creation(),
      ev('feat-bought', { featId: 'market-dunstans-magazine' }),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'dunstans-magazine', itemId: 'musket', qty: 1 }] }),
    ]);
    expect(served.flags).toEqual([]);
    expect(served.state.wealthCp).toBe(2000 - 1000); // half of 200 sp list
  });

  it('no selling during creation', () => {
    const { flags } = replay([
      ...creation(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'waldheim', itemId: 'longsword', qty: 1 },
      ] }),
      ev('transaction', { lines: [
        { direction: 'sell', marketId: 'waldheim', instanceId: 'item:longsword', qty: 1 },
      ] }),
    ]);
    expect(flags.some((f) => f.code === 'creation-only')).toBe(true);
  });

  it('after creation the Waldheim Market pays its 25%', () => {
    const { state, flags } = replay([
      ...crystallized(),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'waldheim', itemId: 'longsword', qty: 1 }] }),
      ev('transaction', { lines: [{ direction: 'sell', marketId: 'waldheim', instanceId: 'item:longsword', qty: 1 }] }),
    ]);
    expect(flags).toEqual([]);
    expect(state.inventory.some((i) => i.itemId === 'longsword')).toBe(false);
    expect(state.wealthCp).toBe(2000 - 150 + 38);
  });

  it('selling more than owned is refused, counting within the trip', () => {
    const { flags } = replay([
      ...crystallized(),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'waldheim', itemId: 'torch', qty: 2 }] }),
      ev('transaction', { lines: [
        { direction: 'sell', marketId: 'waldheim', instanceId: 'item:torch', qty: 2 },
        { direction: 'sell', marketId: 'waldheim', instanceId: 'item:torch', qty: 1 },
      ] }),
    ]);
    expect(flags.some((f) => f.code === 'over-cap')).toBe(true);
  });

  it('rolled Starting Gear will not sell before a Session — nor after, with no buyer', () => {
    const locked = replay([
      ...crystallized(),
      ev('transaction', { lines: [{ direction: 'sell', marketId: 'waldheim', instanceId: 'starting-gear', qty: 1 }] }),
    ]);
    expect(locked.flags.some((f) => f.message.includes('not sellable yet'))).toBe(true);

    // After a Session the lock lifts — but unique gear has no catalogue id,
    // so no Market buys it (sellability lives on the item).
    const unlocked = replay([
      ...crystallized(),
      ev('session-logged', {}),
      ev('transaction', { lines: [{ direction: 'sell', marketId: 'waldheim', instanceId: 'starting-gear', qty: 1 }] }),
    ]);
    expect(unlocked.flags.some((f) => f.message.includes('will not buy'))).toBe(true);
  });

  it("the Havilah arbitrage: pelts bought at the Exchange sell in Waldheim", () => {
    const { state, flags } = replay([
      ...crystallized(),
      ev('feat-bought', { featId: 'market-ulrics-exchange' }),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'ulrics-exchange', itemId: 'animal-pelts-cured', qty: 1 }] }),
      ev('transaction', { lines: [{ direction: 'sell', marketId: 'waldheim', instanceId: 'item:animal-pelts-cured', qty: 1 }] }),
    ]);
    expect(flags).toEqual([]);
    expect(state.wealthCp).toBe(2000 - 200 + 300);
  });

  it('stock certificates are near-liquid at home and appreciate southward', () => {
    const exchange = marketById('ulrics-exchange')!;
    expect(buyPriceCp(exchange, 'stock-bank-ulric')).toBe(1000);
    expect(sellPriceCp(exchange, 'stock-bank-ulric')).toBe(990);
    expect(sellPriceCp(WALDHEIM_MARKET, 'stock-bank-ulric')).toBe(1100);
  });
});

describe('grants, moves, and Sessions', () => {
  it('a granted item lands carried, catalogue-named where backed', () => {
    const { state } = replay([
      ...crystallized(),
      ev('item-granted', { itemId: 'longsword', qty: 1 }),
      ev('item-granted', { name: "a saint's carved femur" }),
    ]);
    const sword = state.inventory.find((i) => i.itemId === 'longsword')!;
    expect(sword.name).toBe('Longsword');
    expect(sword.origin).toBe('grant');
    expect(state.inventory.some((i) => i.name === "a saint's carved femur")).toBe(true);
  });

  it('items move between locations', () => {
    const { state, flags } = replay([
      ...crystallized(),
      ev('item-granted', { itemId: 'longsword' }),
      ev('item-moved', { instanceId: 'e' + seq, location: 'home' }),
    ]);
    expect(flags).toEqual([]);
    expect(state.inventory.find((i) => i.itemId === 'longsword')!.location).toBe('home');
  });

  it('Sessions count', () => {
    const { state } = replay([...crystallized(), ev('session-logged', {}), ev('session-logged', {})]);
    expect(state.sessions).toBe(2);
  });
});
