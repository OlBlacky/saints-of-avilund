// Wealth, inventory, and Markets in the record engine (builder spec §11,
// mechanics/markets.md): opening coin from the Starting Gear category, the
// atomic Basket transaction, the creation no-sell rule, the first-Session
// sell lock (a New character sells nothing), Market access via Feats, and
// the Commerce Feat Ladder's percentages.

import { describe, expect, it } from 'vitest';
import { GEAR, STARTING_COIN } from '../gear';
import {
  MARKETS,
  WALDHEIM_MARKET,
  accessibleMarkets,
  bestBuy,
  buyPriceCp,
  itemWeightLb,
  listedMarkets,
  marketById,
  sellPriceCp,
} from '../markets';
import type { RecordEvent } from './events';
import { derive } from './derive';
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

// The Place of Origin rides along because the Regional Market Feats are gated
// on it — a stranger to Havilah never sees the Exchange.
const creation = (gear = badGear, place = 'Waldheim') => [
  ev('class-chosen', { classId: 'soldier' }),
  ev('subclass-chosen', { subclassId: 'vanguard' }),
  ev('origin-chosen', { place }),
  ev('quirk-rolled', {
    quirkName: 'Q', slots: {}, rerollsUsed: 0,
    gearId: gear.id, gearName: gear.name, gearSlots: {},
  }),
];

const crystallized = (gear = badGear, place = 'Waldheim') => [
  ...creation(gear, place),
  ev('crystallized', {}),
];

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

  it('the religious shelf lives at Imperial Square, not Sever\'s Cross', () => {
    const imperial = marketById('imperial-square')!;
    for (const id of ['votive-candle', 'saints-medal-tin', 'reliquary-empty', 'clerics-vestments', 'friars-kit']) {
      expect(WALDHEIM_MARKET.sells.some((l) => l.itemId === id), id).toBe(false);
      expect(imperial.sells.some((l) => l.itemId === id), id).toBe(true);
      expect(imperial.buys.find((l) => l.itemId === id)!.priceCp).toBe(
        imperial.sells.find((l) => l.itemId === id)!.priceCp * 0.25,
      );
    }
    // Supplies refill every kit — both markets stock them.
    expect(WALDHEIM_MARKET.sells.some((l) => l.itemId === 'supplies')).toBe(true);
    expect(imperial.sells.some((l) => l.itemId === 'supplies')).toBe(true);
  });

  it("Black's Road sells the poisoner's tools — and only those", () => {
    const road = marketById('blacks-road')!;
    expect(buyPriceCp(road, 'artisans-tools')).toBe(50);
    expect(road.choiceOverrides?.['artisans-tools']).toEqual(['Poison']);
  });

  it('bestBuy finds the cheapest reachable source only', () => {
    expect(bestBuy('musket', [])!.market.id).toBe('waldheim');
    const withFeat = bestBuy('musket', ['market-dunstans-magazine'])!;
    expect(withFeat.market.id).toBe('dunstans-magazine');
    expect(withFeat.priceCp).toBe(1000);
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
    expect(inst.location).toBe('equipped');
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

  it('purchase-time picks name the instance and never cross-stack', () => {
    const { state, flags } = replay([
      ...creation(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'waldheim', itemId: 'artisans-tools', qty: 1, choice: 'Fletcher' },
        { direction: 'buy', marketId: 'waldheim', itemId: 'artisans-tools', qty: 1, choice: 'Cooper' },
        { direction: 'buy', marketId: 'waldheim', itemId: 'artisans-tools', qty: 1, choice: 'Fletcher' },
      ] }),
    ]);
    expect(flags).toEqual([]);
    const tools = state.inventory.filter((i) => i.itemId === 'artisans-tools');
    expect(tools).toHaveLength(2);
    expect(tools.find((i) => i.name === "Artisan's tools (Fletcher)")!.qty).toBe(2);
    expect(tools.find((i) => i.name === "Artisan's tools (Cooper)")!.qty).toBe(1);
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
      ...creation(badGear, 'Lysander'),
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

  it('after the first Session the Waldheim Market pays its 25%', () => {
    const { state, flags } = replay([
      ...crystallized(),
      ev('session-logged', {}),
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
      ev('session-logged', {}),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'waldheim', itemId: 'torch', qty: 2 }] }),
      ev('transaction', { lines: [
        { direction: 'sell', marketId: 'waldheim', instanceId: 'item:torch', qty: 2 },
        { direction: 'sell', marketId: 'waldheim', instanceId: 'item:torch', qty: 1 },
      ] }),
    ]);
    expect(flags.some((f) => f.code === 'over-cap')).toBe(true);
  });

  it('nothing sells before the first Session — not even Starting Gear; nor after, with no buyer', () => {
    const locked = replay([
      ...crystallized(),
      ev('transaction', { lines: [{ direction: 'sell', marketId: 'waldheim', instanceId: 'starting-gear', qty: 1 }] }),
    ]);
    expect(locked.flags.some((f) => f.message.includes('before the first Session'))).toBe(true);

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
      ...crystallized(badGear, 'Havilah'),
      ev('session-logged', {}),
      ev('feat-bought', { featId: 'market-ulrics-exchange' }),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'ulrics-exchange', itemId: 'animal-pelts-cured', qty: 1 }] }),
      ev('transaction', { lines: [{ direction: 'sell', marketId: 'waldheim', instanceId: 'item:animal-pelts-cured', qty: 1 }] }),
    ]);
    expect(flags).toEqual([]);
    expect(state.wealthCp).toBe(2000 - 200 + 300);
  });

  it('a New character cannot run the arbitrage — bought goods hold until the first Session', () => {
    const { flags } = replay([
      ...crystallized(badGear, 'Havilah'),
      ev('feat-bought', { featId: 'market-ulrics-exchange' }),
      ev('transaction', { lines: [{ direction: 'buy', marketId: 'ulrics-exchange', itemId: 'animal-pelts-cured', qty: 1 }] }),
      ev('transaction', { lines: [{ direction: 'sell', marketId: 'waldheim', instanceId: 'item:animal-pelts-cured', qty: 1 }] }),
    ]);
    expect(flags.some((f) => f.code === 'no-access' && f.message.includes('before the first Session'))).toBe(true);
  });

  it('stock certificates are near-liquid at home and appreciate southward', () => {
    const exchange = marketById('ulrics-exchange')!;
    expect(buyPriceCp(exchange, 'stock-bank-ulric')).toBe(1000);
    expect(sellPriceCp(exchange, 'stock-bank-ulric')).toBe(990);
    expect(sellPriceCp(WALDHEIM_MARKET, 'stock-bank-ulric')).toBe(1100);
  });
});

