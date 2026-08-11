// The Shop (builder spec §11): one view for every shopping moment. This
// first use is creation shopping — buys only, the Basket committed by the
// flow's Finish. The Waldheim family is always listed (locked markets by
// title, with the Feat that opens them); Regional Markets appear only once
// their Feat is owned.
//
// Quality of life (Aug 11 2026): price hints (a cheaper reachable Market
// notes itself on the row and in the Basket — clickable, informing but
// never auto-deciding), proficiency chips on weapons/armour/shields with
// the exact penalty, the All Gear / Gear I can Use toggle, and
// purchase-time choices (Artisan's tools name their Craft, a Saint's
// medal its saint; Black's Road adds Poison to the tools' list).
//
// Thin like the rest of the builder: prices come from lib/markets.ts, and
// the Basket becomes one transaction event at Finish — the engine is the
// gate. A top-level component (never defined inside another's render): it
// holds inputs, and focus dies with identity churn.

import { useState } from 'preact/hooks';

import {
  ARMOURS,
  CATALOGUE,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  SHIELDS,
  fmtCoins,
  fmtWeight,
} from '../../lib/equipment';
import type { ItemChoice } from '../../lib/equipment';
import { FEATS } from '../../lib/feats';
import {
  accessibleMarkets,
  bestBuy,
  buyPriceCp,
  itemName,
  itemWeightLb,
  listedMarkets,
  marketById,
  sellPriceCp,
} from '../../lib/markets';
import type { Market } from '../../lib/markets';
import { allProficiencies } from '../../lib/record/replay';
import type { CharacterState } from '../../lib/record/replay';

export type BasketLine =
  | { direction: 'buy'; marketId: string; itemId: string; qty: number; choice?: string }
  | { direction: 'sell'; marketId: string; instanceId: string; qty: number };

export function commerceRankOf(state: CharacterState): number {
  return state.feats.find((f) => f.featId === 'commerce-ladder')?.rank ?? 0;
}

/** The Basket's money: buys spend, sells earn, net = sells − buys. Sell
 * prices resolve through the owned instance's catalogue id. */
export function basketTotalsCp(
  basket: BasketLine[],
  commerceRank: number,
  state: CharacterState,
): { buys: number; sells: number; net: number } {
  let buys = 0;
  let sells = 0;
  for (const line of basket) {
    const market = marketById(line.marketId);
    if (!market) continue;
    if (line.direction === 'buy') {
      buys += (buyPriceCp(market, line.itemId, commerceRank) ?? 0) * line.qty;
    } else {
      const inst = state.inventory.find((i) => i.instanceId === line.instanceId);
      if (inst?.itemId) sells += (sellPriceCp(market, inst.itemId, commerceRank) ?? 0) * line.qty;
    }
  }
  return { buys, sells, net: sells - buys };
}

/** The Feat that opens a locked Market, for the shopfront note. */
function openingFeatName(market: Market): string | undefined {
  if (market.access.kind !== 'feat') return undefined;
  const featId = market.access.featId;
  return FEATS.find((f) => f.id === featId)?.name;
}

const sectionOf = (itemId: string): string =>
  CATALOGUE.find((e) => e.id === itemId)?.section ?? 'Trade Goods';

const itemChoice = (itemId: string): ItemChoice | undefined =>
  CATALOGUE.find((e) => e.id === itemId)?.choice;

/** Proficiency chips: what wearing or wielding this untrained costs. */
interface UseChip {
  label: string;
  tip: string;
}

const ARMOUR_PROF: Record<string, string> = {
  Light: 'Light Armour',
  Medium: 'Medium Armour',
  Heavy: 'Heavy Armour',
};

