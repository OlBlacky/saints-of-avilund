// Data model for Ability Cards. One Ability is described once; the AbilityCard
// component renders it in either "build" mode (every variable + all possible
// advancements, tagged m/M) or "play" mode (only the values a character has).
//
// ── Advancement pacing (the one-Rank-per-level rule) ────────────────────────
// You may climb any one variable's Ladder by AT MOST ONE RANK PER LEVEL. (The
// base Rank and the first Advance may both be taken when the Ability is first
// bought.) So a four-Rank Ladder paces itself: Rank 2 at creation (Level 0),
// Rank 3 over Level 1, Rank 4 over Level 2 — with no explicit gate. Because of
// this, a low-level gate like "L2" on a four-Rank ladder is almost always
// redundant; reserve `note` for a Rank that opens LATER than the natural pace
// (e.g. "L3", "L5"). The limit is per (Ability, variable): two different
// variables of the same Ability may each advance in the same level.

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

// One advancement step for a variable.
export interface Advance {
  value: string;          // the new value once bought
  cost: 'm' | 'M';        // Minor or Major
  note?: string;          // a level gate that exceeds the natural one-Rank-per-level
                          // pace, e.g. "L5" (omit it when the pace already covers it)
}

// One variable on the card: a base value and up to three advancements.
export interface Variable {
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
  options?: AbilityOption[];
  feats?: string;
  // Play mode: the rank a character has in each variable. 0 (or absent) = base;
  // 1–3 selects that advancement.
  current?: Partial<Record<VarKey, number>>;
}

// Resolve a variable to the value shown in Play mode, given the current rank.
export function resolveValue(v: Variable | undefined, rank: number | undefined): string | undefined {
  if (!v) return undefined;
  if (!rank || rank <= 0) return v.base;
  return v.advances?.[rank - 1]?.value ?? v.base;
}
