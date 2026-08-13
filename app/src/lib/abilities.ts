// Data model for Ability Cards. One Ability is described once; the AbilityCard
// component renders it in either "build" mode (every variable + all possible
// advancements, tagged m/M) or "play" mode (only the values a character has).
//
// ── Advancement pacing (one Minor + one Major per Ability per Level) ────────
// Each Ability may take AT MOST ONE MINOR-COST AND ONE MAJOR-COST advance per
// Level, across all its Ladders — creation (Level 0) counts as its own
// allotment. Ranks within one Ladder are still taken in order. A `note` like
// "L5" marks a Rank that opens later than the natural pace; the record engine
// enforces both the pacing and the notes (replay.ts, ruled Aug 7 2026).

export type VarKey =
  | 'frequency' | 'action' | 'range' | 'targets'
  | 'attack' | 'damage' | 'effects' | 'duration';

export const VAR_ORDER: readonly VarKey[] = [
  'frequency', 'action', 'range', 'targets', 'attack', 'damage', 'effects', 'duration',
];

export const VAR_LABELS: Record<VarKey, string> = {
  frequency: 'Frequency',
  action: 'Action',
  range: 'Range',
  targets: 'Targets',
  attack: 'Attack',
  damage: 'Damage',
  effects: 'Effect(s)',
  duration: 'Duration',
};

// ── Action & Frequency tokens ───────────────────────────────────────────────
// Two fields on every card answer questions the player asks constantly, and a
// badge can only be drawn from a closed vocabulary — so Frequency and Action
// are authored as tokens, never as free prose. The display string is generated
// from the token (see formatFreq / formatAct), so there is one source of truth
// and the prose that survives rides in `detail`. See
// mechanics/action-and-frequency.md.

export type FreqToken = 'passive' | 'at-will' | 'encounter' | 'daily' | 'uncapped';

export type ActionToken =
  // in your turn — glyphed, because the player scans these under time pressure
  | 'full-round' | 'standard' | 'move' | 'minor' | 'free'
  | 'reaction' | 'interrupt' | 'none'
  // outside your turn — worded, because nobody scans these mid-combat
  | 'ritual' | 'rest' | 'scene' | 'downtime' | 'check' | 'varies';

export interface FreqSpec {
  freq: FreqToken;
  uses?: number;          // uses per period on encounter/daily; 1 when absent
  detail?: string;        // the qualifier, e.g. "one prepared dose per use"
}

export interface ActSpec {
  act: ActionToken;
  time?: string;          // ritual / downtime: the stated span ("4 hours")
  trigger?: string;       // reaction / interrupt: what sets it off — a rule, not a note
  check?: string;         // check: the Skill rolled ("Perception")
  combat?: ActionToken;   // scene cards that cost a turn-action inside a fight
  detail?: string;
}

/** The token half of one rung — a Variable's base, or one of its advances. */
export type RungSpec = Partial<FreqSpec> & Partial<ActSpec>;

// One advancement step for a variable.
export interface Advance extends RungSpec {
  value: string;          // the new value once bought
  cost: 'm' | 'M';        // Minor or Major
  note?: string;          // a level gate that exceeds the natural one-Rank-per-level
                          // pace, e.g. "L5" (omit it when the pace already covers it)
}

// One variable on the card: a base value and up to three advancements.
export interface Variable extends RungSpec {
  base?: string;          // omit (or '—') when not applicable to this ability
  advances?: Advance[];   // 0–3 steps
}

// A labelled block of options shown under the card — used to break a dense
// "Feats" paragraph into distinct, scannable groups (e.g. Element,
// Specialization Hooks, Implements). A string[] detail renders as a bullet
// list so each option stands on its own line.
// A named advancement ladder, rendered as a mini build-table (Base / ① / ② / ③
// with costs) — mirrors the main card table, used inside an option block.
export interface NamedLadder {
  name: string;
  base?: string;
  advances?: Advance[];
}

export interface AbilityOption {
  label: string;
  note?: string;                  // a short line of explanation under the label
  detail?: string | string[];     // free text / bullet list (omit when using `ladders`)
  ladders?: NamedLadder[];         // rendered as mini advancement tables
  hideCosts?: boolean;             // omit the m/M pips — for automatic ladders that track another ladder
  baseCost?: 'm' | 'M';            // a cost pip on the Base rank too (the base isn't granted free)
  placement?: 'top' | 'bottom';   // 'top' renders above the variable table; default 'bottom'
}

