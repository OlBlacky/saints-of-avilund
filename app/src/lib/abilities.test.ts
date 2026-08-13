// The card-resolution helpers the Character Sheet reads a card through: which
// Ladder a builder copy actually carries, and what a Rank resolves to. These
// run against the real corpus, so a renamed Malediction or a Ladder moved out
// of its option block fails here rather than silently emptying a card.

import { describe, expect, it } from 'vitest';

import { chosenLadder, resolveValue } from './abilities';
import type { Ability } from './abilities';
import { CATEGORIES } from './category-abilities';
import { DAMAGE_TYPES } from './notation';

const cardNamed = (name: string): Ability => {
  const card = CATEGORIES.flatMap((c) => c.abilities).find((a) => a.name === name);
  if (!card) throw new Error(`no such Ability: ${name}`);
  return card;
};

describe('chosenLadder', () => {
  it('finds the Ladder a builder copy was built around', () => {
    const card = cardNamed('Dictiones Atras Susurrare');
    const ladder = chosenLadder(card, { malediction: 'Ill Luck' });
    expect(ladder?.name).toBe('Ill Luck');
    expect(ladder?.base).toBeTruthy();
  });

  it('resolves for every option the builder choice offers', () => {
    const card = cardNamed('Dictiones Atras Susurrare');
    const key = card.builderChoice!.key;
    for (const option of card.builderChoice!.options) {
      expect(chosenLadder(card, { [key]: option })?.name).toBe(option);
    }
  });

  it('is undefined without a choice, or for a card that has none', () => {
    const builder = cardNamed('Dictiones Atras Susurrare');
    expect(chosenLadder(builder, undefined)).toBeUndefined();
    expect(chosenLadder(builder, { malediction: '' })).toBeUndefined();
    expect(chosenLadder(cardNamed('Bind Spirit'), { malediction: 'Ill Luck' })).toBeUndefined();
  });

  // Two kinds of build choice: one that names a Ladder of its own (a
  // Malediction) and one that names a damage type the card's own Damage
  // Ladder then carries (a New Magic element). A choice that resolves to
  // neither would leave the card silent about what it was built around.
  it('every build choice is either its own Ladder or a damage type', () => {
    const builders = CATEGORIES.flatMap((c) => c.abilities).filter((a) => a.builderChoice);
    expect(builders.length).toBeGreaterThan(0);
    for (const card of builders) {
      const { key, options } = card.builderChoice!;
      for (const option of options) {
        const resolved =
          chosenLadder(card, { [key]: option }) !== undefined || DAMAGE_TYPES.includes(option);
        expect(resolved, `${card.name} · ${option}`).toBe(true);
      }
    }
  });
});

describe('resolveValue', () => {
  it('gives the base at Rank 0 or absent, and the advance at a Rank', () => {
    const ladder = chosenLadder(cardNamed('Dictiones Atras Susurrare'), { malediction: 'Ill Luck' })!;
    expect(resolveValue(ladder, undefined)).toBe(ladder.base);
    expect(resolveValue(ladder, 0)).toBe(ladder.base);
    expect(resolveValue(ladder, 1)).toBe(ladder.advances![0].value);
  });

  it('falls back to the base when the Rank runs past the Ladder', () => {
    const ladder = chosenLadder(cardNamed('Dictiones Atras Susurrare'), { malediction: 'Ill Luck' })!;
    expect(resolveValue(ladder, 99)).toBe(ladder.base);
  });
});
