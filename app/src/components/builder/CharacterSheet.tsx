// The Character Sheet, Page 3 · Gear (builder spec §8) — the first sheet
// page built. Shown by the builder once a character is Complete. Sections:
// Weapons and Armour with their full stat blocks from rules data, Equipment
// grouped by location (containers with subtotals), the Load line, Wealth,
// and The Markets for downtime trips — where selling finally lives.
//
// Sell prices appear only where an accessible Market buys the item, source
// named; rolled Starting Gear shows no price until its Session lock lifts,
// silently. Moves and trips are logged events through the engine gate.

import {
  ARMOURS,
  ARMOUR_TIER_AC,
  MELEE_WEAPONS,
  RANGED_WEAPONS,
  SHIELDS,
  containerCoefficient,
  fmtCoins,
  fmtWeight,
} from '../../lib/equipment';
import { bestSell, itemWeightLb } from '../../lib/markets';
import type { RecordEvent } from '../../lib/record/events';
import type { ItemLocation } from '../../lib/record/events';
import type { DerivedSheet } from '../../lib/record/derive';
import type { CharacterState, OwnedItem } from '../../lib/record/replay';
import MarketShop, { basketTotalsCp, commerceRankOf } from './MarketShop';
import type { BasketLine } from './MarketShop';

let counter = 0;
function mk<T extends RecordEvent['type']>(
  type: T,
  data: Omit<Extract<RecordEvent, { type: T }>, 'id' | 'at' | 'source' | 'type'>,
): RecordEvent {
  counter += 1;
  return {
    id: `${Date.now().toString(36)}-s${counter}`,
    at: new Date().toISOString(),
    source: 'player',
    type,
    ...data,
  } as RecordEvent;
}

const PAGES = [
  'Page 1 · The Character',
  'Page 2 · Attacks & Abilities',
  'Page 3 · Gear',
  'Page 4 · Advancement Log',
  'Page 5 · Full Detail',
];

interface Props {
  name: string;
  state: CharacterState;
  sheet: DerivedSheet;
  basket: BasketLine[];
  setBasket: (basket: BasketLine[]) => void;
  append: (e: RecordEvent) => void;
  why: (e: RecordEvent) => string | null;
}

