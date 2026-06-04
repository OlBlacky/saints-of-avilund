// Data model for Ability Cards. One Ability is described once; the AbilityCard
// component renders it in either "build" mode (every variable + all possible
// advancements, tagged m/M) or "play" mode (only the values a character has).

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
  note?: string;          // e.g. a level gate, "L5", or "1/level"
}

// One variable on the card: a base value and up to three advancements.
export interface Variable {
  base?: string;          // omit (or '—') when not applicable to this ability
  advances?: Advance[];   // 0–3 steps
}

export interface Ability {
  name: string;
  category: string;
  role?: string;          // Offensive / Defensive / Buff / …
  mode?: string;          // Attack / Effect
  vars: Partial<Record<VarKey, Variable>>;
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