import type { Effect } from './quirks';

export interface Ability {
  name: string;
  category: string;
  role?: string;          // Offensive / Defensive / Buff / …
  mode?: string;          // Attack / Effect
  vars: Partial<Record<VarKey, Variable>>;
  // Spell-builder chassis: the card comes with a default name (the Ability
  // name), which the player may rename, and may be bought more than once —
  // each a separate, separately-built spell. Shows a callout when true.
  builder?: boolean;
  // The one choice a builder copy is built around (element, Malediction).
  // The record engine requires and validates it per instance.
  builderChoice?: { key: string; label: string; options: string[] };
  // Always-on stat effects (Vows, passives) in the shared Effect vocabulary —
  // what derive() applies to the sheet while the Ability is owned. The card
  // prose stays the human text; this is its machine half.
  passiveEffects?: Effect[];
  // The noun in the builder callout: 'Spell' (default) or 'Curse'. Renders as
  // "<noun> Builder … build many different <noun.toLowerCase()>s …".
  builderNoun?: string;
  // Extra ladder rows appended to the main build table, beyond the fixed
  // VAR_ORDER variables (e.g. a Scribe/Create crafting track). If any row has
  // more than three advances, the build table grows its advance columns to fit.
  extraVars?: NamedLadder[];
  options?: AbilityOption[];
  feats?: string;
  // Play mode: the rank a character has in each variable. 0 (or absent) = base;
  // 1–3 selects that advancement.
  current?: Partial<Record<VarKey, number>>;
}

// A builder copy advances only the choice Ladder it was built with. True when
// `ladderName` is one of the card's builderChoice options (a Malediction) that
// this copy's build did not pick — that Ladder belongs to a different copy.
export function isUnchosenChoiceLadder(
  card: Pick<Ability, 'builderChoice'>,
  ladderName: string,
  choices: Record<string, string> | undefined,
): boolean {
  const bc = card.builderChoice;
  return !!bc && bc.options.includes(ladderName) && choices?.[bc.key] !== ladderName;
}

// The Ladder a builder copy was actually built around — the Malediction it is
// whispered with, the element it is cast with. It is the copy's real effect,
// so the sheet resolves it on the card; the card's other option Ladders belong
// to other copies, or are build-time reference.
export function chosenLadder(
  card: Pick<Ability, 'builderChoice' | 'options'>,
  choices: Record<string, string> | undefined,
): NamedLadder | undefined {
  const key = card.builderChoice?.key;
  const chosen = key ? choices?.[key] : undefined;
  if (!chosen) return undefined;
  return (card.options ?? []).flatMap((o) => o.ladders ?? []).find((l) => l.name === chosen);
}

// Resolve a variable to the value shown in Play mode, given the current rank.
export function resolveValue(v: Variable | undefined, rank: number | undefined): string | undefined {
  if (!v) return undefined;
  if (!rank || rank <= 0) return v.base;
  return v.advances?.[rank - 1]?.value ?? v.base;
}

/** The same resolution, returning the rung's tokens — what the badges read. */
export function resolveRung(v: Variable | undefined, rank: number | undefined): RungSpec | undefined {
  if (!v) return undefined;
  if (!rank || rank <= 0) return v;
  return v.advances?.[rank - 1] ?? v;
}

// ── Rendering the tokens ────────────────────────────────────────────────────

const FREQ_LABEL: Record<FreqToken, string> = {
  passive: 'Passive',
  'at-will': 'At-Will',
  encounter: 'Encounter',
  daily: 'Daily',
  uncapped: 'Uncapped',
};

export const ACTION_LABEL: Record<ActionToken, string> = {
  'full-round': 'Full Round',
  standard: 'Standard',
  move: 'Move',
  minor: 'Minor',
  free: 'Free',
  reaction: 'Reaction',
  interrupt: 'Interrupt',
  none: '—',
  ritual: 'Ritual',
  rest: 'During a rest',
  scene: 'A scene',
  downtime: 'Downtime',
  check: 'Check',
  varies: 'As written',
};

