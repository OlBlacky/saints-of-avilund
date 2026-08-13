// The Action & Frequency token vocabulary (mechanics/action-and-frequency.md).
// Both fields drive a badge on the sheet, and a badge can only be drawn from a
// closed vocabulary — so these run against the real corpus: an Ability authored
// with free prose, or with a token that carries none of the rules its token
// demands (a Reaction without its trigger), fails here.

import { describe, expect, it } from 'vitest';

import {
  ACTION_LABEL,
  actionBadge,
  actionCost,
  formatAct,
  formatFreq,
  freqBadge,
  frequency,
  resolveRung,
} from './abilities';
import type { ActionToken, FreqToken, RungSpec, Variable } from './abilities';
import { CATEGORIES } from './category-abilities';

const CARDS = CATEGORIES.flatMap((c) => c.abilities.map((a) => ({ cat: c.name, a })));

const FREQ_TOKENS: FreqToken[] = ['passive', 'at-will', 'encounter', 'daily', 'uncapped'];
const ACTION_TOKENS = Object.keys(ACTION_LABEL) as ActionToken[];

/** Every rung of a variable: the base, then each advance. */
const rungs = (v: Variable | undefined): RungSpec[] =>
  v ? [v, ...(v.advances ?? [])] : [];

describe('the corpus speaks the token vocabulary', () => {
  it('gives every Frequency rung a legal token', () => {
    for (const { cat, a } of CARDS) {
      for (const r of rungs(a.vars.frequency)) {
        expect(FREQ_TOKENS, `${cat} / ${a.name}`).toContain(r.freq);
      }
    }
  });

  it('gives every Action rung a legal token', () => {
    for (const { cat, a } of CARDS) {
      for (const r of rungs(a.vars.action)) {
        expect(ACTION_TOKENS, `${cat} / ${a.name}`).toContain(r.act);
      }
    }
  });

  it('states the trigger on every Reaction and Interrupt', () => {
    for (const { cat, a } of CARDS) {
      for (const r of rungs(a.vars.action)) {
        if (r.act === 'reaction' || r.act === 'interrupt') {
          expect(r.trigger, `${cat} / ${a.name}`).toBeTruthy();
        }
      }
    }
  });

  it('names the Skill on every check-cost Ability', () => {
    for (const { cat, a } of CARDS) {
      for (const r of rungs(a.vars.action)) {
        if (r.act === 'check') expect(r.check, `${cat} / ${a.name}`).toBeTruthy();
      }
    }
  });

  // The escape hatch stays an escape hatch. If this trips, the vocabulary is
  // missing a token — add the token rather than raising the cap.
  it('keeps "varies" rare', () => {
    const varies = CARDS.filter(({ a }) => a.vars.action?.act === 'varies');
    expect(varies.length).toBeLessThanOrEqual(6);
  });

  it('never sells a Passive an action cost', () => {
    for (const { cat, a } of CARDS) {
      if (a.vars.frequency?.freq !== 'passive') continue;
      const act = a.vars.action?.act;
      expect(act === undefined || act === 'none', `${cat} / ${a.name}`).toBe(true);
    }
  });
});

describe('formatting', () => {
  it('writes the Frequency line from the token', () => {
    expect(formatFreq({ freq: 'daily' })).toBe('Daily');
    expect(formatFreq({ freq: 'encounter', uses: 2 })).toBe('Twice per Encounter');
    expect(formatFreq({ freq: 'passive' })).toBe('Passive (always on)');
    expect(formatFreq({ freq: 'at-will', detail: 'one prepared dose per use' }))
      .toBe('At-Will (one prepared dose per use)');
  });

  it('writes the Action line from the token', () => {
    expect(formatAct({ act: 'move' })).toBe('Move');
    expect(formatAct({ act: 'reaction', trigger: 'when an adjacent ally is hit' }))
      .toBe('Reaction — when an adjacent ally is hit');
    expect(formatAct({ act: 'ritual', time: '4 hours' })).toBe('Ritual — 4 hours');
    expect(formatAct({ act: 'downtime', time: '8 hours', detail: 'of study' }))
      .toBe('8 hours of study');
    expect(formatAct({ act: 'scene', combat: 'standard', detail: 'a conversation' }))
      .toBe('A conversation (Standard in a tense scene)');
    expect(formatAct({ act: 'check', check: 'Perception' })).toBe('Perception Check');
  });
});

describe('the badges', () => {
  it('gives a Daily one box and At-Will none', () => {
    expect(freqBadge({ freq: 'daily' })).toMatchObject({ label: 'Daily', boxes: 1 });
    expect(freqBadge({ freq: 'encounter', uses: 2 })).toMatchObject({ boxes: 2 });
    expect(freqBadge({ freq: 'at-will' })).toMatchObject({ infinite: true });
  });

  it('leaves a Passive unbadged', () => {
    expect(freqBadge({ freq: 'passive' })).toBeUndefined();
    expect(actionBadge({ act: 'none' })).toBeUndefined();
  });

  it('glyphs the costs that come out of your turn, and only those', () => {
    expect(actionBadge({ act: 'move' })?.glyph).toBe('➤');
    expect(actionBadge({ act: 'standard' })?.glyph).toBe('◆');
    expect(actionBadge({ act: 'rest' })?.glyph).toBeUndefined();
    expect(actionBadge({ act: 'downtime', time: '8 hours' })).toMatchObject({ note: '8 hours' });
  });

  it('badges the Rank the character actually holds', () => {
    const v = frequency({ freq: 'daily' }, { freq: 'encounter', cost: 'M' });
    expect(freqBadge(resolveRung(v, 0))).toMatchObject({ label: 'Daily' });
    expect(freqBadge(resolveRung(v, 1))).toMatchObject({ label: 'Encounter' });
    const a = actionCost({ act: 'standard' }, { act: 'move', cost: 'm' });
    expect(actionBadge(resolveRung(a, 1))?.glyph).toBe('➤');
  });
});
