// The notation parser (builder spec §9): the small grammar behind the
// ability-card shorthand — `1[W] + Str`, `Dexterity vs AC`, `Wis rounds,
// and Save ends`, `2/enc` — so card values stay authorable strings while
// the sheet can compute with them.
//
// Design: the corpus is deliberately a mix of notation and prose. Fields
// have different policies (enforced by notation.test.ts, the build gate):
//   - damage & attack: MUST parse structured (tiny explicit exceptions);
//   - frequency: must normalize to the standard vocabulary (+ a note);
//   - range / targets / duration / action: structured where they match,
//     honest `prose` where the card is narrative — never an error.
// Parsers never throw; they return a tagged result. The gate decides.

import type { Attribute } from './quirks';

/** Canonical short attribute names, as they appear in notation. */
export const ATTR_SHORT = ['Str', 'Dex', 'Con', 'Int', 'Wis', 'Cha'] as const;
export type AttrShort = (typeof ATTR_SHORT)[number];

const ATTR_WORDS: Record<string, AttrShort> = {
  str: 'Str', strength: 'Str',
  dex: 'Dex', dexterity: 'Dex',
  con: 'Con', constitution: 'Con',
  int: 'Int', intelligence: 'Int',
  wis: 'Wis', wisdom: 'Wis',
  cha: 'Cha', charisma: 'Cha',
};

export const ATTR_FULL: Record<AttrShort, Attribute> = {
  Str: 'Strength', Dex: 'Dexterity', Con: 'Constitution',
  Int: 'Intelligence', Wis: 'Wisdom', Cha: 'Charisma',
};

/** Parse an attribute word ("Str", "Strength", case-insensitive). */
export function parseAttr(word: string): AttrShort | undefined {
  return ATTR_WORDS[word.trim().toLowerCase()];
}

// ── Damage ──────────────────────────────────────────────────────────────────

/** One additive term of a damage expression. */
export type DamageTerm =
  | { kind: 'weapon'; count: number; sizeStep?: number }
  | { kind: 'dice'; count: number; sides: number }
  | { kind: 'attr'; attr: AttrShort }
  | { kind: 'flat'; value: number }
  | { kind: 'ref'; text: string }; // a named bonus, e.g. "the study bonus"

export interface ParsedDamage {
  kind: 'damage';
  terms: DamageTerm[];
  /** Typed damage (Acid, Eldritch, Psychic, …) when the card names one. */
  damageType?: string;
  /** Trailing parenthetical or em-dash note, kept verbatim. */
  note?: string;
}

export type DamageResult =
  | ParsedDamage
  | { kind: 'none'; note?: string }
  | { kind: 'unparsed'; text: string };

export const DAMAGE_TYPES = ['Acid', 'Fire', 'Cold', 'Lightning', 'Sonic', 'Force',
  'Radiant', 'Necrotic', 'Psychic', 'Eldritch'];

/** Split "value (note)" / "value — note", keeping the note verbatim. A
 * trailing parenthetical wins over an em-dash so "W (fixed — a rap)" keeps
 * its whole aside together. */
function splitNote(s: string): { core: string; note?: string } {
  const paren = s.match(/^(.*?)\s*\(([^()]*)\)$/);
  if (paren && paren[1].trim()) return { core: paren[1].trim(), note: paren[2].trim() };
  const em = s.match(/^(.*?)\s+—\s+(.*)$/);
  if (em) return { core: em[1].trim(), note: em[2].trim() };
  return { core: s.trim() };
}

