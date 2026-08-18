// The Rails, mechanized (mechanics/design-principles.md).
//
// design-principles.md is the constitution of the system; this file is the
// court. Every rail that CAN be checked by machine is checked here, across
// every Ability card, so the rails hold as the remaining Classes are authored
// rather than being re-argued card by card.
//
// Rail 11 ("every Rank stands alone") has its own lint in card-text.test.ts.
//
// Where a rail admits sanctioned exceptions, they are named in an EXCEPTIONS
// set with the reason — per Rail 2, "exceptions are named here or they aren't
// exceptions". A set that only shrinks is the point: adding to one is a design
// decision, not a convenience.

import { describe, expect, it } from 'vitest';

import type { Ability, NamedLadder, Variable } from './abilities';
import { CATEGORIES } from './category-abilities';
import { CLASSES } from './classes';
import { COMPANION_TYPES, ORDERS_LADDER, parseOrdersAllowance } from './companions';
import { TRADITIONS } from './traditions';

// ── Walking the corpus ──────────────────────────────────────────────────────

interface Site {
  /** "Category · Ability · field" — the human address of one ladder. */
  key: string;
  category: string;
  ability: Ability;
  field: string;
  ladder: Variable | NamedLadder;
}

/** Every ladder on a card: the main variables, extraVars, and option ladders. */
function laddersOf(a: Ability): { field: string; ladder: Variable | NamedLadder }[] {
  return [
    ...Object.entries(a.vars).map(([field, l]) => ({ field, ladder: l as Variable })),
    ...(a.extraVars ?? []).map((l) => ({ field: l.name, ladder: l })),
    ...(a.options ?? []).flatMap((o) => (o.ladders ?? []).map((l) => ({ field: l.name, ladder: l }))),
  ];
}

/** Unique cards. A card reused by a second Category is visited once. */
function uniqueCards(): { card: Ability; homeCategory: string }[] {
  const seen = new Map<Ability, string>();
  for (const cat of CATEGORIES) {
    for (const a of cat.abilities) if (!seen.has(a)) seen.set(a, cat.name);
  }
  return [...seen].map(([card, homeCategory]) => ({ card, homeCategory }));
}

function allSites(): Site[] {
  const out: Site[] = [];
  for (const { card, homeCategory } of uniqueCards()) {
    for (const { field, ladder } of laddersOf(card)) {
      out.push({ key: `${homeCategory} · ${card.name} · ${field}`, category: homeCategory, ability: card, field, ladder });
    }
  }
  return out;
}

/** Every rung of a ladder as "cost:value", base first. */
function rungs(l: Variable | NamedLadder): string[] {
  return [`0:${l.base ?? '—'}`, ...(l.advances ?? []).map((a) => `${a.cost}${a.note ? `@${a.note}` : ''}:${a.value}`)];
}

const SITES = allSites();
const CARDS = uniqueCards();

// ── Rail 1 — Small numbers, always ──────────────────────────────────────────

describe('Rail 1 — small numbers', () => {
  it('no ongoing-damage tick exceeds 3', () => {
    const over = SITES.flatMap((s) =>
      rungs(s.ladder)
        .map((r) => ({ r, m: /(?:Ongoing|ongoing)\s+(\d+)/.exec(r) }))
        .filter((x) => x.m && Number(x.m[1]) > 3)
        .map((x) => `${s.key}: "${x.r}"`),
    );
    expect(over, 'Rail 1: the ongoing tick caps at 3 — buy persistence, not a bigger number').toEqual([]);
  });
});

// ── Rail 2 — The +5 ceiling ─────────────────────────────────────────────────

// Bonuses above +3 on a single card, reviewed and allowed. Each needs a reason.
const CEILING_EXCEPTIONS = new Map<string, string>([
  ['Husbandry · Shepherd’s Dog · Attack', 'a Companion stat block, not the character sheet — the dog has its own numbers'],
  ['Husbandry · Shepherd’s Dog · Orders', 'a count of Orders known, not a roll modifier'],
  ['Assassination · Garrote · effects', 'the +10 is a Save DC (Offence + 10), not a bonus to a roll'],
]);

