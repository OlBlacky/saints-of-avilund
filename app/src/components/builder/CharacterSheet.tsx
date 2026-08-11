// The Character Sheet, Page 3 · Gear (builder spec §8) — the first sheet
// page built. Shown by the builder once a character is Complete. Sections:
// Weapons and Armour with their full stat blocks from rules data, Equipment
// grouped by location (containers with subtotals), the Load line, Wealth,
// and The Markets for downtime trips — where selling finally lives.
//
// Sell prices appear only where an accessible Market buys the item, source
// named; rolled Starting Gear shows no price until its Session lock lifts,
// silently. Moves and trips are logged events through the engine gate.

import { useState } from 'preact/hooks';

import { classById } from '../../lib/classes';
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
import { featById } from '../../lib/feats';
import { bestSell, itemWeightLb, marketById } from '../../lib/markets';
import { fill, QUIRKS } from '../../lib/quirks';
import type { RecordEvent } from '../../lib/record/events';
import type { ItemLocation } from '../../lib/record/events';
import type { Breakdown, DerivedSheet } from '../../lib/record/derive';
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

const PAGES: { n: number; label: string; built: boolean }[] = [
  { n: 1, label: 'Page 1 · The Character', built: true },
  { n: 2, label: 'Page 2 · Attacks & Abilities', built: false },
  { n: 3, label: 'Page 3 · Gear', built: true },
  { n: 4, label: 'Page 4 · Advancement Log', built: true },
  { n: 5, label: 'Page 5 · Full Detail', built: false },
];

const signed = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);

/** A derived number that shows its work on hover. */
function Bd({ b, plain }: { b: Breakdown; plain?: boolean }) {
  const work = b.parts.map((p) => `${p.label} ${signed(p.value)}`).join('\n');
  return <span title={work || undefined}>{plain ? b.total : signed(b.total)}</span>;
}

/** One log line per event — the record read back as prose. */
function describeEvent(e: RecordEvent): string {
  switch (e.type) {
    case 'class-chosen': return `Chose the ${classById(e.classId)?.name ?? e.classId}`;
    case 'subclass-chosen': return `Chose the ${e.subclassId} Subclass`;
    case 'flaw-taken': return `Took a Flaw: −1 ${e.attr}`;
    case 'quirk-rolled': return `Rolled the Quirk & Starting Gear package: ${e.quirkName}${e.gearName ? ` · ${e.gearName}` : ''}${e.rerollsUsed ? ` (reroll ${e.rerollsUsed})` : ''}`;
    case 'crystallized': return 'Finished — creation complete, play begins at Level 0';
    case 'milestone-granted': return `Milestone granted${e.note ? ` — ${e.note}` : ''}`;
    case 'session-logged': return `Session logged${e.note ? ` — ${e.note}` : ''}`;
    case 'attribute-bought': return `+1 ${e.attr}`;
    case 'ability-bought': return `Bought ${e.instanceName ?? e.ref.ability} (${e.ref.category})`;
    case 'ability-renamed': return `Renamed an instance to ${e.name}`;
    case 'ability-advanced': return `Advanced ${e.ref.ability}: ${e.variable} to Rank ${e.toRank}`;
    case 'class-added': return `Added the ${classById(e.classId)?.name ?? e.classId}`;
    case 'offence-bought': return `+1 ${e.attr} Offence`;
    case 'defence-bought': return `+1 ${e.attr} Defence`;
    case 'hp-bought': return 'Bought HP';
    case 'skill-trained': return `Trained ${e.skill}`;
    case 'skill-advanced': return `+1 Rank in ${e.skill}`;
    case 'proficiency-bought': return `Bought proficiency: ${e.group}`;
    case 'proficiency-advanced': return `Advanced proficiency: ${e.group}`;
    case 'language-bought': return `Learned ${e.language}`;
    case 'feat-bought': return `Took the Feat: ${featById(e.featId)?.name ?? e.featId}${e.choices ? ` (${Object.values(e.choices).join(', ')})` : ''}`;
    case 'feat-advanced': return `Climbed ${featById(e.featId)?.name ?? e.featId} to Rank ${e.toRank}`;
    case 'companion-named': return `Named the Companion: ${e.name}`;
    case 'companion-advanced': return `Advanced the Companion's ${e.ladder} to Rank ${e.toRank}`;
    case 'transaction': {
      const n = e.lines.length;
      const markets = [...new Set(e.lines.map((l) => marketById(l.marketId)?.name ?? l.marketId))];
      return `${e.note === 'creation shopping' ? 'Creation shopping' : 'A market trip'} — ${n} line${n === 1 ? '' : 's'} at ${markets.join(', ')}`;
    }
    case 'item-granted': return `Received ${e.name ?? e.itemId}${e.qty && e.qty > 1 ? ` ×${e.qty}` : ''}${e.note ? ` — ${e.note}` : ''}`;
    case 'item-moved': return `Moved an item`;
  }
}

