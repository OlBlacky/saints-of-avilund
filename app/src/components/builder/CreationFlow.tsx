// The Character Builder's creation flow (builder spec §6): the Identity Box
// (free edit, any time), the spine (ordered, reversible, keep-and-flag), and
// the finale (the rolled Quirk, take-the-last rerolls, crystallization).
//
// Thin by design: every rule lives in the record engine. The component only
// builds candidate events, asks tryEvent() whether they're legal, and renders
// the replayed result. Pre-crystallization the log is a draft (spec §9): the
// spine may replace or remove its own events freely; keep-and-flag shows the
// damage when an upstream choice changes.

import { useEffect, useMemo, useState } from 'preact/hooks';

import { VAR_LABELS, VAR_ORDER, resolveValue } from '../../lib/abilities';
import { briefFor } from '../../lib/ability-briefs';
import { CATEGORIES } from '../../lib/category-abilities';
import {
  ARMOUR_PROFICIENCIES,
  CLASSES,
  IMPLEMENT_GROUPS,
  LANGUAGES,
  WEAPON_GROUPS,
  classById,
} from '../../lib/classes';
import type { ClassDef, SubclassDef } from '../../lib/classes';
import { rollPackage } from '../../lib/gear';
import { PLACES } from '../../lib/quirks';
import type { Attribute, SeesawCategory } from '../../lib/quirks';
import { SKILLS } from '../../lib/skills';
import { derive } from '../../lib/record/derive';
import type { RecordEvent } from '../../lib/record/events';
import {
  accessibleCategories,
  classSkills,
  grantedProficiencies,
  replay,
  tryEvent,
} from '../../lib/record/replay';

const DRAFT_KEY = 'sova-builder-draft-v1';
const ATTRIBUTES: Attribute[] = [
  'Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma',
];
const REROLLS = 2;

interface Identity {
  name: string;
  origin: string;
  age: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  notes: string;
}

interface Draft {
  identity: Identity;
  events: RecordEvent[];
  rerollsLeft: number;
  /** Display texts of the current package roll (the event stores ids + fills). */
  quirkText?: { name: string; mechanic: string; esoteric: string; category?: SeesawCategory };
  gearText?: { name: string; mechanic: string; provenance: string; category?: SeesawCategory };
}

const EMPTY_DRAFT: Draft = {
  identity: { name: '', origin: '', age: '', heightFt: '', heightIn: '', weight: '', notes: '' },
  events: [],
  rerollsLeft: REROLLS,
};

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    // A corrupt draft should never brick the builder; start fresh.
  }
  return EMPTY_DRAFT;
}

/** The hover tooltip on a Class card: its grants, one line each. */
function classTip(c: ClassDef): string {
  const lines = [
    `Class Attribute: ${c.classAttribute}`,
    `Ability Category: ${c.abilityCategory}`,
    `Class HP: ${c.classHP}`,
    `Class Skills: ${c.classSkills.join(', ')}`,
  ];
  if (c.weaponProficiencies.length) lines.push(`Weapons: ${c.weaponProficiencies.join(', ')}`);
  if (c.armourProficiencies.length) lines.push(`Armour: ${c.armourProficiencies.join(', ')}`);
  if (c.languages?.length) lines.push(`Languages: ${c.languages.join(', ')}`);
  return lines.join('\n');
}

/** The hover tooltip on a Subclass card: what it adds, one line each. */
function subclassTip(s: SubclassDef): string {
  const lines = [
    `Class Attribute: ${s.classAttribute}`,
    `Ability Category: ${s.abilityCategory}`,
    `Additional Class Skills: ${s.additionalClassSkills.join(', ')}`,
  ];
  if (s.weaponProficiencies.length) lines.push(`Weapons: ${s.weaponProficiencies.join(', ')}`);
  if (s.armourProficiencies.length) lines.push(`Armour: ${s.armourProficiencies.join(', ')}`);
  if (s.implementProficiencies?.length) lines.push(`Implements: ${s.implementProficiencies.join(', ')}`);
  if (s.languages?.length) lines.push(`Languages: ${s.languages.join(', ')}`);
  return lines.join('\n');
}

let counter = 0;
function mk<T extends RecordEvent['type']>(
  type: T,
  data: Omit<Extract<RecordEvent, { type: T }>, 'id' | 'at' | 'source' | 'type'>,
): RecordEvent {
  counter += 1;
  return {
    id: `${Date.now().toString(36)}-${counter}`,
    at: new Date().toISOString(),
    source: 'player',
    type,
    ...data,
  } as RecordEvent;
}