function useChips(state: CharacterState, itemId: string): UseChip[] {
  const profs = allProficiencies(state);
  const chips: UseChip[] = [];

  const weapon = [...MELEE_WEAPONS, ...RANGED_WEAPONS].find((w) => w.id === itemId);
  if (weapon && !profs.includes(weapon.group)) {
    chips.push({ label: 'untrained', tip: `Not proficient with ${weapon.group} — −1 to attack.` });
  }

  const armour = ARMOURS.find((a) => a.id === itemId);
  if (armour) {
    const prof = ARMOUR_PROF[armour.tier];
    const penalty = armour.tier === 'Heavy' ? 2 : 1;
    if (!profs.includes(prof)) {
      chips.push({
        label: 'untrained',
        tip: `Not proficient with ${prof} — −${penalty} to attack rolls and physical skill checks.`,
      });
    }
    if (armour.strReq !== null) {
      const str =
        (state.attributeRanks.Strength ?? 0) - (state.flaws.includes('Strength') ? 1 : 0);
      if (str < armour.strReq) {
        chips.push({ label: `needs Str +${armour.strReq}`, tip: `Requires Strength +${armour.strReq}.` });
      }
    }
  }

  const shield = SHIELDS.find((s) => s.id === itemId);
  if (shield && !profs.includes(shield.proficiency)) {
    const penalty = shield.proficiency === 'Heavy Shield' ? 2 : 1;
    chips.push({
      label: 'untrained',
      tip: `Not proficient with ${shield.proficiency} — −${penalty} to attack rolls and physical skill checks.`,
    });
  }

  return chips;
}

interface Props {
  state: CharacterState;
  basket: BasketLine[];
  setBasket: (basket: BasketLine[]) => void;
}