describe('the Craft Specialization anchors to a trade', () => {
  it('requires Rank +1 in the exact chosen Craft', () => {
    const fletcher = [
      ev('class-chosen', { classId: 'soldier' }),
      ev('subclass-chosen', { subclassId: 'vanguard' }),
      ev('skill-trained', { skill: 'Craft (Fletcher)' }),
      ev('skill-advanced', { skill: 'Craft (Fletcher)' }),
    ];
    const wrongTrade = replay([
      ...fletcher,
      ev('feat-bought', { featId: 'skill-spec-craft', choices: { speciality: 'Cooper' } }),
    ]);
    expect(wrongTrade.flags.some((f) => f.message.includes('Craft (Cooper)'))).toBe(true);

    const rightTrade = replay([
      ...fletcher,
      ev('feat-bought', { featId: 'skill-spec-craft', choices: { speciality: 'Fletcher' } }),
    ]);
    expect(rightTrade.flags).toEqual([]);
    expect(rightTrade.state.feats).toContainEqual({
      featId: 'skill-spec-craft', choices: { speciality: 'Fletcher' }, rank: 1,
    });
  });
});

describe('containers and Load', () => {
  const buy = (lines: { itemId: string; qty: number }[]) =>
    ev('transaction', {
      lines: lines.map((l) => ({ direction: 'buy' as const, marketId: 'waldheim', ...l })),
    });

  it('items nest in containers; non-containers and loops refuse', () => {
    const base = [
      ...crystallized(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'waldheim', itemId: 'backpack', qty: 1 },
        { direction: 'buy', marketId: 'waldheim', itemId: 'torch', qty: 4 },
      ] }),
    ];
    const nested = replay([
      ...base,
      ev('item-moved', { instanceId: 'item:torch', location: 'in:item:backpack' }),
    ]);
    expect(nested.flags).toEqual([]);
    expect(nested.state.inventory.find((i) => i.itemId === 'torch')!.location).toBe('in:item:backpack');

    const notAContainer = replay([
      ...base,
      ev('item-moved', { instanceId: 'item:backpack', location: 'in:item:torch' }),
    ]);
    expect(notAContainer.flags.some((f) => f.code === 'no-access')).toBe(true);

    const loop = replay([
      ...base,
      buy([{ itemId: 'sack-large', qty: 1 }]),
      ev('item-moved', { instanceId: 'item:sack-large', location: 'in:item:backpack' }),
      ev('item-moved', { instanceId: 'item:backpack', location: 'in:item:sack-large' }),
    ]);
    expect(loop.flags.some((f) => f.message.includes('cannot contain itself'))).toBe(true);
  });

  it('Load: coefficients, worn armour weightless, Home off the body', () => {
    // Str +0 Soldier variant is fiddly; use the raw state via derive.
    const { state, flags } = replay([
      ...crystallized(),
      buy([
        { itemId: 'backpack', qty: 1 },        // 2 lb, ×0.9
        { itemId: 'chain-10ft', qty: 2 },       // 20 lb → in pack, ×0.9 = 18
        { itemId: 'chain-mail', qty: 1 },       // 40 lb, worn → weightless
        { itemId: 'maul', qty: 1 },             // 10 lb carried
        { itemId: 'tent-one-man', qty: 1 },     // 20 lb → Home, excluded
      ]),
      ev('item-moved', { instanceId: 'item:chain-10ft', location: 'in:item:backpack' }),
      ev('item-moved', { instanceId: 'item:chain-mail', location: 'equipped' }),
      ev('item-moved', { instanceId: 'item:tent-one-man', location: 'home' }),
    ]);
    expect(flags).toEqual([]);
    const { load } = derive(state);
    // 2 (pack) + 18 (chains ×0.9) + 10 (maul) = 30; starting gear weighs
    // nothing (unique, no catalogue weight).
    expect(load.totalLb).toBe(30);
    expect(load.base.total).toBe(40); // Str +0
    // 30 of 40: an ordinary kit sits inside the base, which is the point of
    // the 40 lb floor — the Band is a signal, not a standing penalty.
    expect(load.band).toBe('None');
    expect(load.effect).toBeNull();
  });

  it('Load Bands: past the base is Light, past twice it is Heavy', () => {
    const carrying = (qty: number) =>
      derive(replay([...crystallized(), buy([{ itemId: 'chain-10ft', qty }])]).state).load;
    expect(carrying(4).band).toBe('None');   // 40 of 40
    expect(carrying(5).band).toBe('Light');  // 50 — past the base
    expect(carrying(8).band).toBe('Light');  // 80 of 2 × 40
    expect(carrying(9).band).toBe('Heavy');  // 90 — past twice the base
  });

  it('the Load track carries every Band and marks the one stood on', () => {
    const { rungs } = derive(
      replay([...crystallized(), buy([{ itemId: 'chain-10ft', qty: 5 }])]).state,
    ).load;
    expect(rungs.map((r) => [r.band, r.upToLb])).toEqual([
      ['None', 40], ['Light', 80], ['Heavy', null],
    ]);
    expect(rungs.filter((r) => r.here).map((r) => r.band)).toEqual(['Light']);
    expect(rungs[0].effect).toBeNull();
    expect(rungs[2].effect).toContain("−10'");
  });

  it('the Encumbrance Feat Ladder widens the base and tames Heavy', () => {
    const heavyHaul = [
      ...crystallized(),
      buy([{ itemId: 'chain-10ft', qty: 13 }]), // 130 lb > 2 × 40
    ];
    expect(derive(replay(heavyHaul).state).load.band).toBe('Heavy');

    const laddered = replay([
      ...crystallized(),
      ev('feat-bought', { featId: 'encumbrance-ladder' }),
      ...[2, 3].flatMap((toRank) => [
        ev('milestone-granted', {}), ev('milestone-granted', {}), ev('milestone-granted', {}),
        ev('feat-advanced', { featId: 'encumbrance-ladder', toRank }),
      ]),
      buy([{ itemId: 'chain-10ft', qty: 17 }]), // 170 lb
    ]);
    expect(laddered.flags).toEqual([]);
    const { load } = derive(laddered.state);
    expect(load.base.total).toBe(70);   // 40 + two Ranks at 15 lb
    expect(load.band).toBe('Light'); // 170 > 2 × 70 would be Heavy; Rank 3 tames it
    // The sheet says so, since the standing Band now sits below the weight.
    expect(load.tamed).toBe(true);
  });

  it('a Feat Rank is worth the same pounds to a weak character as a strong one', () => {
    const withRanks = (ranks: number) =>
      derive(replay([
        ...crystallized(),
        ...(ranks
          ? [
              ev('feat-bought', { featId: 'encumbrance-ladder' }),
              ...(ranks > 1
                ? [
                    ev('milestone-granted', {}), ev('milestone-granted', {}), ev('milestone-granted', {}),
                    ev('feat-advanced', { featId: 'encumbrance-ladder', toRank: 2 }),
                  ]
                : []),
            ]
          : []),
      ]).state).load.base.total;
    expect(withRanks(1) - withRanks(0)).toBe(15);
    expect(withRanks(2) - withRanks(0)).toBe(30);
  });
});

