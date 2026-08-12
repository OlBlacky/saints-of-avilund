// Lint for Rail 11 ("Every Rank stands alone", mechanics/design-principles.md):
// every value on a Ladder — base and every Rank — must be a complete,
// self-contained statement, readable on a character sheet as "Label: value"
// with no other row in sight. This test flags the offender patterns and holds
// a baseline of known offenders from before the rail existed. The baseline
// only shrinks: fixing a card removes its entry; authoring a new offence fails.

import { describe, expect, it } from 'vitest';

import type { Ability, NamedLadder, Variable } from './abilities';
import { CATEGORIES } from './category-abilities';

// Values that mean "not applicable" rather than describing a Rank.
const BLANK = new Set(['—', 'None']);

// Each rule names one way a value can lean on the row above it.
const RULES: { reason: string; hit: (v: string) => boolean }[] = [
  { reason: 'references another row ("as above")', hit: (v) => /\b(as above|ditto|as before)\b/i.test(v) },
  { reason: 'leading "+ " delta (an addition to the previous Rank)', hit: (v) => /^\+ /.test(v) },
  { reason: 'bare modifier with no stated subject', hit: (v) => /^[+−-]\d+\s*(?:$|,|and\b)/.test(v) },
  { reason: 'radius with no stated subject', hit: (v) => /^\d+['′] radius$/.test(v) },
];

interface Offence {
  key: string; // "Category · Ability · ladder · step"
  value: string;
  reasons: string[];
}

function check(offences: Offence[], key: string, value: string | undefined): void {
  if (!value || BLANK.has(value)) return;
  const reasons = RULES.filter((r) => r.hit(value)).map((r) => r.reason);
  if (reasons.length) offences.push({ key, value, reasons });
}

function checkLadder(offences: Offence[], key: string, ladder: Variable | NamedLadder): void {
  check(offences, `${key} · base`, ladder.base);
  ladder.advances?.forEach((adv, i) => check(offences, `${key} · rank ${i + 1}`, adv.value));
}

// Walk every ladder on every card: the main variables, extra ladders, and the
// named ladders inside option blocks. Reused cards (shared consts hosted by a
// second Category) are visited once, under the first Category that carries them.
function collectOffences(): Offence[] {
  const offences: Offence[] = [];
  const seen = new Set<Ability>();
  for (const cat of CATEGORIES) {
    for (const ability of cat.abilities) {
      if (seen.has(ability)) continue;
      seen.add(ability);
      const prefix = `${cat.name} · ${ability.name}`;
      for (const [varKey, variable] of Object.entries(ability.vars)) {
        checkLadder(offences, `${prefix} · ${varKey}`, variable);
      }
      const namedLadders = [
        ...(ability.extraVars ?? []),
        ...(ability.options ?? []).flatMap((o) => o.ladders ?? []),
      ];
      for (const ladder of namedLadders) {
        checkLadder(offences, `${prefix} · ${ladder.name}`, ladder);
      }
    }
  }
  return offences;
}

// Known offenders from before Rail 11. The original 82-entry worklist was
// swept to zero (Aug 2026); the set stays so any future offence fails loudly.
const BASELINE = new Set<string>([]);

describe('Rail 11 — every Rank stands alone', () => {
  const offences = collectOffences();

  it('no ladder value outside the baseline leans on another row', () => {
    const fresh = offences.filter((o) => !BASELINE.has(o.key));
    const report = fresh
      .map((o) => `${o.key}\n    "${o.value}"\n    → ${o.reasons.join('; ')}`)
      .join('\n');
    expect(fresh, `New Rail 11 offences:\n${report}`).toEqual([]);
  });

  it('the baseline holds no stale entries (fixed cards are removed from it)', () => {
    const current = new Set(offences.map((o) => o.key));
    const stale = [...BASELINE].filter((k) => !current.has(k));
    expect(stale).toEqual([]);
  });
});