/** Split an "A, B, or C" / "A or B" alternative list. */
function splitAlternatives(s: string): string[] {
  return s
    .split(/\s*,\s*(?:or\s+)?|\s+or\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function parseDamage(input: string): DamageResult {
  const { core: c0, note } = splitNote(input.trim());
  if (c0 === '—' || c0 === '' || /^none\b/i.test(c0)) {
    return { kind: 'none', note: note ?? (c0 && c0 !== '—' ? c0 : undefined) };
  }

  // "weapon one size larger, + Str" — the enlarged-weapon form.
  const size = c0.match(/^weapon (one|two) sizes? larger,?\s*(?:\+\s*(.*))?$/i);
  let core = c0;
  const terms: DamageTerm[] = [];
  if (size) {
    terms.push({ kind: 'weapon', count: 1, sizeStep: size[1].toLowerCase() === 'one' ? 1 : 2 });
    core = size[2] ?? '';
  }

  // Damage type: a trailing capitalized type word.
  let damageType: string | undefined;
  for (const t of DAMAGE_TYPES) {
    const re = new RegExp(`\\s+${t}$`);
    if (re.test(core)) {
      damageType = t;
      core = core.replace(re, '');
      break;
    }
  }

  const parts = core.split('+').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const w = part.match(/^(\d*)\s*\[?W\]?$/);
    if (w) { terms.push({ kind: 'weapon', count: w[1] ? Number(w[1]) : 1 }); continue; }
    const dice = part.match(/^(\d+)d(\d+)$/i);
    if (dice) { terms.push({ kind: 'dice', count: Number(dice[1]), sides: Number(dice[2]) }); continue; }
    const attr = parseAttr(part);
    if (attr) { terms.push({ kind: 'attr', attr }); continue; }
    if (/^\d+$/.test(part)) { terms.push({ kind: 'flat', value: Number(part) }); continue; }
    if (/^the .+$/i.test(part)) { terms.push({ kind: 'ref', text: part }); continue; }
    return { kind: 'unparsed', text: input };
  }
  if (terms.length === 0) return { kind: 'unparsed', text: input };
  return { kind: 'damage', terms, damageType, note };
}

/** Values a damage expression resolves against: attributes + the weapon die. */
export interface ResolveContext {
  attrs: Partial<Record<AttrShort, number>>;
  /** The wielded weapon's damage die, e.g. "1d12". Omit for no weapon. */
  weaponDie?: string;
}

/**
 * Render a parsed damage expression with this character's numbers:
 * `1[W] + Str` with Str +3 and a d12 → "1d12+3". Named refs and typed
 * damage render verbatim after the math.
 */
export function resolveDamage(d: ParsedDamage, ctx: ResolveContext): string {
  const dice: string[] = [];
  let flat = 0;
  const refs: string[] = [];
  for (const t of d.terms) {
    if (t.kind === 'weapon') {
      if (!ctx.weaponDie) { refs.push(`${t.count}[W]`); continue; }
      const m = ctx.weaponDie.match(/^(\d+)d(\d+)$/i);
      if (m) dice.push(`${Number(m[1]) * t.count}d${m[2]}`);
    } else if (t.kind === 'dice') {
      dice.push(`${t.count}d${t.sides}`);
    } else if (t.kind === 'attr') {
      flat += ctx.attrs[t.attr] ?? 0;
    } else if (t.kind === 'flat') {
      flat += t.value;
    } else {
      refs.push(t.text);
    }
  }
  let out = dice.join(' + ');
  if (flat !== 0 || dice.length === 0) {
    out = out ? `${out}${flat >= 0 ? '+' : '−'}${Math.abs(flat)}` : `${flat}`;
  }
  if (d.damageType) out += ` ${d.damageType}`;
  for (const r of refs) out += ` + ${r}`;
  return out;
}

// ── Attack ──────────────────────────────────────────────────────────────────

/** What rolls the attack: an Attribute, a Skill, or a named special form. */
export type AttackRoller =
  | { kind: 'attr'; attr: AttrShort }
  | { kind: 'skill'; skill: string }
  | { kind: 'special'; text: string };

/** What the attack rolls against. */
export type AttackDefence =
  | { kind: 'ac' }
  | { kind: 'defence'; armoured: boolean; attr: AttrShort }
  | { kind: 'skill'; skill: string }  // a passive skill target ("the mark's Perception")
  | { kind: 'dc'; of: string }        // "the Condition's DC", "the target's Difficulty Class"
  | { kind: 'matching' }              // "…vs the target's matching Defence"
  | { kind: 'special'; text: string };

export interface ParsedAttack {
  kind: 'attack';
  rollers: AttackRoller[];            // alternatives ("Intimidate, Diplomacy, or Bluff")
  defences: AttackDefence[];          // alternatives ("AC or Armoured Str")
  note?: string;
}

export type AttackResult = ParsedAttack | { kind: 'unparsed'; text: string };

const SPECIAL_ROLLERS = [
  /^the dog’s bite$/i,
  /^weapon \(str \/ dex\)$/i,
  /^int \(\+ [^)]+\)$/i,              // "Int (+ Scroll Specialization)"
  /^ritual\b.*$/i,                    // "Ritual — Skill vs …" handled via note split
];