describe('the sheet arrangement', () => {
  // The inventory array's order is what the sheet draws, so a drag is an
  // item-moved carrying a position. Three items, bought in one Basket in
  // catalogue order, give a known starting arrangement.
  const stocked = () => [
    ...crystallized(),
    ev('transaction', { lines: [
      { direction: 'buy' as const, marketId: 'waldheim', itemId: 'backpack', qty: 1 },
      { direction: 'buy' as const, marketId: 'waldheim', itemId: 'torch', qty: 1 },
      { direction: 'buy' as const, marketId: 'waldheim', itemId: 'maul', qty: 1 },
    ] }),
  ];
  const order = (events: RecordEvent[]) =>
    replay(events).state.inventory.filter((i) => i.itemId).map((i) => i.itemId);

  it('starts in the order things were acquired', () => {
    expect(order(stocked())).toEqual(['backpack', 'torch', 'maul']);
  });

  it('a position moves an item before or after its anchor', () => {
    expect(order([
      ...stocked(),
      ev('item-moved', {
        instanceId: 'item:maul', location: 'equipped',
        position: { anchor: 'item:backpack', side: 'before' },
      }),
    ])).toEqual(['maul', 'backpack', 'torch']);

    expect(order([
      ...stocked(),
      ev('item-moved', {
        instanceId: 'item:backpack', location: 'equipped',
        position: { anchor: 'item:maul', side: 'after' },
      }),
    ])).toEqual(['torch', 'maul', 'backpack']);
  });

  it('a move without a position leaves the arrangement alone', () => {
    const moved = replay([
      ...stocked(),
      ev('item-moved', { instanceId: 'item:torch', location: 'in:item:backpack' }),
    ]);
    expect(moved.flags).toEqual([]);
    expect(moved.state.inventory.filter((i) => i.itemId).map((i) => i.itemId))
      .toEqual(['backpack', 'torch', 'maul']);
  });

  it('a vanished anchor leaves the item where it stands, unflagged', () => {
    const sold = [
      ...stocked(),
      ev('session-logged', {}),
      ev('transaction', { lines: [
        { direction: 'sell' as const, marketId: 'waldheim', instanceId: 'item:torch', qty: 1 },
      ] }),
      ev('item-moved', {
        instanceId: 'item:maul', location: 'equipped',
        position: { anchor: 'item:torch', side: 'before' },
      }),
    ];
    expect(replay(sold).flags).toEqual([]);
    expect(order(sold)).toEqual(['backpack', 'maul']);
  });

  it('an item dropped on itself stays put', () => {
    expect(order([
      ...stocked(),
      ev('item-moved', {
        instanceId: 'item:torch', location: 'equipped',
        position: { anchor: 'item:torch', side: 'after' },
      }),
    ])).toEqual(['backpack', 'torch', 'maul']);
  });
});