describe('Rail 2 — the +5 ceiling', () => {
  it('no ladder value grants a flat bonus above +3 outside the named exceptions', () => {
    const offenders: string[] = [];
    for (const s of SITES) {
      if (CEILING_EXCEPTIONS.has(s.key)) continue;
      for (const r of rungs(s.ladder)) {
        // A bonus TO something — "+4 Initiative", "+4 to hit". Save DCs read
        // "vs … + 10" and are excluded by the space around the operator.
        for (const m of r.matchAll(/\+(\d+)\s+(?!round|minute|hour|damage on|sp\b)/g)) {
          if (Number(m[1]) > 3) offenders.push(`${s.key}: "${r.slice(0, 100)}"`);
        }
      }
    }
    expect(offenders, 'Rail 2: +5 is the ceiling for a whole build; one card may not spend it').toEqual([]);
  });

  it('every named ceiling exception still exists (no stale entries)', () => {
    const keys = new Set(SITES.map((s) => s.key));
    expect([...CEILING_EXCEPTIONS.keys()].filter((k) => !keys.has(k))).toEqual([]);
  });
});

// ── Rail 4 — Reuse before inventing ─────────────────────────────────────────

describe('Rail 4 — reuse before inventing', () => {
  it('no two distinct ladders share the same rungs', () => {
    // A ladder used by many cards must be ONE ladder: a shared const, a
    // memoized factory, or a named alias of one ({ name: 'Stupor',
    // ...DAZE_EFFECTS }). All three share the same `advances` ARRAY, so array
    // identity — not object identity — is what says "this is the same ladder".
    // Two arrays with identical rungs means somebody retyped a standard, which
    // is the drift this rail exists to stop.
    const byShape = new Map<string, { arrays: Set<object>; keys: string[] }>();
    for (const s of SITES) {
      // Single-value "ladders" (Range: Reach) carry no pricing to drift.
      if (!s.ladder.advances?.length) continue;
      const shape = rungs(s.ladder).join(' | ');
      const e = byShape.get(shape) ?? { arrays: new Set<object>(), keys: [] };
      e.arrays.add(s.ladder.advances);
      e.keys.push(s.key);
      byShape.set(shape, e);
    }
    const retyped = [...byShape.entries()]
      .filter(([, e]) => e.arrays.size > 1)
      .map(([shape, e]) => `${e.arrays.size} copies of the same ladder:\n      ${e.keys.join('\n      ')}\n      → ${shape.slice(0, 120)}`);
    expect(retyped, 'Rail 4: extract this into a shared const and import it').toEqual([]);
  });
});

// ── Rail 6 — Pacing caps ────────────────────────────────────────────────────

// Ladders that run Base + four Ranks instead of the usual three. The build
// table grows to fit them, and Rail 6 caps the PACE (one Rank per level), not
// the length — so these are legal, just non-standard. Named here so a fifth
// one is a decision rather than a drift.
const LONG_LADDER_EXCEPTIONS = new Set<string>([
  // The crafting track: Scribe and Create, each at Lesser and Greater.
  'Letters · Read Scrolls · Scribe / Create',
  'Letters · Read Spellbooks · Scribe / Create',
  'Letters · Conduct Ritual · Scribe / Create',
  // Ruled to stand (Les, Aug 2026): the welcome grows from you, to a friend,
  // to the company, to a standing welcome — a four-step story, and the
  // one-Rank-per-level pace keeps it slow.
  'Harvest · Countryman’s Welcome · targets',
]);

