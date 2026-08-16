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
  itemNote,
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
import { MAX_QUALITIES, qualitiesFor, qualityById } from '../../lib/masterwork';
import type { Quality } from '../../lib/masterwork';
import { allProficiencies } from '../../lib/record/replay';
import type { CharacterState } from '../../lib/record/replay';

export type BasketLine =
  | { direction: 'buy'; marketId: string; itemId: string; qty: number; choice?: string; qualities?: string[] }
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
      // Commissioned Qualities ride the line at the master's price.
      for (const qid of line.qualities ?? []) buys += qualityById(qid)?.priceCp ?? 0;
    } else {
      const inst = state.inventory.find((i) => i.instanceId === line.instanceId);
      if (inst?.itemId) sells += (sellPriceCp(market, inst.itemId, commerceRank) ?? 0) * line.qty;
    }
  }
  return { buys, sells, net: sells - buys };
}

/** The Masterwork Quality menu, printed whole (Les, Aug 16 2026): every
 * Quality with its effect, days, and cost, a tick box against each. Owned
 * work shows ticked and locked; a blocked tick is greyed with its reason.
 * The shop and the sheet both print this chart — folded shut by default,
 * the summary line counting the work (Les, same day: the chart is tall). */
export function QualityMenu({ itemId, owned = [], picked, onToggle, title }: {
  itemId: string;
  /** Quality ids already worked into the piece — ticked and locked. */
  owned?: string[];
  /** Pending ticks. */
  picked: string[];
  onToggle: (q: Quality, on: boolean) => void;
  title?: string;
}) {
  const menu = qualitiesFor(itemId);
  if (menu.length === 0) return null;
  const held = [...owned, ...picked];
  const tally =
    held.length > 0
      ? ` — ${owned.length ? `${owned.length} worked in` : ''}${owned.length && picked.length ? ', ' : ''}${picked.length ? `${picked.length} ticked` : ''}`
      : '';
  return (
    <details class="mw-menu">
      <summary>{title ?? 'Masterwork Qualities'}{tally}</summary>
      <table class="mw-menu-table">
        <thead>
          <tr><th></th><th>Name</th><th>Quality</th><th>Days</th><th>Cost</th></tr>
        </thead>
        <tbody>
          {menu.map((q) => {
            const has = owned.includes(q.id);
            const on = has || picked.includes(q.id);
            const excluded =
              !on &&
              held.some((id) => q.excludes?.includes(id) || qualityById(id)?.excludes?.includes(q.id));
            const capFull = !on && held.length >= MAX_QUALITIES;
            const blocked = has
              ? undefined
              : excluded
                ? 'cannot share the item with the ticked work'
                : capFull
                  ? `a master can only work ${MAX_QUALITIES} Qualities into one item`
                  : undefined;
            return (
              <tr key={q.id} class={blocked ? 'is-blocked' : undefined} title={blocked}>
                <td>
                  <input
                    type="checkbox"
                    checked={on}
                    disabled={has || Boolean(blocked)}
                    onChange={(ev) => onToggle(q, (ev.target as HTMLInputElement).checked)}
                  />
                </td>
                <td>{q.name}</td>
                <td>{q.effect}</td>
                <td class="num">{q.days}</td>
                <td class="num">{has ? 'worked in' : fmtCoins(q.priceCp)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </details>
  );
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
        tip: `Not proficient with ${prof} — −${penalty} to physical skill checks.`,
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
      tip: `Not proficient with ${shield.proficiency} — −${penalty} to physical skill checks, and −1 to hit when you bash with it.`,
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
  const ownedAbilities = state.abilities.map((a) => a.ref);
  const commerce = commerceRankOf(state);
  const origin = state.origin ?? null;
  const listed = listedMarkets(ownedFeatIds, ownedAbilities, origin);
  const openIds = new Set(accessibleMarkets(ownedFeatIds, ownedAbilities, origin).map((m) => m.id));

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
      best: bestBuy(line.itemId, ownedFeatIds, commerce, ownedAbilities, origin),
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
    const prior = basket.find((l) => lineKey(l) === key);
    // Commissioned work rides the line; a commissioned piece is one of a kind.
    const qualities = prior?.direction === 'buy' ? prior.qualities : undefined;
    const rest = basket.filter((l) => lineKey(l) !== key);
    setBasket(
      qty > 0
        ? [...rest, { direction: 'buy', marketId, itemId, qty: qualities?.length ? 1 : qty, choice, qualities }]
        : rest,
    );
  };

  /** Tick or untick a Quality on a buy line — ticking with no line yet puts
   * the piece in the Basket. */
  const toggleQuality = (itemId: string, choice: string | undefined, q: Quality, on: boolean) => {
    const key = `b/${active.id}/${itemId}/${choice ?? ''}`;
    const line = basket.find((l) => lineKey(l) === key);
    const current = line?.direction === 'buy' ? line.qualities ?? [] : [];
    if (!line && !on) return;
    const next = on ? [...current, q.id] : current.filter((id) => id !== q.id);
    const rest = basket.filter((l) => lineKey(l) !== key);
    setBasket([
      ...rest,
      {
        direction: 'buy', marketId: active.id, itemId,
        qty: next.length > 0 ? 1 : line?.qty ?? 1,
        choice, qualities: next.length > 0 ? next : undefined,
      },
    ]);
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
                      .flatMap((r) => {
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
                        // This market's own Masterwork menu prints whole
                        // under the piece — tick the work to commission it
                        // with the purchase (a tick puts it in the Basket).
                        const menu = qualitiesFor(r.itemId);
                        const menuHere = menu.length > 0 && menu[0].marketId === active.id;
                        const line = basket.find((l) => lineKey(l) === `b/${active.id}/${r.itemId}/${picked ?? ''}`);
                        const ticked = line?.direction === 'buy' ? line.qualities ?? [] : [];
                        const chartRows = menuHere
                          ? [
                              <tr key={`${r.itemId}-menu`} class="cf-shop-menurow">
                                <td colSpan={4}>
                                  <QualityMenu
                                    itemId={r.itemId}
                                    picked={ticked}
                                    onToggle={(q, on) => toggleQuality(r.itemId, picked ?? undefined, q, on)}
                                  />
                                </td>
                              </tr>,
                            ]
                          : [];
                        return [
                          <tr key={r.itemId}>
                            <td>
                              {r.name}
                              {r.chips.map((c) => (
                                <span class="cf-chip" title={c.tip}>{c.label}</span>
                              ))}
                              {itemNote(r.itemId) && (
                                <span class="cf-shop-note">{itemNote(r.itemId)}</span>
                              )}
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
                          </tr>,
                          ...chartRows,
                        ];
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
          <p class="cf-how">Empty. What you buy arrives Equipped.</p>
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
                const workCp = (l.qualities ?? []).reduce((t, id) => t + (qualityById(id)?.priceCp ?? 0), 0);
                const best = bestBuy(l.itemId, ownedFeatIds, commerce, ownedAbilities, origin);
                const cheaper =
                  best && price !== undefined && best.market.id !== l.marketId && best.priceCp < price && !l.qualities
                    ? best
                    : undefined;
                return (
                  <tr key={lineKey(l)}>
                    <td>
                      {itemName(l.itemId) ?? l.itemId}
                      {l.choice ? ` (${l.choice})` : ''}
                      {l.qualities && (
                        <span class="cf-shop-src">
                          {' '}with {l.qualities.map((id) => qualityById(id)?.name ?? id).join(', ')}
                        </span>
                      )}
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
                    <td class="num">{price !== undefined ? fmtCoins(price * l.qty + workCp) : '—'}</td>
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