export default function MarketShop({ state, basket, setBasket }: Props) {
  const ownedFeatIds = state.feats.map((f) => f.featId);
  const commerce = commerceRankOf(state);
  const listed = listedMarkets(ownedFeatIds);
  const openIds = new Set(accessibleMarkets(ownedFeatIds).map((m) => m.id));

  const [pickedId, setPickedId] = useState('waldheim');
  const [query, setQuery] = useState('');
  const [gearView, setGearView] = useState<'all' | 'usable'>('all');
  // Pending purchase-time picks, keyed "market/item": the dropdown value
  // ('§other' = the free-text entry) and the free text itself.
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [others, setOthers] = useState<Record<string, string>>({});
  const active = marketById(openIds.has(pickedId) ? pickedId : 'waldheim')!;

  const q = query.trim().toLowerCase();
  const rows = active.sells
    .map((line) => ({
      itemId: line.itemId,
      name: itemName(line.itemId) ?? line.itemId,
      weightLb: itemWeightLb(line.itemId),
      priceCp: buyPriceCp(active, line.itemId, commerce)!,
      section: sectionOf(line.itemId),
      chips: useChips(state, line.itemId),
      choice: itemChoice(line.itemId),
      best: bestBuy(line.itemId, ownedFeatIds, commerce),
    }))
    .filter((r) => !q || r.name.toLowerCase().includes(q))
    .filter((r) => gearView === 'all' || r.chips.length === 0);
  const sections = [...new Set(rows.map((r) => r.section))];

  /** The row's chosen pick, resolved to the string the Basket will carry —
   * undefined for choiceless items, null for "not picked yet". */
  const pickedChoice = (itemId: string, choice?: ItemChoice): string | null | undefined => {
    if (!choice) return undefined;
    const key = `${active.id}/${itemId}`;
    const sel = picks[key] ?? '';
    if (sel === '§other') {
      const text = (others[key] ?? '').trim();
      return text || null;
    }
    return sel || null;
  };

  const lineKey = (l: BasketLine) =>
    l.direction === 'buy'
      ? `b/${l.marketId}/${l.itemId}/${l.choice ?? ''}`
      : `s/${l.marketId}/${l.instanceId}`;

  const qtyOf = (marketId: string, itemId: string, choice?: string) =>
    basket.find((l) => lineKey(l) === `b/${marketId}/${itemId}/${choice ?? ''}`)?.qty ?? 0;

  const setQty = (marketId: string, itemId: string, choice: string | undefined, qty: number) => {
    const key = `b/${marketId}/${itemId}/${choice ?? ''}`;
    const rest = basket.filter((l) => lineKey(l) !== key);
    setBasket(qty > 0 ? [...rest, { direction: 'buy', marketId, itemId, qty, choice }] : rest);
  };

  /** Move a buy line to a cheaper Market, merging with any existing line. */
  const rerouteLine = (line: Extract<BasketLine, { direction: 'buy' }>, toMarketId: string) => {
    const existing = qtyOf(toMarketId, line.itemId, line.choice);
    const rest = basket.filter(
      (l) => l !== line && lineKey(l) !== `b/${toMarketId}/${line.itemId}/${line.choice ?? ''}`,
    );
    setBasket([
      ...rest,
      { direction: 'buy', marketId: toMarketId, itemId: line.itemId, qty: line.qty + existing, choice: line.choice },
    ]);
  };

  const totals = basketTotalsCp(basket, commerce, state);
  const remainingCp = state.wealthCp + totals.net;

  return (
    <div class="cf-shop">
      <div class="cf-shop-tabs">
        {listed.map((m) => {
          const open = openIds.has(m.id);
          const feat = openingFeatName(m);
          return (
            <button
              key={m.id}
              type="button"
              class={`cf-shop-tab${m.id === active.id ? ' active' : ''}${open ? '' : ' locked'}`}
              disabled={!open}
              title={
                open
                  ? `${m.name} — ${m.location} — ${m.marketType}`
                  : `No access. Opens with the Feat: ${feat}.`
              }
              onClick={() => setPickedId(m.id)}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      <p class="cf-shop-head">
        <strong>{active.name}</strong> — {active.location} — {active.marketType}
      </p>

      {active.sells.length === 0 ? (
        <p class="cf-how">Nothing on offer.</p>
      ) : (
        <>
          <div class="cf-shop-bar">
            <input
              class="cf-shop-search"
              placeholder="Search the stalls…"
              value={query}
              onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            />
            <div class="cf-viewtoggle" role="group">
              <button type="button" class={gearView === 'all' ? 'on' : ''} onClick={() => setGearView('all')}>
                All Gear
              </button>
              <button type="button" class={gearView === 'usable' ? 'on' : ''} onClick={() => setGearView('usable')}>
                Gear I can Use
              </button>
            </div>
          </div>
          <div class="cf-shop-list">
            {sections.map((section) => (
              <details key={`${active.id}/${section}`} class="cf-shop-fold" open={Boolean(q) || sections.length === 1}>
                <summary>{section}</summary>
                <table class="cf-shop-table">
                  <tbody>
                    {rows
                      .filter((r) => r.section === section)
                      .map((r) => {
                        const pickKey = `${active.id}/${r.itemId}`;
                        const picked = pickedChoice(r.itemId, r.choice);
                        // A market may replace an item's whole option list
                        // (Black's Road: Poison alone, no Other).
                        const override = active.choiceOverrides?.[r.itemId];
                        const options = override ?? r.choice?.options ?? [];
                        const allowOther = !override && (r.choice?.other ?? false);
                        const inBasket =
                          picked === null ? 0 : qtyOf(active.id, r.itemId, picked);
                        const needsPick = r.choice !== undefined && picked === null;
                        const cheaper =
                          r.best && r.best.market.id !== active.id && r.best.priceCp < r.priceCp
                            ? r.best
                            : undefined;
                        return (
                          <tr key={r.itemId}>
                            <td>
                              {r.name}
                              {r.chips.map((c) => (
                                <span class="cf-chip" title={c.tip}>{c.label}</span>
                              ))}
                              {r.choice && (
                                <span class="cf-shop-choice">
                                  <select
                                    value={picks[pickKey] ?? ''}
                                    onChange={(e) =>
                                      setPicks((p) => ({ ...p, [pickKey]: (e.target as HTMLSelectElement).value }))
                                    }
                                  >
                                    <option value="">{r.choice.label}…</option>
                                    {options.map((o) => (
                                      <option key={o} value={o}>{o}</option>
                                    ))}
                                    {allowOther && <option value="§other">Other…</option>}
                                  </select>
                                  {picks[pickKey] === '§other' && (
                                    <input
                                      placeholder={r.choice.label}
                                      value={others[pickKey] ?? ''}
                                      onInput={(e) =>
                                        setOthers((o) => ({ ...o, [pickKey]: (e.target as HTMLInputElement).value }))
                                      }
                                    />
                                  )}
                                </span>
                              )}
                              {cheaper && (
                                <button
                                  type="button"
                                  class="cf-shop-hint"
                                  title={`${cheaper.market.name} — ${cheaper.market.location} — ${cheaper.market.marketType}`}
                                  disabled={needsPick}
                                  onClick={() =>
                                    setQty(
                                      cheaper.market.id,
                                      r.itemId,
                                      picked ?? undefined,
                                      qtyOf(cheaper.market.id, r.itemId, picked ?? undefined) + 1,
                                    )
                                  }
                                >
                                  {fmtCoins(cheaper.priceCp)} at {cheaper.market.name}
                                </button>
                              )}
                            </td>
                            <td class="num">{fmtCoins(r.priceCp)}</td>
                            <td class="num">{fmtWeight(r.weightLb)}</td>
                            <td class="act">
                              {inBasket > 0 && (
                                <>
                                  <button type="button" class="undo" onClick={() => setQty(active.id, r.itemId, picked ?? undefined, inBasket - 1)}>−</button>
                                  <span class="cf-shop-qty">{inBasket}</span>
                                </>
                              )}
                              <button
                                type="button"
                                class="buy"
                                disabled={needsPick}
                                title={needsPick ? `Choose a ${r.choice!.label} first` : undefined}
                                onClick={() => setQty(active.id, r.itemId, picked ?? undefined, inBasket + 1)}
                              >
                                +
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </details>
            ))}
          </div>
        </>
      )}

      <div class="cf-basket">
        <p class="cf-eyebrow">The Basket</p>
        {basket.length === 0 ? (
          <p class="cf-how">Empty. What you buy arrives carried.</p>
        ) : (
          <table class="cf-shop-table">
            <tbody>
              {basket.map((l) => {
                const market = marketById(l.marketId);
                if (l.direction === 'sell') {
                  const inst = state.inventory.find((i) => i.instanceId === l.instanceId);
                  const price =
                    market && inst?.itemId ? sellPriceCp(market, inst.itemId, commerce) : undefined;
                  return (
                    <tr key={lineKey(l)}>
                      <td>
                        Sell: {inst?.name ?? l.instanceId}
                        {market && <span class="cf-shop-src"> — {market.name}</span>}
                      </td>
                      <td class="num">×{l.qty}</td>
                      <td class="num sell">{price !== undefined ? `+${fmtCoins(price * l.qty)}` : '—'}</td>
                      <td class="act">
                        <button
                          type="button"
                          class="undo"
                          title="keep it"
                          onClick={() => setBasket(basket.filter((x) => x !== l))}
                        >
                          −
                        </button>
                      </td>
                    </tr>
                  );
                }
                const price = market ? buyPriceCp(market, l.itemId, commerce) : undefined;
                const best = bestBuy(l.itemId, ownedFeatIds, commerce);
                const cheaper =
                  best && price !== undefined && best.market.id !== l.marketId && best.priceCp < price
                    ? best
                    : undefined;
                return (
                  <tr key={lineKey(l)}>
                    <td>
                      {itemName(l.itemId) ?? l.itemId}
                      {l.choice ? ` (${l.choice})` : ''}
                      {l.marketId !== 'waldheim' && market && (
                        <span class="cf-shop-src"> — {market.name}</span>
                      )}
                      {cheaper && (
                        <button
                          type="button"
                          class="cf-shop-hint"
                          title={`${cheaper.market.name} — ${cheaper.market.location} — ${cheaper.market.marketType}`}
                          onClick={() => rerouteLine(l, cheaper.market.id)}
                        >
                          {fmtCoins(cheaper.priceCp)} at {cheaper.market.name}
                        </button>
                      )}
                    </td>
                    <td class="num">×{l.qty}</td>
                    <td class="num">{price !== undefined ? fmtCoins(price * l.qty) : '—'}</td>
                    <td class="act">
                      <button
                        type="button"
                        class="undo"
                        title="put it back"
                        onClick={() => setBasket(basket.filter((x) => x !== l))}
                      >
                        −
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p class={`cf-basket-total${remainingCp < 0 ? ' over' : ''}`}>
          {totals.sells > 0 && `Buys ${fmtCoins(totals.buys)} · Sells ${fmtCoins(totals.sells)} · `}
          {totals.sells === 0 && `Total ${fmtCoins(totals.buys)} · `}
          Coin {fmtCoins(state.wealthCp)} · After{' '}
          {remainingCp < 0 ? `short ${fmtCoins(-remainingCp)}` : fmtCoins(remainingCp)}
        </p>
      </div>
    </div>
  );
}
