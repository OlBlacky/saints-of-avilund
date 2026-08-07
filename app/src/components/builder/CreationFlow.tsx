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

import { CATEGORIES } from '../../lib/category-abilities';
import {
  ARMOUR_PROFICIENCIES,
  CLASSES,
  IMPLEMENT_GROUPS,
  LANGUAGES,
  WEAPON_GROUPS,
  classById,
} from '../../lib/classes';
import type { Attribute } from '../../lib/quirks';
import { rollQuirk } from '../../lib/quirks';
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
  height: string;
  weight: string;
  notes: string;
}

interface Draft {
  identity: Identity;
  events: RecordEvent[];
  rerollsLeft: number;
  /** Display texts of the current Quirk roll (the event stores id + fills). */
  quirkText?: { name: string; mechanic: string; esoteric: string };
}

const EMPTY_DRAFT: Draft = {
  identity: { name: '', origin: '', age: '', height: '', weight: '', notes: '' },
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

  const crystallized = state.crystallized;
  const cls = state.classId ? classById(state.classId) : undefined;
  const sub = cls?.subclasses.find((s) => s.id === state.subclassId);
  const quirkRolled = Boolean(state.quirk);

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
    const isReroll = quirkRolled;
    if (isReroll && draft.rerollsLeft <= 0) return;
    const q = rollQuirk();
    const used = isReroll ? REROLLS - draft.rerollsLeft + 1 : 0;
    setDraft((d) => ({
      ...d,
      rerollsLeft: isReroll ? d.rerollsLeft - 1 : d.rerollsLeft,
      quirkText: { name: q.name, mechanic: q.mechanic, esoteric: q.esoteric },
      events: [
        ...d.events.filter((x) => x.type !== 'quirk-rolled'),
        mk('quirk-rolled', { quirkId: q.id, quirkName: q.name, slots: q.fills, rerollsUsed: used }),
      ],
    }));
  };

  const canCrystallize =
    !crystallized && cls && sub && quirkRolled && flags.length === 0;

  // ── Render ──────────────────────────────────────────────────────────────

  if (!loaded) return <div class="cf-loading">…</div>;

  return (
    <div class="cf">
      {/* The keep-and-flag panel: errors block finishing, never browsing. */}
      {flags.length > 0 && (
        <div class="cf-flags">
          <strong>To resolve before the finale:</strong>
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
            <p class="cf-how">Editable at any time — none of this is mechanical.</p>
            <div class="cf-identity">
              <label>Name <input value={draft.identity.name} onInput={(e) => setIdentity('name', (e.target as HTMLInputElement).value)} placeholder="Unnamed" /></label>
              <label>Country of origin <input value={draft.identity.origin} onInput={(e) => setIdentity('origin', (e.target as HTMLInputElement).value)} /></label>
              <label>Age <input value={draft.identity.age} onInput={(e) => setIdentity('age', (e.target as HTMLInputElement).value)} /></label>
              <label>Height <input value={draft.identity.height} onInput={(e) => setIdentity('height', (e.target as HTMLInputElement).value)} /></label>
              <label>Weight <input value={draft.identity.weight} onInput={(e) => setIdentity('weight', (e.target as HTMLInputElement).value)} /></label>
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
              <div class="cf-attrs">
                {ATTRIBUTES.map((a) => {
                  const val = sheet.attributes.find((x) => x.attr === a)!.value.total;
                  const isClassAttr = cls!.classAttribute === a || sub.classAttribute === a;
                  return (
                    <div key={a} class="cf-attr">
                      <span class="cf-attr-name">{a}{isClassAttr && <span class="star" title="Class Attribute"> ★</span>}</span>
                      <Undo pred={(e) => e.type === 'attribute-bought' && e.attr === a} title="refund the last point" />
                      <span class="cf-attr-val">{val >= 0 ? `+${val}` : `−${Math.abs(val)}`}</span>
                      <Buy ev={mk('attribute-bought', { attr: a })} label="+1" />
                    </div>
                  );
                })}
              </div>

              <h3>Abilities</h3>
              {accessibleCategories(state).map((catName) => {
                const cat = CATEGORIES.find((c) => c.name === catName);
                if (!cat) return null;
                return (
                  <div key={catName} class="cf-abilities">
                    <h4>{catName}</h4>
                    <div class="cf-chiprow">
                      {cat.abilities.map((ab) => {
                        const owned = state.abilities.some(
                          (o) => o.ref.category === catName && o.ref.ability === ab.name,
                        );
                        const ref = { category: catName, ability: ab.name };
                        return owned ? (
                          <span key={ab.name} class="cf-chip owned">
                            {ab.name}
                            {!crystallized && (
                              <button
                                type="button"
                                class="undo"
                                title="refund"
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
                            )}
                          </span>
                        ) : (
                          <Buy key={ab.name} ev={mk('ability-bought', { ref })} label={ab.name} />
                        );
                      })}
                    </div>
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
              <div class="cf-attrs">
                {ATTRIBUTES.map((a) => {
                  const da = sheet.attributes.find((x) => x.attr === a)!;
                  return (
                    <div key={a} class="cf-attr wide2">
                      <span class="cf-attr-name">{a}</span>
                      <span class="cf-duo">
                        Off {da.offence.total >= 0 ? `+${da.offence.total}` : da.offence.total}
                        <Undo pred={(e) => e.type === 'offence-bought' && e.attr === a} title="refund" />
                        <Buy ev={mk('offence-bought', { attr: a })} label="+1" />
                      </span>
                      <span class="cf-duo">
                        Def/Save
                        <Undo pred={(e) => e.type === 'defence-bought' && e.attr === a} title="refund" />
                        <Buy ev={mk('defence-bought', { attr: a })} label="+1" />
                      </span>
                    </div>
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

              <h3>Proficiencies &amp; Languages</h3>
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
                  label="Buy a proficiency (1 m, fixed at +0)"
                  options={[...WEAPON_GROUPS, ...ARMOUR_PROFICIENCIES, ...IMPLEMENT_GROUPS].filter(
                    (g) => !grantedProficiencies(state).includes(g) && !state.boughtProficiencies.includes(g),
                  )}
                  disabled={crystallized}
                  onPick={(group) => append(mk('proficiency-bought', { group: group as never }))}
                />
                <GroupPicker
                  label="Buy a language (1 m)"
                  options={LANGUAGES.filter((l) => !sheet.languages.includes(l))}
                  disabled={crystallized}
                  onPick={(language) => append(mk('language-bought', { language: language as never }))}
                />
              </div>
            </section>
          )}

          {/* ── Step 5 · Flaw ── */}
          {sub && (
            <section class="cf-step">
              <h2>Step 5 · Take a Flaw <span class="cf-opt">(optional)</span></h2>
              <p class="cf-how">Lower up to two Attributes by −1 for +1 Major each.</p>
              <div class="cf-chiprow">
                {ATTRIBUTES.map((a) => {
                  const has = state.flaws.includes(a);
                  return has ? (
                    <span key={a} class="cf-chip owned">
                      {a} −1
                      <Undo pred={(e) => e.type === 'flaw-taken' && e.attr === a} title="remove the Flaw" />
                    </span>
                  ) : (
                    <Buy key={a} ev={mk('flaw-taken', { attr: a })} label={`${a} −1`} />
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Step 6 · The Finale ── */}
          {sub && (
            <section class="cf-step cf-finale">
              <h2>Step 6 · The Quirk &amp; Crystallization</h2>
              <p class="cf-how">
                Rolled, never chosen. Two rerolls, take-the-last — each discards what you had.
                <em> (Starting Gear joins this roll when its tables are built.)</em>
              </p>
              {draft.quirkText && (
                <div class="cf-quirk">
                  <h4>{draft.quirkText.name}</h4>
                  <p class="cf-quirk-mech">{draft.quirkText.mechanic}</p>
                  <p class="cf-quirk-eso">{draft.quirkText.esoteric}</p>
                </div>
              )}
              {!crystallized && (
                <div class="cf-line">
                  <button type="button" class="cf-roll" onClick={doRoll} disabled={quirkRolled && draft.rerollsLeft <= 0}>
                    {quirkRolled ? `Reroll (${draft.rerollsLeft} left — take the last)` : 'Roll your Quirk'}
                  </button>
                  <button
                    type="button"
                    class="cf-crystallize"
                    disabled={!canCrystallize}
                    title={canCrystallize ? undefined : 'Needs a Class, a Subclass, a rolled Quirk, and no unresolved flags'}
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
                {sheet.attributes.map((a) => (
                  <tr key={a.attr}>
                    <td>{a.attr.slice(0, 3)}</td>
                    <td>{a.value.total}</td>
                    <td>{a.offence.total}</td>
                    <td>{a.save.total}</td>
                    <td>{a.unarmouredDefence.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p class="cf-railline">HP {sheet.hitPoints.total} · Speed {sheet.speed.total}'</p>
            {sheet.languages.length > 0 && (
              <p class="cf-railline">{sheet.languages.join(' · ')}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Small pickers ─────────────────────────────────────────────────────────

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
        <option value="">Train an off-list Skill (1 m, capped +1)…</option>
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