function parseDefencePart(raw: string): AttackDefence | undefined {
  const p = raw.trim().replace(/^the\s+/i, '');
  if (/^ac$/i.test(p)) return { kind: 'ac' };
  // "Unarmoured AC" — AC is the Armoured Con Defence, so its unarmoured
  // counterpart is the unarmoured Con Defence.
  if (/^unarmoured\s+ac$/i.test(p)) return { kind: 'defence', armoured: false, attr: 'Con' };
  const def = p.match(/^(armoured|unarmoured)\s+(\w+)$/i);
  if (def) {
    const attr = parseAttr(def[2]);
    if (!attr) return undefined;
    return { kind: 'defence', armoured: def[1].toLowerCase() === 'armoured', attr };
  }
  // Bare attribute after an earlier Armoured/Unarmoured alternative ("…, or Dex").
  const bare = parseAttr(p);
  if (bare) return { kind: 'defence', armoured: false, attr: bare };
  if (/(dc|difficulty class)$/i.test(p)) return { kind: 'dc', of: raw.trim() };
  if (/matching defence$/i.test(p)) return { kind: 'matching' };
  if (/^spell’s defence$/i.test(p)) return { kind: 'special', text: raw.trim() };
  // A passive skill as the target ("Perception") — the corpus test validates
  // the name against SKILLS, so an invented defence still fails the gate.
  if (/^[A-Z][\w' -]*$/.test(p)) return { kind: 'skill', skill: p };
  return undefined;
}

export function parseAttack(input: string): AttackResult {
  const { core, note } = splitNote(input.trim());
  const m = core.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (!m) return { kind: 'unparsed', text: input };

  const rollerRaw = m[1].trim();
  const rollers: AttackRoller[] = [];
  for (const alt of splitAlternatives(rollerRaw)) {
    const attr = parseAttr(alt);
    if (attr) { rollers.push({ kind: 'attr', attr }); continue; }
    if (SPECIAL_ROLLERS.some((re) => re.test(alt))) {
      rollers.push({ kind: 'special', text: alt });
      continue;
    }
    // Anything else capitalized is taken as a Skill name ("Bluff", "Sense
    // Motive", "Religion (Saintly Faith)") — validated against SKILLS by the
    // corpus test, not here.
    if (/^[A-Z]/.test(alt)) { rollers.push({ kind: 'skill', skill: alt }); continue; }
    return { kind: 'unparsed', text: input };
  }

  // Strip a possessive lead-in: "the Target's …", "the mark's …", "his …".
  const defRaw = m[2].trim()
    .replace(/^the\s+[\w’']+?[’']s\s+/i, '')
    .replace(/^the\s+named\s+foe[’']s\s+/i, '')
    .replace(/^(his|her|their|its|your)\s+/i, '');
  const defences: AttackDefence[] = [];
  for (const alt of splitAlternatives(defRaw)) {
    const d = parseDefencePart(alt);
    if (!d) return { kind: 'unparsed', text: input };
    defences.push(d);
  }
  if (rollers.length === 0 || defences.length === 0) return { kind: 'unparsed', text: input };
  return { kind: 'attack', rollers, defences, note };
}

// ── Frequency ───────────────────────────────────────────────────────────────

export interface ParsedFrequency {
  kind: 'frequency';
  per: 'at-will' | 'encounter' | 'day' | 'passive' | 'uncapped' | 'special';
  /** Uses per period (encounter/day); 1 unless stated. */
  count: number;
  note?: string;
}

export type FrequencyResult = ParsedFrequency | { kind: 'unparsed'; text: string };

export function parseFrequency(input: string): FrequencyResult {
  const { core, note } = splitNote(input.trim());
  const c = core.toLowerCase().replace(/\s+/g, ' ');
  const mk = (per: ParsedFrequency['per'], count = 1): ParsedFrequency =>
    ({ kind: 'frequency', per, count, note });

  if (c === 'at-will' || c === 'at will' || c === '∞') return mk('at-will');
  if (c === 'encounter' || c === '1/enc' || c === '1 / encounter') return mk('encounter');
  if (c === 'daily' || c === '1/day' || c === '1 / day') return mk('day');
  if (c === 'passive' || c === 'passive (always on)') return mk('passive');
  if (c.startsWith('passive')) return mk('passive');
  if (c === 'uncapped' || c.startsWith('uncapped')) return mk('uncapped');
  const n = c.match(/^(\d+|twice|thrice)\s*(?:\/|per)\s*(encounter|enc|day)$/);
  if (n) {
    const count = n[1] === 'twice' ? 2 : n[1] === 'thrice' ? 3 : Number(n[1]);
    return mk(n[2].startsWith('enc') ? 'encounter' : 'day', count);
  }
  return { kind: 'unparsed', text: input };
}

// ── Duration ────────────────────────────────────────────────────────────────

export type DurationResult =
  | {
      kind: 'duration';
      form: 'instant' | 'encounter' | 'permanent' | 'save-ends' | 'until' | 'time' | 'rounds';
      /** rounds form: attribute-based round count, e.g. Wis + 1 rounds. */
      attr?: AttrShort;
      bonus?: number;
      /** ×2 multiplier on the attribute ("Int ×2 rounds"). */
      times?: number;
      /** "and Save ends" rider on a rounds form, or the save-ends detail. */
      saveEnds?: boolean;
      /** time form: quantity + unit. */
      amount?: number;
      unit?: 'round' | 'minute' | 'hour' | 'day' | 'week' | 'month';
      /** until form: the boundary, verbatim ("your next turn"). */
      boundary?: string;
      note?: string;
    }
  | { kind: 'prose'; text: string };

export function parseDuration(input: string): DurationResult {
  const { core, note } = splitNote(input.trim());
  const c = core.toLowerCase();

  if (c === 'instant') return { kind: 'duration', form: 'instant', note };
  if (c === 'encounter' || c === 'the encounter' || c === 'until the end of the encounter') {
    return { kind: 'duration', form: 'encounter', note };
  }
  if (c === 'permanent') return { kind: 'duration', form: 'permanent', note };
  if (c === 'save ends') return { kind: 'duration', form: 'save-ends', saveEnds: true, note };

  const rounds = core.match(/^(\w+)(?:\s*(?:\+\s*(\d+)|×\s*(\d+)))?\s+(rounds?|days?)(,\s*and Save ends)?$/i);
  if (rounds) {
    const attr = parseAttr(rounds[1]);
    if (attr) {
      return {
        kind: 'duration', form: 'rounds', attr,
        bonus: rounds[2] ? Number(rounds[2]) : undefined,
        times: rounds[3] ? Number(rounds[3]) : undefined,
        saveEnds: Boolean(rounds[5]), note,
      };
    }
  }

  const time = c.match(/^(\d+)\s+(round|minute|hour|day|week|month)s?$/);
  if (time) {
    return {
      kind: 'duration', form: 'time',
      amount: Number(time[1]),
      unit: time[2] as 'round' | 'minute' | 'hour' | 'day' | 'week' | 'month',
      note,
    };
  }

  const until = core.match(/^until (.+)$/i);
  if (until) return { kind: 'duration', form: 'until', boundary: until[1], note };

  return { kind: 'prose', text: input };
}

// ── Range ───────────────────────────────────────────────────────────────────

export type RangeResult =
  | {
      kind: 'range';
      form: 'self' | 'touch' | 'melee' | 'reach' | 'sight' | 'distance' | 'wri' | 'burst';
      /** distance form: feet. burst form: radius in feet. */
      feet?: number;
      /** wri form: multiplier on the weapon's range increment. */
      times?: number;
      /** distance-with-burst: "60' (15' burst)". */
      burstFeet?: number;
      note?: string;
    }
  | { kind: 'prose'; text: string };

export function parseRange(input: string): RangeResult {
  // "60' (15' burst)" — checked before note-splitting eats the parenthetical.
  const distBurst = input.trim().match(/^(\d+)'\s*\((\d+)' burst\)$/i);
  if (distBurst) {
    return {
      kind: 'range', form: 'distance',
      feet: Number(distBurst[1]), burstFeet: Number(distBurst[2]),
    };
  }

  const { core, note } = splitNote(input.trim());
  const c = core.toLowerCase();

  if (c === 'self') return { kind: 'range', form: 'self', note };
  if (c === 'touch') return { kind: 'range', form: 'touch', note };
  if (c === 'melee' || c === 'melee or ranged') return { kind: 'range', form: 'melee', note };
  if (c === 'reach') return { kind: 'range', form: 'reach', note };
  if (c === 'sight') return { kind: 'range', form: 'sight', note };

  const wri = core.match(/^(\d+)×WRI$/i);
  if (wri) return { kind: 'range', form: 'wri', times: Number(wri[1]), note };

  const burst = core.match(/^(\d+)'\s+burst$/i);
  if (burst) return { kind: 'range', form: 'burst', feet: Number(burst[1]), note };

  const dist = core.match(/^(?:up to )?(\d+)'$/i);
  if (dist) return { kind: 'range', form: 'distance', feet: Number(dist[1]), note };

  return { kind: 'prose', text: input };
}

// ── Targets ─────────────────────────────────────────────────────────────────

export type TargetsResult =
  | {
      kind: 'targets';
      /** Flat count, or an attribute-driven count (Cha + 1 patients). */
      count?: number;
      attr?: AttrShort;
      bonus?: number;
      times?: number;
      /** What is being counted: creatures, allies, patients, doses… */
      noun?: string;
      note?: string;
    }
  | { kind: 'prose'; text: string };

const COUNT_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
};

export function parseTargets(input: string): TargetsResult {
  const { core, note } = splitNote(input.trim());

  if (/^(self|yourself)$/i.test(core)) {
    return { kind: 'targets', count: 1, noun: 'self', note };
  }

  const flat = core.match(/^(\d+|one|two|three|four|five)(?:\s+(.+))?$/i);
  if (flat) {
    const noun = flat[2]?.trim();
    // Only accept a plain noun phrase — anything with clauses stays prose.
    if (!noun || /^[\w' -]+$/.test(noun)) {
      return {
        kind: 'targets',
        count: COUNT_WORDS[flat[1].toLowerCase()] ?? Number(flat[1]),
        noun, note,
      };
    }
  }

  const attrCount = core.match(/^(\w+)(?:\s*(?:\+\s*(\d+)|×\s*(\d+)))?\s+([\w' -]+)$/i);
  if (attrCount) {
    const attr = parseAttr(attrCount[1]);
    if (attr) {
      return {
        kind: 'targets', attr,
        bonus: attrCount[2] ? Number(attrCount[2]) : undefined,
        times: attrCount[3] ? Number(attrCount[3]) : undefined,
        noun: attrCount[4].trim(), note,
      };
    }
  }

  return { kind: 'prose', text: input };
}

// ── Action ──────────────────────────────────────────────────────────────────

export type ActionResult =
  | {
      kind: 'action';
      action: 'standard' | 'move' | 'minor' | 'free' | 'full-round' | 'reaction' | 'interrupt' | 'ritual';
      /** The trigger or rider after an em-dash / parenthetical, verbatim. */
      note?: string;
      /** ritual form: stated casting time, verbatim ("4 hours"). */
      time?: string;
    }
  | { kind: 'time'; text: string }   // a bare duration ("8 hours of study")
  | { kind: 'prose'; text: string };

export function parseAction(input: string): ActionResult {
  const { core, note } = splitNote(input.trim());
  const c = core.toLowerCase().replace(/\s+action$/, '').replace(/\s+only$/, '');

  const simple: Record<string, ActionResult & { kind: 'action' }> = {
    standard: { kind: 'action', action: 'standard', note },
    move: { kind: 'action', action: 'move', note },
    minor: { kind: 'action', action: 'minor', note },
    free: { kind: 'action', action: 'free', note },
    'full round': { kind: 'action', action: 'full-round', note },
    'full-round': { kind: 'action', action: 'full-round', note },
    reaction: { kind: 'action', action: 'reaction', note },
    interrupt: { kind: 'action', action: 'interrupt', note },
  };
  if (simple[c]) return simple[c];

  const ritual = core.match(/^Ritual(?:,\s*(.+))?$/i);
  if (ritual) {
    // "Ritual — 4 hours" arrives as core "Ritual" + note "4 hours";
    // "Ritual, during a rest" carries its rider in the match.
    return { kind: 'action', action: 'ritual', time: note, note: ritual[1] };
  }

  if (/^\d+\s+(minute|hour|day)s?\b/i.test(core)) return { kind: 'time', text: input };

  return { kind: 'prose', text: input };
}