export default function CreationFlow() {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDraft(loadDraft());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft, loaded]);

  const { events } = draft;
  const { state, flags } = useMemo(() => replay(events), [events]);
  const sheet = useMemo(() => derive(state), [state]);

  const setIdentity = (k: keyof Identity, v: string) =>
    setDraft((d) => ({ ...d, identity: { ...d.identity, [k]: v } }));

  /** Append a candidate if the engine allows it (the UI disables illegal
   * buttons, but this is the actual gate). */
  const append = (e: RecordEvent) => {
    if (tryEvent(events, e).length > 0) return;
    setDraft((d) => ({ ...d, events: [...d.events, e] }));
  };

  /** Draft privilege: remove the LAST event matching a predicate. */
  const removeLast = (pred: (e: RecordEvent) => boolean) =>
    setDraft((d) => {
      for (let i = d.events.length - 1; i >= 0; i -= 1) {
        if (pred(d.events[i])) {
          return { ...d, events: [...d.events.slice(0, i), ...d.events.slice(i + 1)] };
        }
      }
      return d;
    });

  /** Draft privilege: replace the single event of a type (class, subclass, quirk). */
  const replaceOne = (type: RecordEvent['type'], e: RecordEvent) =>
    setDraft((d) => ({ ...d, events: [...d.events.filter((x) => x.type !== type), e] }));

  /** Legality + reason for a candidate, for button state and tooltip. */
  const why = (e: RecordEvent): string | null => {
    const fs = tryEvent(events, e);
    return fs.length ? fs.map((f) => f.message).join('; ') : null;
  };

  /** Flagged events, for marking the damage where it lives in the UI. */
  const flaggedById = useMemo(() => new Map(flags.map((f) => [f.eventId, f.message])), [flags]);
  const warnFor = (pred: (e: RecordEvent) => boolean): string | undefined => {
    const msgs = events
      .filter((e) => flaggedById.has(e.id) && pred(e))
      .map((e) => flaggedById.get(e.id)!);
    return msgs.length ? msgs.join('; ') : undefined;
  };

  const Warn = ({ msg }: { msg?: string }) =>
    msg ? (
      <span class="warnmark" title={msg}>
        ⚑
      </span>
    ) : null;

  const crystallized = state.crystallized;
  const cls = state.classId ? classById(state.classId) : undefined;
  const sub = cls?.subclasses.find((s) => s.id === state.subclassId);
  const quirkRolled = Boolean(state.quirk);

  /** Annotate attribute expressions in a Ladder value with this character's
   * math: "Heal Wis + 1 HP" → "Heal Wis + 1 HP (2+1=3 total)"; "Int rounds"
   * → "Int rounds (2)". Short attribute tokens only — prose stays prose. */
  const ATTR_SHORT_TOTALS: Record<string, number> = Object.fromEntries(
    sheet.attributes.map((a) => [a.attr.slice(0, 3), a.value.total]),
  );
  const annotate = (text: string): string =>
    text.replace(
      /\b(Str|Dex|Con|Int|Wis|Cha)\b(\s*([+×x])\s*(\d+))?/g,
      (whole, attr: string, _expr, op?: string, num?: string) => {
        const a = ATTR_SHORT_TOTALS[attr];
        if (a === undefined) return whole;
        if (op && num) {
          const b = Number(num);
          const total = op === '+' ? a + b : a * b;
          return `${whole} (${a}${op === '+' ? '+' : '×'}${b}=${total} total)`;
        }
        return `${whole} (${a})`;
      },
    );

  // ── Small render helpers ────────────────────────────────────────────────

  const Pips = ({ kind, n }: { kind: 'M' | 'm'; n: number }) => (
    <span class="bank-pips" title={`${n} ${kind === 'M' ? 'Major' : 'Minor'} Advances`}>
      {Array.from({ length: Math.max(0, n) }, (_, i) => (
        <span key={i} class={`pip ${kind}`} />
      ))}
      {n === 0 && <span class="none">0</span>}
    </span>
  );

  const Buy = ({ ev, label }: { ev: RecordEvent; label: string }) => {
    const reason = why(ev);
    return (
      <button
        type="button"
        class="buy"
        disabled={crystallized || reason !== null}
        title={reason ?? undefined}
        onClick={() => append(ev)}
      >
        {label}
      </button>
    );
  };

  const Undo = ({ pred, title }: { pred: (e: RecordEvent) => boolean; title: string }) => (
    <button
      type="button"
      class="undo"
      disabled={crystallized || !events.some(pred)}
      title={title}
      onClick={() => removeLast(pred)}
    >
      −
    </button>
  );

  // ── The finale ──────────────────────────────────────────────────────────

  const doRoll = () => {
    // A quirk without gear is a pre-package draft; rolling it again is a
    // fresh roll, not a reroll.
    const isReroll = Boolean(state.quirk && state.gear);
    if (isReroll && draft.rerollsLeft <= 0) return;
    const { quirk: q, gear: g } = rollPackage();
    const used = isReroll ? REROLLS - draft.rerollsLeft + 1 : 0;
    setDraft((d) => ({
      ...d,
      rerollsLeft: isReroll ? d.rerollsLeft - 1 : d.rerollsLeft,
      quirkText: { name: q.name, mechanic: q.mechanic, esoteric: q.esoteric, category: q.category },
      gearText: { name: g.name, mechanic: g.mechanic, provenance: g.provenance, category: g.category },
      events: [
        ...d.events.filter((x) => x.type !== 'quirk-rolled'),
        mk('quirk-rolled', {
          quirkId: q.id, quirkName: q.name, slots: q.fills, rerollsUsed: used,
          gearId: g.id, gearName: g.name, gearSlots: g.fills,
        }),
      ],
    }));
  };

  const canCrystallize =
    !crystallized && cls && sub && quirkRolled && Boolean(state.gear) && flags.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────

  if (!loaded) return <div class="cf-loading">…</div>;

  return (
    <div class="cf">
      {/* The keep-and-flag panel: errors block finishing, never browsing.
          Sticky, so an upstream change can never break something off-screen
          without notice. */}
      {flags.length > 0 && (
        <div class="cf-flags">
          <strong>A choice changed something below — to resolve before the finale:</strong>
          <ul>
            {flags.map((f) => (
              <li key={f.eventId}>
                {f.message}
                <button
                  type="button"
                  class="undo"
                  title="remove this choice"
                  onClick={() => removeLast((e) => e.id === f.eventId)}
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div class="cf-grid">
        <div class="cf-main">
          {/* ── The Identity Box ── */}
          <section class="cf-step">
            <h2>The Character</h2>
            <p class="cf-how">Editable at any time. None of this is mechanical.</p>
            <div class="cf-identity">
              <label>Name <input value={draft.identity.name} onInput={(e) => setIdentity('name', (e.target as HTMLInputElement).value)} placeholder="Unnamed" /></label>
              <label>Place of origin
                <select value={draft.identity.origin} onChange={(e) => setIdentity('origin', (e.target as HTMLSelectElement).value)}>
                  <option value=""></option>
                  {PLACES.map((p) => (
                    <option key={p.value} value={p.value}>{p.value}</option>
                  ))}
                </select>
              </label>
              <label>Age
                <input type="number" min="0" max="120" class="num" value={draft.identity.age} onInput={(e) => setIdentity('age', (e.target as HTMLInputElement).value)} />
              </label>
              <label>Height
                <span class="cf-units">
                  <input type="number" min="0" max="8" class="num" value={draft.identity.heightFt} onInput={(e) => setIdentity('heightFt', (e.target as HTMLInputElement).value)} />
                  <span class="cf-unit">ft</span>
                  <input type="number" min="0" max="11" class="num" value={draft.identity.heightIn} onInput={(e) => setIdentity('heightIn', (e.target as HTMLInputElement).value)} />
                  <span class="cf-unit">in</span>
                </span>
              </label>
              <label>Weight
                <span class="cf-units">
                  <input type="number" min="0" max="500" step="5" class="num" value={draft.identity.weight} onInput={(e) => setIdentity('weight', (e.target as HTMLInputElement).value)} />
                  <span class="cf-unit">lb</span>
                </span>
              </label>
              <label class="wide">Notes <input value={draft.identity.notes} onInput={(e) => setIdentity('notes', (e.target as HTMLInputElement).value)} /></label>
            </div>
          </section>

          {/* ── Step 1 · Class ── */}
          <section class="cf-step">
            <h2>Step 1 · Choose a Class</h2>
            <div class="cf-cards">
              {CLASSES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  class={`cf-card ${state.classId === c.id ? 'sel' : ''}`}
                  disabled={crystallized}
                  title={classTip(c)}
                  onClick={() => replaceOne('class-chosen', mk('class-chosen', { classId: c.id }))}
                >
                  <span class="cf-card-name">{c.name}</span>
                  <span class="cf-card-sub">{c.portfolio}</span>
                  <span class="cf-card-line">{c.classAttribute} · {c.abilityCategory} · HP {c.classHP}</span>
                </button>
              ))}
            </div>
          </section>

          {/* ── Step 2 · Subclass ── */}
          {cls && (
            <section class="cf-step">
              <h2>Step 2 · Choose a Subclass</h2>
              <div class="cf-cards">
                {cls.subclasses.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    class={`cf-card ${state.subclassId === s.id ? 'sel' : ''}`}
                    disabled={crystallized}
                    title={subclassTip(s)}
                    onClick={() => replaceOne('subclass-chosen', mk('subclass-chosen', { subclassId: s.id }))}
                  >
                    <span class="cf-card-name">{s.name}</span>
                    <span class="cf-card-line">{s.classAttribute} · {s.abilityCategory}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Step 3 · Majors ── */}
          {sub && (
            <section class="cf-step">
              <h2>Step 3 · Spend your Major Advances</h2>
              <p class="cf-how">Attributes climb the triangular curve (+1 costs 1, +2 costs 2 more, +3 costs 3 more). Abilities cost 1 Major from your two Categories.</p>

              <h3>Attributes</h3>
              <p class="cf-how">Step any Attribute down past +0 to take a Flaw. Up to two Attributes may drop to −1, each granting +1 Major.</p>
              <div class="cf-attrs">
                {ATTRIBUTES.map((a) => {
                  const val = sheet.attributes.find((x) => x.attr === a)!.value.total;
                  const isClassAttr = cls!.classAttribute === a || sub.classAttribute === a;
                  const warn = warnFor(
                    (e) =>
                      (e.type === 'attribute-bought' || e.type === 'flaw-taken') && e.attr === a,
                  );
                  const bought = state.attributeRanks[a] ?? 0;
                  const flawed = state.flaws.includes(a);
                  const FLAW_RULE =
                    'Reduce up to 2 Attributes by 1 at creation. Each grants +1 Major.';

                  // The down-step: refund bought points first; below +0 it
                  // takes the Flaw. The up-step restores a Flaw before buying.
                  const flawWhy = why(mk('flaw-taken', { attr: a }));
                  const downTitle = bought > 0 ? 'refund the last point' : (flawWhy ?? FLAW_RULE);
                  const downDisabled = crystallized || (bought === 0 && flawWhy !== null);
                  const onDown = () => {
                    if (bought > 0) removeLast((e) => e.type === 'attribute-bought' && e.attr === a);
                    else append(mk('flaw-taken', { attr: a }));
                  };

                  const upEv = mk('attribute-bought', { attr: a });
                  const upWhy = flawed ? null : why(upEv);
                  const upTitle = flawed ? `restore ${a} (returns the Flaw’s Major)` : (upWhy ?? undefined);
                  const onUp = () => {
                    if (flawed) removeLast((e) => e.type === 'flaw-taken' && e.attr === a);
                    else append(upEv);
                  };

                  return (
                    <div key={a} class={`cf-attr ${warn ? 'warn' : ''}`}>
                      <span class="cf-attr-name">{a}{isClassAttr && <span class="star" title="Class Attribute"> ★</span>}<Warn msg={warn} /></span>
                      <button type="button" class="undo" disabled={downDisabled} title={downTitle} onClick={onDown}>−</button>
                      <span class="cf-attr-val" title={val < 0 ? FLAW_RULE : undefined}>
                        {val >= 0 ? `+${val}` : `−${Math.abs(val)}`}
                      </span>
                      <button type="button" class="buy" disabled={crystallized || upWhy !== null} title={upTitle} onClick={onUp}>+1</button>
                    </div>
                  );
                })}
              </div>

              <h3>Abilities</h3>
              {/* Purchases stranded by an upstream change (their Category is
                  no longer accessible) stay visible here, marked, until
                  resolved — they never silently vanish. */}
              {(() => {
                const orphans = events.filter(
                  (e) =>
                    flaggedById.has(e.id) &&
                    (e.type === 'ability-bought' || e.type === 'ability-advanced'),
                );
                if (orphans.length === 0) return null;
                return (
                  <div class="cf-chiprow">
                    {orphans.map((e) => (
                      <span key={e.id} class="cf-chip warn">
                        <Warn msg={flaggedById.get(e.id)} />
                        {e.type === 'ability-bought' || e.type === 'ability-advanced'
                          ? `${e.ref.ability} (${e.ref.category})`
                          : ''}
                        <button
                          type="button"
                          class="undo"
                          title="remove this purchase"
                          onClick={() => removeLast((x) => x.id === e.id)}
                        >
                          −
                        </button>
                      </span>
                    ))}
                  </div>
                );
              })()}
              <p class="cf-how">
                An Ability costs 1 Major. Each owned Ability may also take one Minor and one Major
                advance per Level.
              </p>
              {accessibleCategories(state).map((catName) => {
                const cat = CATEGORIES.find((c) => c.name === catName);
                if (!cat) return null;
                return (
                  <div key={catName} class="cf-abilities">
                    <h4>{catName}</h4>
                    <table class="cf-abtable">
                      <tbody>
                        {cat.abilities.map((ab) => {
                          const ref = { category: catName, ability: ab.name };
                          const brief = briefFor(catName, ab.name);

                          // The advancement strip, shared by plain cards and
                          // builder instances (which pass their instanceId).
                          // Each Ladder renders as its whole track: steps
                          // already climbed, the value the Ability RESTS at
                          // (emphasized), the next step as the priced button,
                          // and the rest of the road greyed out ahead.
                          const AdvStrip = ({ owned }: { owned: (typeof state.abilities)[number] }) => {
                            const clip = (s: string, n = 40) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
                            const show = (s: string) => clip(annotate(s));
                            const full = (s: string) => annotate(s);
                            return (
                              <>
                                {VAR_ORDER.filter((k) => ab.vars[k]?.advances?.length).map((k) => {
                                  const variable = ab.vars[k]!;
                                  const rank = owned.ranks[k] ?? 0;
                                  const steps = [variable.base ?? '—', ...variable.advances!.map((a) => a.value)];
                                  return (
                                    <span key={k} class="cf-advline">
                                      <span class="cf-advlabel">{VAR_LABELS[k]}</span>
                                      {steps.map((val, i) => {
                                        const cost = i > 0 ? variable.advances![i - 1].cost : undefined;
                                        const sep = i > 0 && <span class="cf-stepsep">›</span>;
                                        if (i < rank) {
                                          return (
                                            <>
                                              {sep}
                                              <span class="cf-stepchip passed" title={`${full(val)} — climbed past`}>{show(val)}</span>
                                            </>
                                          );
                                        }
                                        if (i === rank) {
                                          return (
                                            <>
                                              {sep}
                                              <span class="cf-stepchip rests" title={`${full(val)} — where it rests now`}>{show(val)}</span>
                                              {rank > 0 && (
                                                <Undo
                                                  pred={(e) =>
                                                    e.type === 'ability-advanced' &&
                                                    e.ref.category === catName &&
                                                    e.ref.ability === ab.name &&
                                                    e.variable === k &&
                                                    (owned.instanceId ? e.instanceId === owned.instanceId : true)
                                                  }
                                                  title="refund this Rank"
                                                />
                                              )}
                                            </>
                                          );
                                        }
                                        if (i === rank + 1) {
                                          return (
                                            <>
                                              {sep}
                                              <Buy
                                                ev={mk('ability-advanced', {
                                                  ref,
                                                  instanceId: owned.instanceId,
                                                  variable: k,
                                                  toRank: rank + 1,
                                                })}
                                                label={`${show(val)} · ${cost}`}
                                              />
                                            </>
                                          );
                                        }
                                        return (
                                          <>
                                            {sep}
                                            <span class="cf-stepchip ahead" title={`${full(val)} — further along the Ladder (${cost})`}>
                                              {show(val)} · {cost}
                                            </span>
                                          </>
                                        );
                                      })}
                                    </span>
                                  );
                                })}
                              </>
                            );
                          };

                          if (ab.builder) {
                            const instances = state.abilities.filter(
                              (o) => o.ref.category === catName && o.ref.ability === ab.name,
                            );
                            return (
                              <>
                                <tr key={ab.name} class={instances.length ? 'owned' : ''}>
                                  <td class="cf-abname">{ab.name}</td>
                                  <td class="cf-abbrief">{brief}</td>
                                  <td class="cf-abctl">
                                    {!crystallized && (
                                      <BuildControl
                                        choice={ab.builderChoice}
                                        noun={ab.builderNoun ?? 'Spell'}
                                        onBuild={(choices) =>
                                          append(
                                            mk('ability-bought', {
                                              ref,
                                              instanceId: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
                                              instanceName: ab.name,
                                              choices,
                                            }),
                                          )
                                        }
                                      />
                                    )}
                                  </td>
                                </tr>
                                {instances.map((inst) => (
                                  <tr key={inst.instanceId} class="cf-abadv">
                                    <td colspan={3}>
                                      <span class="cf-advline cf-instline">
                                        <input
                                          class="cf-instname"
                                          value={inst.name}
                                          disabled={crystallized}
                                          title={`name this ${(ab.builderNoun ?? 'Spell').toLowerCase()}`}
                                          onInput={(ev2) => {
                                            const name = (ev2.target as HTMLInputElement).value;
                                            setDraft((d) => ({
                                              ...d,
                                              events: d.events.map((x) =>
                                                x.type === 'ability-bought' && x.instanceId === inst.instanceId
                                                  ? { ...x, instanceName: name }
                                                  : x,
                                              ),
                                            }));
                                          }}
                                        />
                                        {inst.choices && (
                                          <span class="cf-instchoice">{Object.values(inst.choices).join(' · ')}</span>
                                        )}
                                        {!crystallized && (
                                          <button
                                            type="button"
                                            class="undo"
                                            title={`refund this ${(ab.builderNoun ?? 'Spell').toLowerCase()} and its advances`}
                                            onClick={() =>
                                              setDraft((d) => ({
                                                ...d,
                                                events: d.events.filter(
                                                  (x) =>
                                                    !(
                                                      (x.type === 'ability-bought' ||
                                                        x.type === 'ability-advanced' ||
                                                        x.type === 'ability-renamed') &&
                                                      x.instanceId === inst.instanceId
                                                    ),
                                                ),
                                              }))
                                            }
                                          >
                                            −
                                          </button>
                                        )}
                                      </span>
                                      <AdvStrip owned={inst} />
                                    </td>
                                  </tr>
                                ))}
                              </>
                            );
                          }

                          const owned = state.abilities.find(
                            (o) => o.ref.category === catName && o.ref.ability === ab.name,
                          );
                          return (
                            <>
                              <tr key={ab.name} class={owned ? 'owned' : ''}>
                                <td class="cf-abname">{ab.name}</td>
                                <td class="cf-abbrief">{brief}</td>
                                <td class="cf-abctl">
                                  {owned ? (
                                    !crystallized && (
                                      <button
                                        type="button"
                                        class="undo"
                                        title="refund this Ability and its advances"
                                        onClick={() =>
                                          removeLast(
                                            (e) =>
                                              (e.type === 'ability-bought' &&
                                                e.ref.category === catName &&
                                                e.ref.ability === ab.name) ||
                                              (e.type === 'ability-advanced' &&
                                                e.ref.category === catName &&
                                                e.ref.ability === ab.name),
                                          )
                                        }
                                      >
                                        −
                                      </button>
                                    )
                                  ) : (
                                    <Buy ev={mk('ability-bought', { ref })} label="Buy · 1 M" />
                                  )}
                                </td>
                              </tr>
                              {owned && (
                                <tr class="cf-abadv">
                                  <td colspan={3}>
                                    <AdvStrip owned={owned} />
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </section>
          )}

          {/* ── Step 4 · Minors ── */}
          {sub && (
            <section class="cf-step">
              <h2>Step 4 · Spend your Minor Advances</h2>

              <h3>Offences &amp; Defences</h3>
              <p class="cf-how">One Rank track lifts Defence and Save together.</p>
              <div class="cf-od">
                <span class="cf-od-h"></span>
                <span class="cf-od-h num">Offence</span>
                <span class="cf-od-h"></span>
                <span class="cf-od-h num">Save · Def</span>
                <span class="cf-od-h"></span>
                {ATTRIBUTES.map((a) => {
                  const da = sheet.attributes.find((x) => x.attr === a)!;
                  const f = (n: number) => (n >= 0 ? `+${n}` : `−${Math.abs(n)}`);
                  return (
                    <>
                      <span class="cf-od-name">{a}</span>
                      <span class="cf-od-val">{f(da.offence.total)}</span>
                      <span class="cf-od-btns">
                        <Undo pred={(e) => e.type === 'offence-bought' && e.attr === a} title="refund" />
                        <Buy ev={mk('offence-bought', { attr: a })} label="+1" />
                      </span>
                      <span class="cf-od-val">{f(da.save.total)} · {da.unarmouredDefence.total}</span>
                      <span class="cf-od-btns">
                        <Undo pred={(e) => e.type === 'defence-bought' && e.attr === a} title="refund" />
                        <Buy ev={mk('defence-bought', { attr: a })} label="+1" />
                      </span>
                    </>
                  );
                })}
              </div>

              <h3>Hit Points</h3>
              <div class="cf-line">
                <span>HP {sheet.hitPoints.total} <em class="cf-work">({sheet.hitPoints.parts.map((p) => `${p.label} ${p.value}`).join(' · ')})</em></span>
                <Undo pred={(e) => e.type === 'hp-bought'} title="refund" />
                <Buy ev={mk('hp-bought', {})} label={`+${cls!.classHP} HP`} />
              </div>

              <h3>Skills</h3>
              <p class="cf-how">Class Skills arrive Trained (+0); Ranks climb +1 now, +2 at Level 3, +3 at Level 5. Off-list Skills can be Trained but never pass +1. Untrained is −1.</p>
              <div class="cf-chiprow">
                {sheet.skills.map((s) => (
                  <span key={s.skill} class={`cf-chip ${s.isClassSkill ? 'owned' : 'trained'}`}>
                    {s.skill} {s.value.total >= 0 ? `+${s.value.total}` : s.value.total}
                    <Undo
                      pred={(e) =>
                        (e.type === 'skill-advanced' && e.skill === s.skill) ||
                        (e.type === 'skill-trained' && e.skill === s.skill)
                      }
                      title="refund"
                    />
                    <Buy ev={mk('skill-advanced', { skill: s.skill })} label="+1" />
                  </span>
                ))}
              </div>
              <div class="cf-line">
                <TrainPicker
                  crystallized={crystallized}
                  taken={sheet.skills.map((s) => s.skill)}
                  onTrain={(skill) => append(mk('skill-trained', { skill }))}
                  whyFor={(skill) => why(mk('skill-trained', { skill }))}
                />
              </div>

              <h3>Proficiencies</h3>
              <p class="cf-how">Class and Subclass proficiencies advance; bought proficiencies stay at +0.</p>
              <div class="cf-chiprow">
                {sheet.proficiencies.map((p) => (
                  <span key={p.group} class="cf-chip owned">
                    {p.group}{p.rank > 0 && <strong> +{p.rank}</strong>}{p.advanceable && <span class="star" title="advanceable"> ▲</span>}
                    {p.advanceable && (
                      <>
                        <Undo pred={(e) => e.type === 'proficiency-advanced' && e.group === p.group} title="refund" />
                        <Buy ev={mk('proficiency-advanced', { group: p.group as never })} label="+1" />
                      </>
                    )}
                    {!p.advanceable && (
                      <Undo pred={(e) => e.type === 'proficiency-bought' && e.group === p.group} title="refund" />
                    )}
                  </span>
                ))}
              </div>
              <div class="cf-line">
                <GroupPicker
                  label="Buy a proficiency (1 m)"
                  options={[...WEAPON_GROUPS, ...ARMOUR_PROFICIENCIES, ...IMPLEMENT_GROUPS].filter(
                    (g) => !grantedProficiencies(state).includes(g) && !state.boughtProficiencies.includes(g),
                  )}
                  disabled={crystallized}
                  onPick={(group) => append(mk('proficiency-bought', { group: group as never }))}
                />
              </div>

              <h3>Languages</h3>
              <div class="cf-chiprow">
                {sheet.languages.map((l) => {
                  const bought = state.languages.includes(l);
                  return (
                    <span key={l} class={`cf-chip ${bought ? 'trained' : 'owned'}`}>
                      {l}
                      {bought && <Undo pred={(e) => e.type === 'language-bought' && e.language === l} title="refund" />}
                    </span>
                  );
                })}
              </div>
              <div class="cf-line">
                <GroupPicker
                  label="Buy a language (1 m)"
                  options={LANGUAGES.filter((l) => !sheet.languages.includes(l))}
                  disabled={crystallized}
                  onPick={(language) => append(mk('language-bought', { language: language as never }))}
                />
              </div>
            </section>
          )}

          {/* ── Step 5 · The Finale ── */}
          {sub && (
            <section class="cf-step cf-finale">
              <h2>Step 5 · Quirk &amp; Starting Gear</h2>
              <p class="cf-how">
                Quirk and Starting Gear are rolled randomly, together. Two rerolls; you keep the
                last roll.
              </p>
              {draft.quirkText && (
                <div class="cf-package">
                  <div class="cf-quirk">
                    <p class="cf-quirk-eyebrow">Quirk</p>
                    <h4>{draft.quirkText.name}</h4>
                    <p class="cf-quirk-mech">{draft.quirkText.mechanic}</p>
                    <p class="cf-quirk-eso">{draft.quirkText.esoteric}</p>
                  </div>
                  {draft.gearText && (
                    <div class="cf-quirk">
                      <p class="cf-quirk-eyebrow">Starting Gear</p>
                      <h4>{draft.gearText.name}</h4>
                      <p class="cf-quirk-mech">{draft.gearText.mechanic}</p>
                      <p class="cf-quirk-eso">{draft.gearText.provenance}</p>
                      {sheet.startingCoin && (
                        <p class="cf-quirk-mech"><strong>Starting coin: {sheet.startingCoin.total} sp</strong></p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {!crystallized && (
                <div class="cf-line">
                  <button type="button" class="cf-roll" onClick={doRoll} disabled={quirkRolled && Boolean(state.gear) && draft.rerollsLeft <= 0}>
                    {quirkRolled && state.gear ? `Reroll the package (${draft.rerollsLeft} left — take the last)` : 'Roll your Quirk & Gear'}
                  </button>
                  <button
                    type="button"
                    class="cf-crystallize"
                    disabled={!canCrystallize}
                    title={canCrystallize ? undefined : 'Needs a Class, a Subclass, the rolled Quirk & Gear package, and no unresolved flags'}
                    onClick={() => append(mk('crystallized', {}))}
                  >
                    Crystallize — begin play at Level 1
                  </button>
                </div>
              )}
              {crystallized && (
                <p class="cf-done">
                  <strong>{draft.identity.name || 'This character'} is crystallized.</strong> The
                  spine is locked; the record begins. (The full Character Sheet view is the next
                  thing being built.)
                </p>
              )}
            </section>
          )}

          <div class="cf-reset">
            <button
              type="button"
              onClick={() => {
                if (confirm('Discard this draft entirely? This cannot be undone.')) {
                  setDraft({ ...EMPTY_DRAFT, identity: { ...EMPTY_DRAFT.identity } });
                }
              }}
            >
              Discard draft &amp; start over
            </button>
          </div>
        </div>

        {/* ── The right rail: the live summary ── */}
        <aside class="cf-rail">
          <div class="cf-railbox">
            <p class="cf-eyebrow">The Bank</p>
            <div class="cf-bankline"><span>Major</span> <Pips kind="M" n={state.bank.major} /></div>
            <div class="cf-bankline"><span>Minor</span> <Pips kind="m" n={state.bank.minor} /></div>
          </div>
          <div class="cf-railbox">
            <p class="cf-eyebrow">{draft.identity.name || 'Unnamed'}</p>
            <p class="cf-railsub">
              {cls ? cls.name : '—'}{sub ? ` · ${sub.name}` : ''} · Level {sheet.level}
            </p>
            <table class="cf-mini">
              <thead>
                <tr><th>Attr</th><th>Val</th><th>Off</th><th>Save</th><th>Def</th></tr>
              </thead>
              <tbody>
                {sheet.attributes.map((a) => {
                  // Modifiers wear their sign (+3, −1); Defence targets are
                  // plain numbers (13), not modifiers.
                  const f = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
                  return (
                    <tr key={a.attr}>
                      <td>{a.attr.slice(0, 3)}</td>
                      <td>{f(a.value.total)}</td>
                      <td>{f(a.offence.total)}</td>
                      <td>{f(a.save.total)}</td>
                      <td>{a.unarmouredDefence.total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p class="cf-railline">HP {sheet.hitPoints.total} · Speed {sheet.speed.total}'</p>
            {sheet.languages.length > 0 && (
              <p class="cf-railline">{sheet.languages.join(' · ')}</p>
            )}
          </div>
          {(state.quirk || sheet.situational.length > 0) && (
            <div class="cf-railbox">
              <p class="cf-eyebrow">The Package</p>
              {state.quirk && <p class="cf-railline">{state.quirk.name}</p>}
              {state.gear && <p class="cf-railline">{state.gear.name}</p>}
              {sheet.startingCoin && (
                <p class="cf-railline">Coin: {sheet.startingCoin.total} sp</p>
              )}
              {sheet.situational.map((s) => (
                <p key={`${s.source}·${s.text}`} class="cf-railline cf-sit" title={s.source}>
                  {s.text}
                </p>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ── Small pickers ─────────────────────────────────────────────────────────

function BuildControl({
  choice,
  noun,
  onBuild,
}: {
  choice?: { key: string; label: string; options: string[] };
  noun: string;
  onBuild: (choices: Record<string, string> | undefined) => void;
}) {
  const [sel, setSel] = useState(choice?.options[0] ?? '');
  return (
    <span class="cf-picker">
      {choice && (
        <select
          value={sel}
          title={choice.label}
          onChange={(e) => setSel((e.target as HTMLSelectElement).value)}
        >
          {choice.options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
      <button
        type="button"
        class="buy"
        title={`build a new ${noun.toLowerCase()} — 1 Major`}
        onClick={() => onBuild(choice ? { [choice.key]: sel } : undefined)}
      >
        Build · 1 M
      </button>
    </span>
  );
}

function GroupPicker({
  label,
  options,
  disabled,
  onPick,
}: {
  label: string;
  options: readonly string[];
  disabled: boolean;
  onPick: (v: string) => void;
}) {
  const [sel, setSel] = useState('');
  return (
    <span class="cf-picker">
      <select value={sel} disabled={disabled} onChange={(e) => setSel((e.target as HTMLSelectElement).value)}>
        <option value="">{label}…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <button
        type="button"
        class="buy"
        disabled={disabled || !sel}
        onClick={() => {
          onPick(sel);
          setSel('');
        }}
      >
        Buy
      </button>
    </span>
  );
}

function TrainPicker({
  crystallized,
  taken,
  onTrain,
  whyFor,
}: {
  crystallized: boolean;
  taken: string[];
  onTrain: (skill: string) => void;
  whyFor: (skill: string) => string | null;
}) {
  const [sel, setSel] = useState('');
  const options = SKILLS.map((s) => s.name).filter((n) => !taken.includes(n));
  const reason = sel ? whyFor(sel) : null;
  return (
    <span class="cf-picker">
      <select value={sel} disabled={crystallized} onChange={(e) => setSel((e.target as HTMLSelectElement).value)}>
        <option value="">Train an off-list Skill (1 m)…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <button
        type="button"
        class="buy"
        disabled={crystallized || !sel || reason !== null}
        title={reason ?? undefined}
        onClick={() => {
          onTrain(sel);
          setSel('');
        }}
      >
        Train
      </button>
    </span>
  );
}