// Glyphs only where speed matters: the costs that come out of your turn. An
// out-of-turn cost gets a worded chip, because a glyph there is noise
// pretending to be signal.
export const ACTION_GLYPH: Partial<Record<ActionToken, string>> = {
  'full-round': '◆◆',
  standard: '◆',
  move: '➤',
  minor: '▪',
  free: '○',
  reaction: '↺',
  interrupt: '⚡',
};

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function formatFreq(s: FreqSpec): string {
  const uses = s.uses ?? 1;
  let label = FREQ_LABEL[s.freq];
  if (uses > 1 && (s.freq === 'encounter' || s.freq === 'daily')) {
    const times = uses === 2 ? 'Twice' : uses === 3 ? 'Thrice' : `${uses} times`;
    label = `${times} per ${s.freq === 'encounter' ? 'Encounter' : 'Day'}`;
  }
  const detail = s.detail ?? (s.freq === 'passive' ? 'always on' : undefined);
  return detail ? `${label} (${detail})` : label;
}

export function formatAct(s: ActSpec): string {
  switch (s.act) {
    case 'none':
      return '—';
    case 'reaction':
    case 'interrupt':
      return s.trigger ? `${ACTION_LABEL[s.act]} — ${s.trigger}` : ACTION_LABEL[s.act];
    case 'ritual':
      return `Ritual${s.time ? ` — ${s.time}` : ''}${s.detail ? `, ${s.detail}` : ''}`;
    case 'rest':
      return s.detail ? `During a rest — ${s.detail}` : 'During a rest';
    case 'downtime':
      return cap([s.time, s.detail].filter(Boolean).join(' '));
    case 'scene': {
      const text = cap(s.detail ?? 'a scene');
      return s.combat ? `${text} (${ACTION_LABEL[s.combat]} in a tense scene)` : text;
    }
    case 'check':
      return `${s.check ?? ''} Check`.trim();
    case 'varies':
      return cap(s.detail ?? 'as written');
    default:
      return s.detail ? `${ACTION_LABEL[s.act]} — ${s.detail}` : ACTION_LABEL[s.act];
  }
}

type Cost = 'm' | 'M';

/** Author a Frequency variable from tokens; the display strings are generated. */
export function frequency(
  base: FreqSpec,
  ...advances: (FreqSpec & { cost: Cost; note?: string })[]
): Variable {
  const v: Variable = { ...base, base: formatFreq(base) };
  if (advances.length) {
    v.advances = advances.map(({ cost, note, ...s }) => ({
      ...s,
      value: formatFreq(s),
      cost,
      ...(note ? { note } : {}),
    }));
  }
  return v;
}

/** Author an Action variable from tokens; the display strings are generated. */
export function actionCost(
  base: ActSpec,
  ...advances: (ActSpec & { cost: Cost; note?: string })[]
): Variable {
  const v: Variable = { ...base, base: formatAct(base) };
  if (advances.length) {
    v.advances = advances.map(({ cost, note, ...s }) => ({
      ...s,
      value: formatAct(s),
      cost,
      ...(note ? { note } : {}),
    }));
  }
  return v;
}

// ── The badges ──────────────────────────────────────────────────────────────

export interface Badge {
  glyph?: string;
  label: string;
  /** Frequency: one tick box per use — the box IS the tracker. */
  boxes?: number;
  /** Frequency: no limit to spend, so no boxes. */
  infinite?: boolean;
  /** A short span printed inside the chip (a ritual's or downtime's time). */
  note?: string;
  /** The rule that rides with the cost — a trigger, a qualifier — printed beside the chip. */
  rider?: string;
}

/** Passive carries no badge — it gets a rail down the card instead. */
export function freqBadge(s: RungSpec | undefined): Badge | undefined {
  if (!s?.freq || s.freq === 'passive') return undefined;
  const label = FREQ_LABEL[s.freq];
  if (s.freq === 'at-will' || s.freq === 'uncapped') return { label, infinite: true };
  return { label, boxes: s.uses ?? 1 };
}

export function actionBadge(s: RungSpec | undefined): Badge | undefined {
  if (!s?.act || s.act === 'none') return undefined;
  const label = s.act === 'check' ? `${s.check ?? ''} Check`.trim() : ACTION_LABEL[s.act];
  const note = s.act === 'ritual' || s.act === 'downtime' ? s.time : undefined;
  // A trigger is a rule, not decoration, so it always survives the badge.
  let rider = s.act === 'reaction' || s.act === 'interrupt' ? s.trigger : s.detail;
  if (s.act === 'check') rider = s.detail;
  if (s.combat) {
    rider = `${rider ?? ''}${rider ? ' ' : ''}(${ACTION_LABEL[s.combat]} in a tense scene)`;
  }
  return {
    glyph: ACTION_GLYPH[s.act],
    label,
    ...(note ? { note } : {}),
    ...(rider ? { rider } : {}),
  };
}
