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

import { VAR_ORDER, resolveValue } from '../../lib/abilities';
import type { Ability } from '../../lib/abilities';
import { CATEGORIES } from '../../lib/category-abilities';
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
import { LANGUAGES } from '../../lib/languages';
import type { Language } from '../../lib/languages';
import { bestSell, itemWeightLb, marketById } from '../../lib/markets';
import { fill, QUIRKS } from '../../lib/quirks';
import type { RecordEvent } from '../../lib/record/events';
import type { ItemLocation } from '../../lib/record/events';
import type { Breakdown, DerivedSheet } from '../../lib/record/derive';
import { languageAllowance } from '../../lib/record/replay';
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
  { n: 2, label: 'Page 2 · Attacks & Abilities', built: true },
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
  // Page 2 state: curated attack lines (hidden, never deleted) and the
  // table-scratch Conditions (never logged, reset freely).
  const [hiddenAttacks, setHiddenAttacks] = useState<string[]>([]);
  const [showHiddenAttacks, setShowHiddenAttacks] = useState(false);
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionEntry, setConditionEntry] = useState('');
  const [langPick, setLangPick] = useState('');
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
   * Selling is commerce: the buttons exist only during an open session.
   * Rolled Starting Gear stays silent until its Session lock lifts, and a
   * buyer paying zero is no buyer at all. */
  const sellControl = (item: OwnedItem) => {
    if (!commerceOpen) return null;
    if (!item.itemId) return null;
    if (item.origin === 'starting-gear' && state.sessions < 1) return null;
    const best = bestSell(item.itemId, ownedFeatIds, commerce);
    if (!best || best.priceCp < 1) return null;
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

  /** Split a stack: carve some off into a new stack in the same place —
   * it then moves (or sells) with its own controls. */
  const splitControl = (item: OwnedItem) => {
    if (item.qty < 2) return null;
    return (
      <button
        type="button"
        class="undo"
        title="split this stack"
        onClick={() => {
          const n = Number(prompt(`Split how many of the ${item.qty} × ${item.name} into their own stack?`));
          if (!Number.isInteger(n) || n < 1 || n >= item.qty) return;
          append(mk('item-split', { instanceId: item.instanceId, qty: n, location: item.location }));
        }}
      >
        split
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
              <div class="scroll">
                <table class="cf-shop-table sheet-table">
                  <thead>
                    <tr>
                      <th>Attribute</th><th class="num">Value</th><th class="num">Offence</th>
                      <th class="num">Save</th><th class="num">Unarmoured Defence</th>
                      <th class="num">Armoured Defence</th>
                    </tr>
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
              </div>
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
                      <td>{s.attr}</td>
                      <td class="num"><Bd b={s.value} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheet.skillGeneralists.map((g) => (
                <p key={g.attr} class="cf-railline">Trained in every {g.attr} Skill at {signed(g.total)}</p>
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
              {languageAllowance(state) > state.freeLanguagesUsed && (
                <p class="cf-line">
                  <span class="cf-shop-hint" style="cursor:default">
                    {languageAllowance(state) - state.freeLanguagesUsed} free language
                    {languageAllowance(state) - state.freeLanguagesUsed === 1 ? '' : 's'} still untaken
                  </span>{' '}
                  <select class="sheet-move" value={langPick} onChange={(e) => setLangPick((e.target as HTMLSelectElement).value)}>
                    <option value="">Take a language…</option>
                    {LANGUAGES.filter((l) => !sheet.languages.includes(l)).map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    class="buy"
                    disabled={!langPick}
                    onClick={() => {
                      append(mk('language-bought', { language: langPick as Language }));
                      setLangPick('');
                    }}
                  >
                    Take
                  </button>
                </p>
              )}
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

      {page === 2 && (() => {
        const shortTotals: Record<string, number> = Object.fromEntries(
          sheet.attributes.map((a) => [a.attr.slice(0, 3), a.value.total]),
        );
        const offenceOf = (attrFull: string) =>
          sheet.attributes.find((a) => a.attr === attrFull)?.offence.total ?? 0;
        const profOf = (group: string) =>
          sheet.proficiencies.find((p) => p.group === group)?.rank;
        const findCard = (category: string, ability: string): Ability | undefined =>
          CATEGORIES.find((c) => c.name === category)?.abilities.find((a) => a.name === ability);

        // Play-mode text: attribute tokens annotated with this build's math.
        const noteAttrs = (text: string): string =>
          text.replace(/\b(Str|Dex|Con|Int|Wis|Cha)\b(\s*([+×x])\s*(\d+))?/g, (whole, attr: string, _e, op?: string, num?: string) => {
            const a = shortTotals[attr];
            if (a === undefined) return whole;
            if (op && num) {
              const b = Number(num);
              return `${whole} (${op === '+' ? a + b : a * b})`;
            }
            return `${whole} (${a})`;
          });

        // Full math for the Attacks table: [W] becomes the weapon's die,
        // attribute tokens become their totals.
        const dmgFor = (text: string, die: string): string =>
          text
            .replace(/(\d+)\[W\]/g, (_, n: string) => (n === '1' ? die : `${n}×${die}`))
            .replace(/\[W\]/g, die)
            .replace(/\b(Str|Dex|Con|Int|Wis|Cha)\b/g, (m) => String(shortTotals[m] ?? m));

        const tableWeapons = weapons.filter((i) => i.location === 'equipped' || i.location === 'carried');

        interface AttackRow { key: string; name: string; toHit: number; untrained: boolean; vs: string; damage: string }
        const rows: AttackRow[] = [];

        const meleeAttr = (w: (typeof MELEE_WEAPONS)[number]) => {
          const finesse = w.properties.some((p) => p.startsWith('Finesse'));
          const str = shortTotals.Str;
          const dex = shortTotals.Dex;
          return finesse && dex > str ? 'Dexterity' : 'Strength';
        };

        for (const item of tableWeapons) {
          const w = weaponFor(item)!;
          const ranged = RANGED_WEAPONS.some((r) => r.id === w.id);
          const attrFull = ranged ? 'Dexterity' : meleeAttr(w);
          const p = profOf(w.group);
          rows.push({
            key: `basic/${item.instanceId}`,
            name: `Basic Attack — ${item.name}`,
            toHit: offenceOf(attrFull) + (p ?? -1),
            untrained: p === undefined,
            vs: 'vs AC',
            damage: dmgFor(`${w.damage} + ${attrFull.slice(0, 3)}`, w.damage).replace(/^.*?\+/, `${w.damage} +`),
          });
        }
        rows.push({
          key: 'basic/unarmed',
          name: 'Basic Unarmed',
          toHit: offenceOf('Strength') + (profOf('Unarmed/Natural') ?? -1),
          untrained: profOf('Unarmed/Natural') === undefined,
          vs: 'vs AC',
          damage: `1d3 + ${shortTotals.Str}`,
        });

        for (const owned of state.abilities) {
          const card = findCard(owned.ref.category, owned.ref.ability);
          if (!card || card.mode !== 'Attack') continue;
          const atkText = resolveValue(card.vars.attack, owned.ranks.attack) ?? '';
          const [attrFull, vsDef] = atkText.split(' vs ');
          const dmgText = resolveValue(card.vars.damage, owned.ranks.damage) ?? '—';
          const label = owned.name ?? owned.ref.ability;
          if (dmgText.includes('[W]')) {
            for (const item of tableWeapons) {
              const w = weaponFor(item)!;
              const p = profOf(w.group);
              rows.push({
                key: `${label}/${item.instanceId}`,
                name: `${label} — ${item.name}`,
                toHit: offenceOf(attrFull) + (p ?? -1),
                untrained: p === undefined,
                vs: vsDef ? `vs ${vsDef}` : '',
                damage: dmgFor(dmgText, w.damage),
              });
            }
          } else {
            rows.push({
              key: label,
              name: label,
              toHit: offenceOf(attrFull),
              untrained: false,
              vs: vsDef ? `vs ${vsDef}` : '',
              damage: dmgFor(dmgText, ''),
            });
          }
        }

        const shown = rows.filter((r) => !hiddenAttacks.includes(r.key));
        const toggleHide = (key: string) =>
          setHiddenAttacks((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]));

        return (
          <>
            <section class="cf-step">
              <h3>Attacks</h3>
              <p class="cf-how">
                Generated from your attack Abilities and carried weapons. Hide the lines you never
                use.
              </p>
              <div class="scroll">
                <table class="cf-shop-table sheet-table">
                  <thead>
                    <tr><th>Attack</th><th>To Hit</th><th></th><th>Damage</th><th></th></tr>
                  </thead>
                  <tbody>
                    {(showHiddenAttacks ? rows : shown).map((r) => (
                      <tr key={r.key} class={hiddenAttacks.includes(r.key) ? 'sheet-hiddenrow' : undefined}>
                        <td>{r.name}{r.untrained && <span class="cf-chip" title="Not proficient — the −1 is counted in.">untrained</span>}</td>
                        <td class="num">{signed(r.toHit)}</td>
                        <td>{r.vs}</td>
                        <td>{r.damage}</td>
                        <td class="act">
                          <button type="button" class="undo" title={hiddenAttacks.includes(r.key) ? 'show this line' : 'hide this line'} onClick={() => toggleHide(r.key)}>
                            {hiddenAttacks.includes(r.key) ? 'show' : 'hide'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hiddenAttacks.length > 0 && (
                <p class="cf-railline">
                  <button type="button" class="undo" onClick={() => setShowHiddenAttacks(!showHiddenAttacks)}>
                    {showHiddenAttacks ? 'Tuck the hidden lines away' : `Show ${hiddenAttacks.length} hidden line${hiddenAttacks.length === 1 ? '' : 's'}`}
                  </button>
                </p>
              )}
            </section>

            <section class="cf-step">
              <h3>Conditions</h3>
              <p class="cf-how">Table scratch — nothing here enters the record.</p>
              <p class="sheet-conditions">
                {conditions.map((c) => (
                  <button key={c} type="button" class="cf-chip" title="clear" onClick={() => setConditions(conditions.filter((x) => x !== c))}>
                    {c} ×
                  </button>
                ))}
                <input
                  placeholder="Add a condition…"
                  value={conditionEntry}
                  onInput={(e) => setConditionEntry((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && conditionEntry.trim()) {
                      setConditions([...conditions, conditionEntry.trim()]);
                      setConditionEntry('');
                    }
                  }}
                />
              </p>
            </section>

            <section class="cf-step">
              <h3>Abilities</h3>
              <div class="sheet-cards">
                {state.abilities.map((owned) => {
                  const card = findCard(owned.ref.category, owned.ref.ability);
                  if (!card) return null;
                  const val = (k: (typeof VAR_ORDER)[number]) => resolveValue(card.vars[k], owned.ranks[k]);
                  const freq = val('frequency');
                  const strip = [
                    val('action') && `Action: ${val('action')}`,
                    val('range') && val('range') !== '—' && `Range: ${val('range')}`,
                    val('targets') && `Targets: ${val('targets')}`,
                    val('attack') && `${val('attack')}`,
                  ].filter(Boolean);
                  const body = [
                    ['Damage', val('damage')],
                    ['Effect', val('effects')],
                    ['Duration', val('duration')],
                  ].filter(([, v]) => v && v !== '—' && v !== 'Instant') as [string, string][];
                  return (
                    <div key={owned.instanceId ?? `${owned.ref.category}/${owned.ref.ability}`} class="sheet-card">
                      <p class="cf-quirk-eyebrow">
                        {owned.ref.category}
                        {freq && freq !== '—' && <span class="sheet-card-freq"> · {freq}</span>}
                      </p>
                      <h4>
                        {owned.name ?? owned.ref.ability}
                        {owned.choices && <span class="cf-shop-src"> · {Object.values(owned.choices).join(', ')}</span>}
                      </h4>
                      {strip.length > 0 && <p class="sheet-card-strip">{strip.join(' · ')}</p>}
                      {body.map(([label, v]) => (
                        <p key={label} class="cf-quirk-mech"><strong>{label}.</strong> {noteAttrs(v)}</p>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>
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
                      <td class="act">{splitControl(i)}{sellControl(i)}</td>
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
                      <td class="act">{splitControl(i)}{sellControl(i)}</td>
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
                  <td class="act">{splitControl(i)}{sellControl(i)}</td>
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