describe('splitting stacks', () => {
  const supplied = () => [
    ...crystallized(),
    ev('transaction', { lines: [
      { direction: 'buy', marketId: 'waldheim', itemId: 'healers-kit', qty: 1 },
      { direction: 'buy', marketId: 'waldheim', itemId: 'supplies', qty: 4, choice: "Healer's Kit" },
    ] }),
  ];
  const stackId = "item:supplies:Healer's Kit";

  it('a split carves a new stack with inherited provenance', () => {
    const splitEv = ev('item-split', { instanceId: stackId, qty: 3, location: 'home' });
    const { state, flags } = replay([...supplied(), splitEv]);
    expect(flags).toEqual([]);
    const stacks = state.inventory.filter((i) => i.itemId === 'supplies');
    expect(stacks).toHaveLength(2);
    expect(stacks.find((s) => s.instanceId === stackId)!.qty).toBe(1);
    const carved = stacks.find((s) => s.instanceId === splitEv.id)!;
    expect(carved.qty).toBe(3);
    expect(carved.location).toBe('home');
    expect(carved.origin).toBe('purchase');
  });

  it('a split must leave both halves real', () => {
    const { flags } = replay([
      ...supplied(),
      ev('item-split', { instanceId: stackId, qty: 4, location: 'home' }),
    ]);
    expect(flags.some((f) => f.code === 'over-cap')).toBe(true);
  });

  it('kits are containers: Supplies live inside the bag', () => {
    const { state, flags } = replay([
      ...supplied(),
      ev('item-moved', { instanceId: stackId, location: 'in:item:healers-kit' }),
    ]);
    expect(flags).toEqual([]);
    expect(state.inventory.find((i) => i.instanceId === stackId)!.location).toBe('in:item:healers-kit');
  });
});

