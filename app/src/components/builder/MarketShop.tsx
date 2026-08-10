// The Shop (builder spec §11): one view for every shopping moment. This
// first use is creation shopping — buys only, the Basket committed by the
// flow's Finish. The Waldheim family is always listed (locked markets by
// title, with the Feat that opens them); Regional Markets appear only once
// their Feat is owned.
//
// Thin like the rest of the builder: prices come from lib/markets.ts, and
// the Basket becomes one transaction event at Finish — the engine is the
// gate. A top-level component (never defined inside another's render): it
// holds a search input, and focus dies with identity churn.

import { useState } from 'preact/hooks';

import { CATALOGUE, fmtCoins, fmtPrice, fmtWeight } from '../../lib/equipment';
import { FEATS } from '../../lib/feats';
import {
  accessibleMarkets,
  buyPriceCp,
  itemName,
  itemWeightLb,
  listedMarkets,
  marketById,
} from '../../lib/markets';
import type { Market } from '../../lib/markets';
import type { CharacterState } from '../../lib/record/replay';

export interface BasketLine {
  marketId: string;
  itemId: string;
  qty: number;
}

export function commerceRankOf(state: CharacterState): number {
  return state.feats.find((f) => f.featId === 'commerce-ladder')?.rank ?? 0;
}

export function basketTotalCp(basket: BasketLine[], commerceRank: number): number {
  return basket.reduce((total, line) => {
    const market = marketById(line.marketId);
    const price = market ? buyPriceCp(market, line.itemId, commerceRank) : undefined;
    return total + (price ?? 0) * line.qty;
  }, 0);
}

/** The Feat that opens a locked Market, for the shopfront note. */
function openingFeatName(market: Market): string | undefined {
  if (market.access.kind !== 'feat') return undefined;
  const featId = market.access.featId;
  return FEATS.find((f) => f.id === featId)?.name;
}

const sectionOf = (itemId: string): string =>
  CATALOGUE.find((e) => e.id === itemId)?.section ?? 'Trade Goods';

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
  const active = marketById(openIds.has(pickedId) ? pickedId : 'waldheim')!;

  const q = query.trim().toLowerCase();
  const rows = active.sells
    .map((line) => ({
      itemId: line.itemId,
      name: itemName(line.itemId) ?? line.itemId,
      weightLb: itemWeightLb(line.itemId),
      priceCp: buyPriceCp(active, line.itemId, commerce)!,
      section: sectionOf(line.itemId),
    }))
    .filter((r) => !q || r.name.toLowerCase().includes(q));
  const sections = [...new Set(rows.map((r) => r.section))];

  const qtyOf = (itemId: string) =>
    basket.find((l) => l.marketId === active.id && l.itemId === itemId)?.qty ?? 0;

  const setQty = (itemId: string, qty: number) => {
    const rest = basket.filter((l) => !(l.marketId === active.id && l.itemId === itemId));
    setBasket(qty > 0 ? [...rest, { marketId: active.id, itemId, qty }] : rest);
  };

  const totalCp = basketTotalCp(basket, commerce);
  const remainingCp = state.wealthCp - totalCp;

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
          <input
            class="cf-shop-search"
            placeholder="Search the stalls…"
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
          />
          <div class="cf-shop-list">
            {sections.map((section) => (
              <details key={`${active.id}/${section}`} class="cf-shop-fold" open={Boolean(q) || sections.length === 1}>
                <summary>{section}</summary>
                <table class="cf-shop-table">
                  <tbody>
                    {rows
                      .filter((r) => r.section === section)
                      .map((r) => {
                        const inBasket = qtyOf(r.itemId);
                        return (
                          <tr key={r.itemId}>
                            <td>{r.name}</td>
                            <td class="num">{fmtPrice(r.priceCp)}</td>
                            <td class="num">{fmtWeight(r.weightLb)}</td>
                            <td class="act">
                              {inBasket > 0 && (
                                <>
                                  <button type="button" class="undo" onClick={() => setQty(r.itemId, inBasket - 1)}>−</button>
                                  <span class="cf-shop-qty">{inBasket}</span>
                                </>
                              )}
                              <button type="button" class="buy" onClick={() => setQty(r.itemId, inBasket + 1)}>+</button>
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
                const price = market ? buyPriceCp(market, l.itemId, commerce) : undefined;
                return (
                  <tr key={`${l.marketId}/${l.itemId}`}>
                    <td>
                      {itemName(l.itemId) ?? l.itemId}
                      {l.marketId !== 'waldheim' && market && (
                        <span class="cf-shop-src"> — {market.name}</span>
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
          Total {fmtCoins(totalCp)} · Coin {fmtCoins(state.wealthCp)} · After{' '}
          {remainingCp < 0 ? `short ${fmtCoins(-remainingCp)}` : fmtCoins(remainingCp)}
        </p>
      </div>
    </div>
  );
}