export default function CharacterSheet({ name, state, sheet, basket, setBasket, append, why }: Props) {
  const ownedFeatIds = state.feats.map((f) => f.featId);
  const commerce = commerceRankOf(state);

  const weaponFor = (i: OwnedItem) =>
    [...MELEE_WEAPONS, ...RANGED_WEAPONS].find((w) => w.id === i.itemId);
  const armourFor = (i: OwnedItem) => ARMOURS.find((a) => a.id === i.itemId);
  const shieldFor = (i: OwnedItem) => SHIELDS.find((s) => s.id === i.itemId);

  const weapons = state.inventory.filter((i) => weaponFor(i));
  const wearables = state.inventory.filter((i) => armourFor(i) || shieldFor(i));
  const equipment = state.inventory.filter((i) => !weaponFor(i) && !armourFor(i) && !shieldFor(i));

  const containers = state.inventory.filter(
    (i) => i.itemId && containerCoefficient(i.itemId) !== undefined,
  );

  /** Direct contents of a container, and their raw weight. */
  const contentsOf = (instanceId: string) =>
    state.inventory.filter((i) => i.location === `in:${instanceId}`);
  const subtotalLb = (instanceId: string) =>
    contentsOf(instanceId).reduce(
      (t, i) => t + (i.itemId ? (itemWeightLb(i.itemId) ?? 0) : 0) * i.qty,
      0,
    );

  const locationLabel = (loc: string): string => {
    if (loc === 'equipped') return 'Equipped';
    if (loc === 'carried') return 'Carried';
    if (loc === 'home') return 'At Home';
    const holder = state.inventory.find((i) => i.instanceId === loc.slice(3));
    return `In ${holder?.name ?? 'a container'}`;
  };

  /** The location dropdown + the logged move behind it. */
  const moveControl = (item: OwnedItem) => (
    <select
      class="sheet-move"
      value={item.location}
      onChange={(e) => {
        const location = (e.target as HTMLSelectElement).value as ItemLocation;
        if (location !== item.location) append(mk('item-moved', { instanceId: item.instanceId, location }));
      }}
    >
      <option value="equipped">Equipped</option>
      <option value="carried">Carried</option>
      <option value="home">At Home</option>
      {containers
        .filter((c) => c.instanceId !== item.instanceId)
        .map((c) => (
          <option key={c.instanceId} value={`in:${c.instanceId}`}>In {c.name}</option>
        ))}
    </select>
  );

  /** The sell control: best reachable buyer, source named — or nothing.
   * Rolled Starting Gear stays silent until its Session lock lifts. */
  const sellControl = (item: OwnedItem) => {
    if (!item.itemId) return null;
    if (item.origin === 'starting-gear' && state.sessions < 1) return null;
    const best = bestSell(item.itemId, ownedFeatIds, commerce);
    if (!best) return null;
    const inBasket = basket
      .filter((l): l is Extract<BasketLine, { direction: 'sell' }> => l.direction === 'sell')
      .filter((l) => l.instanceId === item.instanceId)
      .reduce((t, l) => t + l.qty, 0);
    const soldOut = inBasket >= item.qty;
    return (
      <button
        type="button"
        class="cf-shop-hint"
        disabled={soldOut}
        title={`${best.market.name} — ${best.market.location} — ${best.market.marketType}`}
        onClick={() => {
          const key = `s/${best.market.id}/${item.instanceId}`;
          const rest = basket.filter(
            (l) => !(l.direction === 'sell' && `s/${l.marketId}/${l.instanceId}` === key),
          );
          setBasket([
            ...rest,
            { direction: 'sell', marketId: best.market.id, instanceId: item.instanceId, qty: inBasket + 1 },
          ]);
        }}
      >
        Sell {fmtCoins(best.priceCp)} — {best.market.name}
      </button>
    );
  };

  const rowWeight = (item: OwnedItem) =>
    item.itemId ? fmtWeight((itemWeightLb(item.itemId) ?? 0) * item.qty || null) : '—';

  const totals = basketTotalsCp(basket, commerce, state);
  const tripLines = basket.filter((l) => l.qty > 0);
  const tripEvent = mk('transaction', { lines: tripLines, note: 'a market trip' });
  const tripBlocked = tripLines.length === 0 ? 'The Basket is empty' : why(tripEvent);

  const doTrip = () => {
    if (tripBlocked) return;
    append(mk('transaction', { lines: tripLines, note: 'a market trip' }));
    setBasket([]);
  };

  return (
    <div class="sheet">
      <header class="sheet-head">
        <h2>{name || 'Unnamed'}</h2>
        <div class="cf-viewtoggle sheet-pages" role="group">
          {PAGES.map((p) => (
            <button
              key={p}
              type="button"
              class={p.startsWith('Page 3') ? 'on' : ''}
              disabled={!p.startsWith('Page 3')}
              title={p.startsWith('Page 3') ? undefined : 'This page is still being built'}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <section class="cf-step">
        <div class="sheet-strip">
          <span><strong>Coin</strong> {fmtCoins(state.wealthCp)}</span>
          <span>
            <strong>Load</strong> {sheet.load.totalLb} lb of {sheet.load.baseLb} lb · {sheet.load.band}
            {sheet.load.effect && <span class="cf-shop-src"> · {sheet.load.effect}</span>}
          </span>
          <span class="sheet-record">
            Sessions {state.sessions} · Milestones {state.milestones}
            <button type="button" class="buy" onClick={() => append(mk('session-logged', {}))}>Log a Session</button>
            <button type="button" class="buy" onClick={() => append(mk('milestone-granted', {}))}>Grant a Milestone</button>
          </span>
        </div>
      </section>

      {weapons.length > 0 && (
        <section class="cf-step">
          <h3>Weapons</h3>
          <div class="scroll">
            <table class="cf-shop-table sheet-table">
              <thead>
                <tr><th>Weapon</th><th>Group</th><th>Damage</th><th>Range</th><th>Properties</th><th>Wt</th><th>Location</th><th></th></tr>
              </thead>
              <tbody>
                {weapons.map((i) => {
                  const w = weaponFor(i)!;
                  return (
                    <tr key={i.instanceId}>
                      <td>{i.name}{i.qty > 1 ? ` ×${i.qty}` : ''}</td>
                      <td>{w.group}</td>
                      <td>{w.damage} {w.type}{w.hands === '2H' ? ' · 2H' : ''}</td>
                      <td>{w.range ?? '—'}</td>
                      <td>{w.properties.length ? w.properties.join(', ') : '—'}</td>
                      <td class="num">{rowWeight(i)}</td>
                      <td>{moveControl(i)}</td>
                      <td class="act">{sellControl(i)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {wearables.length > 0 && (
        <section class="cf-step">
          <h3>Armour &amp; Shields</h3>
          <div class="scroll">
            <table class="cf-shop-table sheet-table">
              <thead>
                <tr><th>Piece</th><th>AC</th><th>DR</th><th>Drawbacks</th><th>Wt</th><th>Location</th><th></th></tr>
              </thead>
              <tbody>
                {wearables.map((i) => {
                  const a = armourFor(i);
                  const s = shieldFor(i);
                  const drawbacks = a
                    ? [
                        a.speedPenaltyFt ? `−${a.speedPenaltyFt}' Speed` : null,
                        a.stealthPenalty ? `−${a.stealthPenalty} Stealth` : null,
                        a.strReq !== null ? `Str +${a.strReq}` : null,
                      ].filter(Boolean).join(' · ') || '—'
                    : s!.speedPenaltyFt ? `−${s!.speedPenaltyFt}' Speed` : '—';
                  return (
                    <tr key={i.instanceId}>
                      <td>{i.name}{i.qty > 1 ? ` ×${i.qty}` : ''}</td>
                      <td>+{a ? ARMOUR_TIER_AC[a.tier] : s!.ac}</td>
                      <td>{a ? (a.drNote ? `${a.dr} (${a.drNote})` : a.dr) : s!.dr || '—'}</td>
                      <td>{drawbacks}</td>
                      <td class="num">{rowWeight(i)}</td>
                      <td>{moveControl(i)}</td>
                      <td class="act">{sellControl(i)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section class="cf-step">
        <h3>Equipment</h3>
        {equipment.length === 0 ? (
          <p class="cf-how">Nothing but the clothes on your back.</p>
        ) : (
          <table class="cf-shop-table sheet-table">
            <tbody>
              {equipment.map((i) => (
                <tr key={i.instanceId}>
                  <td>
                    {i.name}{i.qty > 1 ? ` ×${i.qty}` : ''}
                    {i.itemId && containerCoefficient(i.itemId) !== undefined && contentsOf(i.instanceId).length > 0 && (
                      <span class="cf-shop-src"> — holds {fmtWeight(subtotalLb(i.instanceId) || null)}</span>
                    )}
                  </td>
                  <td class="num">{rowWeight(i)}</td>
                  <td>{locationLabel(i.location)}</td>
                  <td>{moveControl(i)}</td>
                  <td class="act">{sellControl(i)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section class="cf-step">
        <h3>The Markets</h3>
        <p class="cf-how">
          A downtime trip: buy and sell in one Basket; the trip commits as one event.
        </p>
        <MarketShop state={state} basket={basket} setBasket={setBasket} />
        <div class="cf-line">
          <button
            type="button"
            class="cf-crystallize"
            disabled={tripBlocked !== null}
            title={tripBlocked ?? undefined}
            onClick={doTrip}
          >
            Finish the trip{totals.net !== 0 && ` (${totals.net > 0 ? '+' : '−'}${fmtCoins(Math.abs(totals.net))})`}
          </button>
        </div>
      </section>
    </div>
  );
}