interface Props {
  name: string;
  state: CharacterState;
  sheet: DerivedSheet;
  events: RecordEvent[];
  basket: BasketLine[];
  setBasket: (basket: BasketLine[]) => void;
  append: (e: RecordEvent) => void;
  why: (e: RecordEvent) => string | null;
}

export default function CharacterSheet({ name, state, sheet, events, basket, setBasket, append, why }: Props) {
  const [page, setPage] = useState(1);
  // Commerce is a deliberate act: the Markets show only once opened. An
  // unfinished trip (a Basket with lines) re-opens itself — you are still
  // at market. Nothing is logged until the trip commits.
  const [commerceOpen, setCommerceOpen] = useState(basket.length > 0);
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
          // Selling is commerce: putting an item up walks you to market.
          setCommerceOpen(true);
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
              key={p.n}
              type="button"
              class={page === p.n ? 'on' : ''}
              disabled={!p.built}
              title={p.built ? undefined : 'This page is still being built'}
              onClick={() => setPage(p.n)}
            >
              {p.label}
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

      {page === 1 && (() => {
        const cls = state.classId ? classById(state.classId) : undefined;
        const sub = cls?.subclasses.find((s) => s.id === state.subclassId);
        const quirk = state.quirk?.id ? QUIRKS.find((q) => q.id === state.quirk!.id) : undefined;
        return (
          <>
            <section class="cf-step">
              <p class="cf-railsub">
                {cls?.name ?? '—'}{sub ? ` · ${sub.name}` : ''} · Level {sheet.level} ·
                Milestones {state.milestones} · Bank {state.bank.major} Major / {state.bank.minor} Minor
              </p>
              {state.quirk && (
                <div class="cf-quirk">
                  <p class="cf-quirk-eyebrow">Quirk</p>
                  <h4>{fill(state.quirk.name, state.quirk.slots)}</h4>
                  {quirk && <p class="cf-quirk-mech">{fill(quirk.mechanic, state.quirk.slots)}</p>}
                  {quirk && <p class="cf-quirk-eso">{fill(quirk.esoteric, state.quirk.slots)}</p>}
                </div>
              )}
            </section>

            <section class="cf-step">
              <h3>Attributes</h3>
              <p class="cf-how">Hover any number for its parts.</p>
              <table class="cf-shop-table sheet-table">
                <thead>
                  <tr><th>Attr</th><th>Val</th><th>Off</th><th>Save</th><th>Un</th><th>Arm</th></tr>
                </thead>
                <tbody>
                  {sheet.attributes.map((a) => (
                    <tr key={a.attr}>
                      <td>{a.attr}</td>
                      <td class="num"><Bd b={a.value} /></td>
                      <td class="num"><Bd b={a.offence} /></td>
                      <td class="num"><Bd b={a.save} /></td>
                      <td class="num"><Bd b={a.unarmouredDefence} plain /></td>
                      <td class="num"><Bd b={a.armouredDefence} plain /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p class="cf-railline">
                HP <Bd b={sheet.hitPoints} plain /> · Speed <Bd b={sheet.speed} plain />' ·
                DR <Bd b={sheet.damageReduction} plain /> · Initiative <Bd b={sheet.initiative} /> ·
                AC {sheet.attributes.find((a) => a.attr === 'Constitution')!.armouredDefence.total}
              </p>
            </section>

            <section class="cf-step">
              <h3>Skills</h3>
              <table class="cf-shop-table sheet-table">
                <tbody>
                  {sheet.skills.map((s) => (
                    <tr key={s.skill}>
                      <td>{s.skill}{s.isClassSkill ? ' ·' : ''}{s.untrained ? <span class="cf-shop-src"> untrained</span> : ''}</td>
                      <td>{s.attr.slice(0, 3)}</td>
                      <td class="num"><Bd b={s.value} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.skillGeneralists.map((g) => (
                <p key={g.attr} class="cf-railline">Trained in every {g.attr.slice(0, 3)} Skill at {signed(g.total)}</p>
              ))}
            </section>

            <section class="cf-step">
              <h3>Proficiencies &amp; Languages</h3>
              <p>
                {sheet.proficiencies.map((p, i) => (
                  <span key={p.group}>
                    {i > 0 && ' · '}
                    {p.group} {signed(p.rank)}{!p.advanceable && <span class="cf-shop-src"> (fixed)</span>}
                  </span>
                ))}
              </p>
              <p class="cf-railline">{sheet.languages.join(' · ')}</p>
            </section>

            {state.feats.length > 0 && (
              <section class="cf-step">
                <h3>Feats</h3>
                <table class="cf-shop-table sheet-table">
                  <tbody>
                    {state.feats.map((f) => {
                      const feat = featById(f.featId);
                      return (
                        <tr key={f.featId}>
                          <td>
                            {feat?.name ?? f.featId}
                            {f.choices && <span class="cf-shop-src"> · {Object.values(f.choices).join(', ')}</span>}
                            {feat?.ladder && <span class="cf-shop-src"> · Rank {f.rank}</span>}
                          </td>
                          <td class="cf-shop-src">{feat?.brief}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {sheet.situational.length > 0 && (
              <section class="cf-step">
                <h3>Situational</h3>
                <ul>
                  {sheet.situational.map((s) => (
                    <li key={`${s.source}/${s.text}`}>{s.text} <span class="cf-shop-src">— {s.source}</span></li>
                  ))}
                </ul>
              </section>
            )}
          </>
        );
      })()}

      {page === 4 && (
        <section class="cf-step">
          <h3>Advancement Log</h3>
          <p class="cf-how">Every event on the record, in order — the build back-trackable to legal.</p>
          <table class="cf-shop-table sheet-table">
            <tbody>
              {events.map((e, i) => (
                <tr key={e.id}>
                  <td class="num">{i + 1}</td>
                  <td>{describeEvent(e)}</td>
                  <td class="cf-shop-src">{e.source !== 'player' ? e.source : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {page === 3 && weapons.length > 0 && (
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

      {page === 3 && wearables.length > 0 && (
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

      {page === 3 && (
      <section class="cf-step">
        <h3>Equipment</h3>
        {equipment.length === 0 ? (
          <p class="cf-how">Nothing but the clothes on your back.</p>
        ) : (
          <div class="scroll">
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
          </div>
        )}
      </section>

      )}

      {page === 3 && !commerceOpen && (
        <section class="cf-step">
          <h3>Commerce</h3>
          <div class="cf-line">
            <button type="button" class="cf-roll" onClick={() => setCommerceOpen(true)}>
              Open Commerce
            </button>
          </div>
        </section>
      )}

      {page === 3 && commerceOpen && (
      <section class="cf-step">
        <h3>The Markets</h3>
        <p class="cf-how">
          A trip to market: buy and sell in one Basket; the trip commits as one event.
        </p>
        <MarketShop state={state} basket={basket} setBasket={setBasket} />
        <div class="cf-line">
          <button
            type="button"
            class="cf-crystallize"
            disabled={tripBlocked !== null}
            title={tripBlocked ?? undefined}
            onClick={() => { doTrip(); setCommerceOpen(false); }}
          >
            Finish the trip{totals.net !== 0 && ` (${totals.net > 0 ? '+' : '−'}${fmtCoins(Math.abs(totals.net))})`}
          </button>
          <button
            type="button"
            class="cf-roll"
            title="Close the Markets; an emptied Basket leaves nothing behind"
            onClick={() => { setBasket([]); setCommerceOpen(false); }}
          >
            Leave the market
          </button>
        </div>
      </section>
      )}
    </div>
  );
}