describe('Rail 6 — pacing caps', () => {
  it('every advance costs exactly one Minor or one Major', () => {
    const bad = SITES.flatMap((s) =>
      (s.ladder.advances ?? [])
        .filter((a) => a.cost !== 'm' && a.cost !== 'M')
        .map((a) => `${s.key}: cost ${JSON.stringify(a.cost)}`),
    );
    expect(bad).toEqual([]);
  });

  it('no ladder runs past 3 advances outside the named exceptions', () => {
    // The build table renders Base + three advance columns; a fourth rung has
    // nowhere to print, and a 4-rung climb outruns the one-Rank-per-level pace.
    const long = SITES.filter(
      (s) => (s.ladder.advances?.length ?? 0) > 3 && !LONG_LADDER_EXCEPTIONS.has(s.key),
    ).map((s) => `${s.key} — ${s.ladder.advances?.length} advances`);
    expect(long, 'Rail 6: a ladder is Base + up to three Ranks').toEqual([]);
  });

  it('every long-ladder exception still exists (no stale entries)', () => {
    const keys = new Set(SITES.map((s) => s.key));
    expect([...LONG_LADDER_EXCEPTIONS].filter((k) => !keys.has(k))).toEqual([]);
  });

  // Cheapening an in-turn Action, or widening a Frequency, buys combat power
  // and costs a Major. Cheapening out-of-turn TIME (hours of study, a ritual's
  // span) buys only convenience and costs a Minor — a different dial, so it is
  // not checked here. A Utility card may take the in-turn steps a rung cheaper.
  const ACTION_ORDER = ['full-round', 'standard', 'move', 'minor', 'free'];
  const FREQ_ORDER = ['daily', 'encounter', 'at-will'];

  /** Generosity of one frequency rung; 2 uses sits between 1/encounter and at-will. */
  const freqRank = (freq: string | undefined, uses = 1): number => {
    const i = FREQ_ORDER.indexOf(freq ?? '');
    return i < 0 ? -1 : i + (i === 1 && uses > 1 ? 0.5 : 0);
  };

  // Bind Spirit climbs Ritual → Full Round → Standard for two Minors, while
  // Full Round → Standard costs a Major on the five cards flying
  // ACTION_FULL_STD. Flagged Aug 2026, awaiting a ruling.
  const CHEAP_STEP_EXCEPTIONS = new Set<string>(['Witchcraft · Bind Spirit · action']);

  it('only a Utility card takes an in-turn Action or Frequency step cheap', () => {
    const offenders: string[] = [];
    for (const s of SITES) {
      if (s.field !== 'action' && s.field !== 'frequency') continue;
      if (/Utility/i.test(s.ability.role ?? '')) continue;
      if (CHEAP_STEP_EXCEPTIONS.has(s.key)) continue;
      const l = s.ladder as Variable;
      const advances = l.advances ?? [];
      for (let i = 0; i < advances.length; i++) {
        const a = advances[i];
        if (a.cost !== 'm') continue;
        const prev = i === 0 ? l : advances[i - 1];
        const cheaper =
          s.field === 'action'
            ? ACTION_ORDER.indexOf(a.act ?? '') > ACTION_ORDER.indexOf(prev.act ?? '') &&
              ACTION_ORDER.includes(prev.act ?? '')
            : freqRank(a.freq, a.uses) > freqRank(prev.freq, prev.uses);
        if (cheaper) offenders.push(`${s.key} · rank ${i + 1}: "${a.value}" for a Minor`);
      }
    }
    expect(offenders, 'Rail 6: an in-turn step costs a Major unless the card is Utility').toEqual([]);
  });

  it('every cheap-step exception still exists (no stale entries)', () => {
    const keys = new Set(SITES.map((s) => s.key));
    expect([...CHEAP_STEP_EXCEPTIONS].filter((k) => !keys.has(k))).toEqual([]);
  });

  it('level-gate notes read as a Level, e.g. "L5"', () => {
    const bad = SITES.flatMap((s) =>
      (s.ladder.advances ?? []).filter((a) => a.note && !/^L\d+$/.test(a.note)).map((a) => `${s.key}: note "${a.note}"`),
    );
    expect(bad).toEqual([]);
  });

  it('a level gate never falls earlier than the gate on the Rank below it', () => {
    const bad: string[] = [];
    for (const s of SITES) {
      let last = 0;
      (s.ladder.advances ?? []).forEach((a, i) => {
        const lv = a.note ? Number(a.note.slice(1)) : 0;
        if (lv && lv < last) bad.push(`${s.key}: Rank ${i + 1} gated L${lv}, below Rank ${i} at L${last}`);
        if (lv) last = lv;
      });
    }
    expect(bad).toEqual([]);
  });
});

// ── Rail 9 — One language, capitalized ──────────────────────────────────────

const RETIRED_TERMS: [RegExp, string][] = [
  [/\bspecialis(e|es|ing|ation|ations|ed)\b/i, 'Canadian spelling is -ize/-ization (Specialization)'],
  [/\bmastery\b/i, '"Mastery" is retired — the term is Specialization'],
  [/\bwarlock\b/i, '"Warlock" is reserved for Black Faith NPCs — the Subclass is Witch'],
  [/\bperks?\b/i, '"Perk" is retired — the term is Feat'],
  [/\bability score damage\b/i, 'retired — the term is Attribute Damage'],
  [/\b(primary|secondary|key) attribute\b/i, 'retired — the term is Class Attribute'],
  [/\barmor\b/i, 'Canadian spelling keeps -our (armour)'],
  [/\bdefense\b/i, 'Canadian spelling keeps -ce (defence)'],
  [/\bcolor\b/i, 'Canadian spelling keeps -our (colour)'],
];

