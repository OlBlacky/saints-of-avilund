// The Companion chassis — one card shape for every creature that belongs to a
// character, with a Type that sets five dials. The rules live in
// mechanics/companions.md; this file is the data behind them.
//
// The dial the engine cares about is `numbers`. A Companion whose numbers are
// its own has a Level, a bank of its own earned Advances, and a death refund;
// one whose numbers belong to the card has none of that machinery — the card's
// Ladders are bought with the owner's Advances like any other Ability.

export type CompanionType = 'Beast' | 'Summoned';

/** The in-turn ladder a Command Feat walks down (Rail 6's own steps). */
export const COMMAND_STEPS = ['standard', 'move', 'minor', 'free'] as const;
export type CommandStep = (typeof COMMAND_STEPS)[number];

export interface CompanionDials {
  /** How it acts — its own turn, or the owner's Action. */
  command: string;
  /** Does it stay until it dies, or expire on a Duration? */
  permanence: string;
  /** Can it refuse? */
  loyalty: string;
  /** What keeping it costs. */
  upkeep: string;
  /** Whose numbers: its own stat block climbing its own Level, or the card's
   * Ladders bought with the owner's Advances. */
  numbers: 'own' | 'card';
  /** Whose turn it acts on: its owner's, after he has acted, or its own
   * roll in the order. */
  initiative: 'owner' | 'own';
  /** What commanding costs before any Command Feat buys it down. Absent
   * where the card states the Action itself. */
  commandAction?: CommandStep;
  /** The Command Feat for this Type, where one exists yet. */
  commandFeatId?: string;
}

export const COMPANION_TYPES: Record<CompanionType, CompanionDials> = {
  Beast: {
    command: 'It acts on your turn, after you. A Standard Action to change its standing Order.',
    permanence: 'Until it dies.',
    loyalty: 'Cannot refuse, but knows only its Orders.',
    upkeep: 'Feed, 1 cp/day.',
    numbers: 'own',
    initiative: 'owner',
    commandAction: 'standard',
    commandFeatId: 'command-beast',
  },
  Summoned: {
    command: 'It acts on your turn, after you, and only when you spend the Action the card names.',
    permanence: 'The card’s Duration, then it is gone.',
    loyalty: 'Cannot refuse. It is bound.',
    upkeep: 'A material component, spent per summoning.',
    numbers: 'card',
    initiative: 'owner',
  },
};

/** True for Types that carry their own Level, their own earned Advances, and
 * the death refund — the bonded ones. The engine gates every piece of that
 * machinery on this, never on the Type name. */
export function hasOwnLevel(type: CompanionType | undefined): boolean {
  return !!type && COMPANION_TYPES[type].numbers === 'own';
}

/** What it costs this character to command the Companion: the Type's own
 * Action, stepped down one rung per Rank of its Command Feat. */
export function commandAction(
  type: CompanionType | undefined,
  featRank: number,
): CommandStep | undefined {
  const base = type ? COMPANION_TYPES[type].commandAction : undefined;
  if (!base) return undefined;
  const at = COMMAND_STEPS.indexOf(base);
  return COMMAND_STEPS[Math.min(at + featRank, COMMAND_STEPS.length - 1)];
}

/** The Ladder that counts a Companion's Orders is named for them. */
export const ORDERS_LADDER = 'Orders';

/** An Orders Ladder states its allowance in one shape, and only one:
 * "As many Orders as its owner's <Attr>", with an optional "+ N". The sheet
 * has to count them, so the wording is a vocabulary rather than prose —
 * rails.test fails, by name, on any Ladder worded outside it. */
const ORDERS_ALLOWANCE = /^As many Orders as its owner’s (Str|Dex|Con|Int|Wis|Cha)(?: \+ (\d+))?$/;

const ATTR_BY_SHORT: Record<string, string> = {
  Str: 'Strength', Dex: 'Dexterity', Con: 'Constitution',
  Int: 'Intelligence', Wis: 'Wisdom', Cha: 'Charisma',
};

/** The attribute an Orders Ladder counts from, and what it adds on top.
 * Undefined when the Ladder is worded outside the vocabulary. */
export function parseOrdersAllowance(
  value: string | undefined,
): { attr: string; bonus: number } | undefined {
  const m = value?.match(ORDERS_ALLOWANCE);
  if (!m) return undefined;
  return { attr: ATTR_BY_SHORT[m[1]], bonus: Number(m[2] ?? 0) };
}

/** How many Orders the Companion may be taught, given the Ladder's value at
 * its current Rank and the owner's attribute. */
export function ordersAllowed(value: string | undefined, attrValue: number): number {
  const parsed = parseOrdersAllowance(value);
  if (!parsed) return 0;
  return Math.max(0, attrValue + parsed.bonus);
}