describe('worn gear feeds the sheet', () => {
  it('equipped armour raises Armoured Defences, DR, Speed, and Stealth; a shield stays situational', () => {
    const { state, flags } = replay([
      ...crystallized(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'waldheim', itemId: 'chain-mail', qty: 1 },
        { direction: 'buy', marketId: 'waldheim', itemId: 'heater-kite-round', qty: 1 },
      ] }),
      ev('item-moved', { instanceId: 'item:chain-mail', location: 'equipped' }),
      ev('item-moved', { instanceId: 'item:heater-kite-round', location: 'equipped' }),
    ]);
    expect(flags).toEqual([]);
    const sheet = derive(state);
    const con = sheet.attributes.find((a) => a.attr === 'Constitution')!;
    expect(con.armouredDefence.parts).toContainEqual({ label: 'Chain Mail', value: 3 });
    expect(con.unarmouredDefence.parts.some((p) => p.label === 'Chain Mail')).toBe(false);
    expect(sheet.damageReduction.parts).toContainEqual({ label: 'Chain Mail', value: 2 });
    // Speed: −10' armour, −5' heavy shield (its weight-and-Speed is passive).
    expect(sheet.speed.total).toBe(15);
    const stealth = sheet.skills.find((s) => s.skill === 'Stealth')!;
    expect(stealth.value.parts).toContainEqual({ label: 'Chain Mail', value: -2 });
    // The shield's AC and DR bind only while raised — situational, never summed.
    expect(sheet.situational.some((s) => s.source === 'Heater / Kite / Round' && s.text.includes('while raised'))).toBe(true);
    expect(con.armouredDefence.parts.some((p) => p.label === 'Heater / Kite / Round')).toBe(false);
  });
});