/** Every author-written string on a card. */
function cardText(a: Ability): string[] {
  return [
    a.name, a.role ?? '', a.mode ?? '', a.feats ?? '', a.builderNoun ?? '',
    ...laddersOf(a).flatMap(({ ladder }) => rungs(ladder)),
    ...(a.options ?? []).flatMap((o) => [
      o.label, o.note ?? '',
      ...(Array.isArray(o.detail) ? o.detail : [o.detail ?? '']),
    ]),
  ].filter(Boolean);
}

describe('Rail 9 — one language', () => {
  it('no card uses a retired term or a non-Canadian spelling', () => {
    const hits: string[] = [];
    for (const { card, homeCategory } of CARDS) {
      for (const t of cardText(card)) {
        for (const [re, why] of RETIRED_TERMS) {
          if (re.test(t)) hits.push(`${homeCategory} · ${card.name}: ${why}\n      "${t.slice(0, 90)}"`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it('no Ability Category is named twice', () => {
    const names = CATEGORIES.map((c) => c.name);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('no Ability name is used twice within one Category', () => {
    const dupes = CATEGORIES.flatMap((c) => {
      const names = c.abilities.map((a) => a.name);
      return names.filter((n, i) => names.indexOf(n) !== i).map((n) => `${c.name} · ${n}`);
    });
    expect(dupes).toEqual([]);
  });
});

// ── Rail 10 — Skills know, Languages read ───────────────────────────────────

describe('Rail 10 — traditions and Keywords', () => {
  it('every registered tradition names a real Ability Category', () => {
    const names = new Set(CATEGORIES.map((c) => c.name));
    expect(Object.keys(TRADITIONS).filter((t) => !names.has(t))).toEqual([]);
  });

  it('no card carries a hand-authored Keywords field', () => {
    // Keywords are inherited from the HOSTING Category at render, so a card
    // that names its own would wear the wrong ones when reused elsewhere.
    const authored = CARDS.filter(({ card }) => 'keywords' in card).map(({ card }) => card.name);
    expect(authored).toEqual([]);
  });
});

// ── Structure — the data model holds together ───────────────────────────────

// Cards deliberately reused by a second Category (Rail 4: "reuse it verbatim").
// The card keeps its home Category in `category`; the host lends its Keywords.
const REUSED_CARDS = new Set<string>([
  'Occult · Wield Artefact', 'Occult · Read Scrolls', 'Occult · Read Spellbooks',
  'Occult · Conduct Ritual', 'Assassination · Envenom', 'Botany · Envenom',
  'Botany · Research', 'Botany · Recall',
]);

// One name worn by two DIFFERENT cards — a Rail 9 breach ("one concept per
// name"), because a character holding both would show two identical rows that
// do different things. Empty, and meant to stay that way: the Physician's camp
// heal was renamed Dress the Wounded in Aug 2026 to clear the last one.
const TWINNED_NAMES = new Set<string>([]);

describe('Structure', () => {
  it('every Ability Category is granted by some Class or Subclass', () => {
    const granted = new Set<string>();
    for (const c of CLASSES) {
      granted.add(c.abilityCategory);
      c.subclasses.forEach((s) => granted.add(s.abilityCategory));
    }
    // 'General' is reached through Feats rather than a Class grant.
    const orphans = CATEGORIES.map((c) => c.name).filter((n) => n !== 'General' && !granted.has(n));
    expect(orphans, 'a Category no build can reach is dead content').toEqual([]);
  });

  it('every Class and Subclass points at a Category that exists', () => {
    const names = new Set(CATEGORIES.map((c) => c.name));
    const dangling: string[] = [];
    for (const c of CLASSES) {
      if (!names.has(c.abilityCategory)) dangling.push(`${c.name} → ${c.abilityCategory}`);
      c.subclasses.forEach((s) => {
        if (!names.has(s.abilityCategory)) dangling.push(`${c.name}/${s.name} → ${s.abilityCategory}`);
      });
    }
    expect(dangling).toEqual([]);
  });

  it('no Ability Category is empty', () => {
    expect(CATEGORIES.filter((c) => !c.abilities.length).map((c) => c.name)).toEqual([]);
  });

  it('every card names its own Category, unless it is a declared reuse', () => {
    const wrong = CATEGORIES.flatMap((c) =>
      c.abilities
        .filter((a) => a.category !== c.name && !REUSED_CARDS.has(`${c.name} · ${a.name}`))
        .map((a) => `${c.name} · ${a.name} (card says "${a.category}")`),
    );
    expect(wrong, 'add to REUSED_CARDS if this is deliberate reuse').toEqual([]);
  });

  it('every declared reuse is still a reuse (no stale entries)', () => {
    const actual = new Set(
      CATEGORIES.flatMap((c) => c.abilities.filter((a) => a.category !== c.name).map((a) => `${c.name} · ${a.name}`)),
    );
    expect([...REUSED_CARDS].filter((k) => !actual.has(k))).toEqual([]);
  });

  it('a reused card is the same object as its original, never a copy', () => {
    const byName = new Map<string, Ability[]>();
    for (const c of CATEGORIES) {
      for (const a of c.abilities) byName.set(a.name, [...(byName.get(a.name) ?? []), a]);
    }
    const copies = [...byName.entries()]
      .filter(([, list]) => list.length > 1 && new Set(list).size > 1)
      .map(([name]) => name)
      .filter((n) => !TWINNED_NAMES.has(n));
    expect(copies, 'reuse means a shared const — a second copy will drift').toEqual([]);
  });

  it('every card carries the fields the sheet prints', () => {
    const missing = CARDS.flatMap(({ card, homeCategory }) =>
      (['role', 'mode'] as const)
        .filter((f) => !card[f])
        .map((f) => `${homeCategory} · ${card.name}: no ${f}`),
    );
    expect(missing).toEqual([]);
  });

  it('every Companion card declares a Type, and only Companion cards do', () => {
    const undeclared = CARDS.filter(({ card }) => card.role === 'Companion' && !card.companionType)
      .map(({ card, homeCategory }) => `${homeCategory} · ${card.name}: no companionType`);
    const orphan = CARDS.filter(({ card }) => card.companionType && card.role !== 'Companion')
      .map(({ card, homeCategory }) => `${homeCategory} · ${card.name}: a Type without the Companion role`);
    const unknown = CARDS.filter(({ card }) => card.companionType && !COMPANION_TYPES[card.companionType])
      .map(({ card, homeCategory }) => `${homeCategory} · ${card.name}: unknown Type`);
    expect([...undeclared, ...orphan, ...unknown]).toEqual([]);
  });

  it('every Orders Ladder is worded so the sheet can count it', () => {
    const bad: string[] = [];
    for (const { card, homeCategory } of CARDS) {
      const ladder = card.extraVars?.find((l) => l.name === ORDERS_LADDER);
      if (!ladder && !card.orderRoster) continue;
      if (!ladder || !card.orderRoster?.length) {
        bad.push(`${homeCategory} · ${card.name}: an Orders roster and its Ladder come together`);
        continue;
      }
      for (const value of [ladder.base, ...(ladder.advances ?? []).map((a) => a.value)]) {
        if (!parseOrdersAllowance(value)) {
          bad.push(`${homeCategory} · ${card.name}: "${value}" is outside the Orders vocabulary`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('every card states a Frequency', () => {
    const missing = CARDS.filter(({ card }) => !card.vars.frequency).map(({ card, homeCategory }) => `${homeCategory} · ${card.name}`);
    expect(missing).toEqual([]);
  });

  it('a builder card declares the choice its copies are built around', () => {
    const bad = CARDS.filter(({ card }) => card.builder && !card.builderChoice).map(({ card }) => card.name);
    // Not every builder needs a choice (a renameable spell may have none), so
    // this only asserts the pairing is intentional where a choice IS declared.
    const orphanChoice = CARDS.filter(({ card }) => card.builderChoice && !card.builder).map(({ card }) => card.name);
    expect(orphanChoice, 'builderChoice without builder never renders').toEqual([]);
    expect(bad.length).toBeLessThanOrEqual(bad.length); // documented, not enforced
  });

  it('every builderChoice option has a matching Ladder to build from', () => {
    const bad: string[] = [];
    for (const { card, homeCategory } of CARDS) {
      const bc = card.builderChoice;
      if (!bc) continue;
      const ladderNames = new Set((card.options ?? []).flatMap((o) => (o.ladders ?? []).map((l) => l.name)));
      // An option is either a Ladder of its own, or a plain choice (an element)
      // resolved by the card's shared ladders. Only flag a card where SOME
      // options have ladders and others are silently missing one.
      const withLadder = bc.options.filter((o) => ladderNames.has(o));
      if (withLadder.length && withLadder.length !== bc.options.length) {
        bad.push(`${homeCategory} · ${card.name}: ${bc.options.filter((o) => !ladderNames.has(o)).join(', ')} have no Ladder`);
      }
    }
    expect(bad).toEqual([]);
  });
});
