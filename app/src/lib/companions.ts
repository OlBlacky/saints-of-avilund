// The Companion chassis — one card shape for every creature that belongs to a
// character, with a Type that sets five dials. The rules live in
// mechanics/companions.md; this file is the data behind them.
//
// The dial the engine cares about is `numbers`. A Companion whose numbers are
// its own has a Level, a bank of its own earned Advances, and a death refund;
// one whose numbers belong to the card has none of that machinery — the card's
// Ladders are bought with the owner's Advances like any other Ability.

export type CompanionType = 'Beast' | 'Summoned';

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
}

export const COMPANION_TYPES: Record<CompanionType, CompanionDials> = {
  Beast: {
    command: 'Its own turn, its own initiative. Orders are free.',
    permanence: 'Until it dies.',
    loyalty: 'Cannot refuse, but knows only its Orders.',
    upkeep: 'Feed, 1 cp/day.',
    numbers: 'own',
  },
  Summoned: {
    command: 'It acts only when the owner spends the Action the card names.',
    permanence: 'The card’s Duration, then it is gone.',
    loyalty: 'Cannot refuse. It is bound.',
    upkeep: 'A material component, spent per summoning.',
    numbers: 'card',
  },
};

/** True for Types that carry their own Level, their own earned Advances, and
 * the death refund — the bonded ones. The engine gates every piece of that
 * machinery on this, never on the Type name. */
export function hasOwnLevel(type: CompanionType | undefined): boolean {
  return !!type && COMPANION_TYPES[type].numbers === 'own';
}