describe('grants, moves, and Sessions', () => {
  it('a granted item lands Equipped, catalogue-named where backed', () => {
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

describe('Gear States (mechanics/encumbrance.md)', () => {
  const buy = (lines: { itemId: string; qty: number }[]) =>
    ev('transaction', {
      lines: lines.map((l) => ({ direction: 'buy' as const, marketId: 'waldheim', ...l })),
    });

  it("reads old records' retired 'carried' as Equipped", () => {
    const grant = ev('item-granted', { itemId: 'longsword' });
    const legacyMove = {
      ...ev('item-moved', { instanceId: grant.id, location: 'home' }),
      location: 'carried',
    } as RecordEvent;
    const { state, flags } = replay([...crystallized(), grant, legacyMove]);
    expect(flags).toEqual([]);
    expect(state.inventory.find((i) => i.itemId === 'longsword')!.location).toBe('equipped');
  });

  it("reads the retired 'held' as Equipped — a sheet cannot hold a moment", () => {
    const grant = ev('item-granted', { itemId: 'longsword' });
    const legacyMove = {
      ...ev('item-moved', { instanceId: grant.id, location: 'home' }),
      location: 'held',
    } as RecordEvent;
    const { state, flags } = replay([...crystallized(), grant, legacyMove]);
    expect(flags).toEqual([]);
    expect(state.inventory.find((i) => i.itemId === 'longsword')!.location).toBe('equipped');
  });

  it('armour is Worn and shields are Equipped, whichever way the record asks', () => {
    const { state, flags } = replay([
      ...crystallized(),
      buy([
        { itemId: 'chain-mail', qty: 1 },
        { itemId: 'heater-kite-round', qty: 1 },
      ]),
      ev('item-moved', { instanceId: 'item:chain-mail', location: 'equipped' }),
      ev('item-moved', { instanceId: 'item:heater-kite-round', location: 'worn' }),
    ]);
    expect(flags).toEqual([]);
    expect(state.inventory.find((i) => i.itemId === 'chain-mail')!.location).toBe('worn');
    expect(state.inventory.find((i) => i.itemId === 'heater-kite-round')!.location).toBe('equipped');
  });

  it('only a tagged item may be Worn — everything else falls back to Equipped', () => {
    const { state, flags } = replay([
      ...crystallized(),
      buy([
        { itemId: 'maul', qty: 1 },      // no tag
        { itemId: 'cloak-wool', qty: 1 },// clothing
      ]),
      ev('item-moved', { instanceId: 'item:maul', location: 'worn' }),
      ev('item-moved', { instanceId: 'item:cloak-wool', location: 'worn' }),
    ]);
    expect(flags).toEqual([]);
    expect(state.inventory.find((i) => i.itemId === 'maul')!.location).toBe('equipped');
    expect(state.inventory.find((i) => i.itemId === 'cloak-wool')!.location).toBe('worn');
  });

  it('a Container is never Equipped — you open a backpack, you do not draw it', () => {
    const { state, flags } = replay([
      ...crystallized(),
      buy([{ itemId: 'backpack', qty: 1 }, { itemId: 'barrel', qty: 1 }]),
      ev('item-moved', { instanceId: 'item:backpack', location: 'equipped' }),
    ]);
    expect(flags).toEqual([]);
    // Both arrive from the Market at 'equipped' and are corrected on the way in.
    expect(state.inventory.find((i) => i.itemId === 'backpack')!.location).toBe('worn');
    expect(state.inventory.find((i) => i.itemId === 'barrel')!.location).toBe('worn');
  });

  it('Worn and Equipped both weigh in full, unless the item is 0-Enc', () => {
    const { state, flags } = replay([
      ...crystallized(),
      buy([
        { itemId: 'maul', qty: 1 },       // 10 lb, Equipped
        { itemId: 'chain-10ft', qty: 1 }, // 10 lb, Equipped (no Worn tag)
        { itemId: 'torch', qty: 1 },      // 1 lb, Equipped
        { itemId: 'cloak-wool', qty: 1 }, // 2 lb of clothing — 0-Enc, Worn
      ]),
      ev('item-moved', { instanceId: 'item:cloak-wool', location: 'worn' }),
    ]);
    expect(flags).toEqual([]);
    expect(derive(state).load.totalLb).toBe(21);
  });

  it('0-Enc spends itself on the body: a packed suit of armour weighs in full', () => {
    const { state, flags } = replay([
      ...crystallized(),
      buy([
        { itemId: 'backpack', qty: 1 },    // 2 lb, ×0.9 contents — Worn on arrival
        { itemId: 'leather', qty: 1 },
      ]),
      ev('item-moved', { instanceId: 'item:leather', location: 'in:item:backpack' }),
    ]);
    expect(flags).toEqual([]);
    const armourLb = itemWeightLb('leather')!;
    expect(derive(state).load.totalLb).toBe(Math.round(2 + armourLb * 0.9));
  });
});

describe('the Equipped Limit (mechanics/encumbrance.md)', () => {
  const buy = (lines: { itemId: string; qty: number }[]) =>
    ev('transaction', {
      lines: lines.map((l) => ({ direction: 'buy' as const, marketId: 'waldheim', ...l })),
    });

  it('is 5 + Str + Dex + Con, and never less than 5', () => {
    const { state } = replay([...crystallized()]);
    const sheet = derive(state);
    const attr = (a: string) => sheet.attributes.find((x) => x.attr === a)!.value.total;
    expect(sheet.equipped.cap.total).toBe(
      Math.max(5, 5 + attr('Strength') + attr('Dexterity') + attr('Constitution')),
    );
    expect(sheet.equipped.cap.total).toBeGreaterThanOrEqual(5);
    // It shows its work: the base is always a part.
    expect(sheet.equipped.cap.parts).toContainEqual({ label: 'Base', value: 5 });
  });

  it('counts Equipped items and their quantities, and warns rather than blocks', () => {
    const { state, flags } = replay([
      ...crystallized(),
      buy([{ itemId: 'torch', qty: 40 }]),
    ]);
    expect(flags).toEqual([]);
    const sheet = derive(state);
    expect(sheet.equipped.count).toBeGreaterThanOrEqual(40);
    expect(sheet.equipped.over).toBe(true);
  });

  it('never charges for Stored items — which is what a bandolier buys', () => {
    const empty = replay([
      ...crystallized(),
      buy([{ itemId: 'bandolier', qty: 1 }]),
    ]);
    const packed = replay([
      ...crystallized(),
      buy([{ itemId: 'bandolier', qty: 1 }, { itemId: 'torch', qty: 40 }]),
      ev('item-moved', { instanceId: 'item:torch', location: 'in:item:bandolier' }),
    ]);
    expect(packed.flags).toEqual([]);
    // Forty torches Stored cost nothing against the Limit; Equipped they would
    // have swamped it.
    expect(derive(packed.state).equipped.count).toBe(derive(empty.state).equipped.count);
    expect(derive(packed.state).equipped.over).toBe(false);
  });
});

describe('the Renunciation of Nicetus closes the Saintly Market', () => {
  const RENUNCIATION = { category: 'Witchcraft', ability: 'Renunciation of Nicetus' };

  const renunciant = () => [
    ev('class-chosen', { classId: 'occultist' }),
    ev('subclass-chosen', { subclassId: 'witch' }),
    ev('ability-bought', { ref: RENUNCIATION }),
    ev('quirk-rolled', {
      quirkName: 'Q', slots: {}, rerollsUsed: 0,
      gearId: badGear.id, gearName: badGear.name, gearSlots: {},
    }),
    ev('crystallized', {}),
  ];

  it('the Market drops from access and from the listing', () => {
    expect(accessibleMarkets([]).map((m) => m.id)).toContain('imperial-square');
    expect(accessibleMarkets([], [RENUNCIATION]).map((m) => m.id)).not.toContain('imperial-square');
    expect(listedMarkets([], [RENUNCIATION]).map((m) => m.id)).not.toContain('imperial-square');
  });

  it('the engine refuses the trip', () => {
    const { flags } = replay([
      ...renunciant(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'imperial-square', itemId: 'votive-candle', qty: 1 },
      ] }),
    ]);
    expect(flags.some((f) => f.code === 'no-access' && f.message.includes('closed'))).toBe(true);
  });

  it('without the Vow the same trip clears', () => {
    const { flags } = replay([
      ...crystallized(),
      ev('transaction', { lines: [
        { direction: 'buy', marketId: 'imperial-square', itemId: 'votive-candle', qty: 1 },
      ] }),
    ]);
    expect(flags).toEqual([]);
  });
});
