// createCampaign is the validation backstop for the Campaign record
// (spec §13); the IndexedDB wrapper itself is a passthrough and gets no
// tests.

import { describe, expect, it } from 'vitest';

import {
  addRosterEntry,
  createCampaign,
  removeRosterEntry,
  updateRosterEntry,
} from './campaign-store';

describe('createCampaign', () => {
  it('trims the name and starts every list empty', () => {
    const c = createCampaign('  The Femur of St. Carpathi  ', 0);
    expect(c.name).toBe('The Femur of St. Carpathi');
    expect(c.entryLevel).toBe(0);
    expect(c.roster).toEqual([]);
    expect(c.sessions).toEqual([]);
    expect(c.ledger).toEqual([]);
    expect(c.options).toEqual({ partyInventory: false });
    expect(c.moduleId).toBeUndefined();
    expect(c.schemaVersion).toBe(1);
  });

  it('rejects a blank name', () => {
    expect(() => createCampaign('   ', 0)).toThrow();
  });

  it('accepts the full entry-level range 0..11 and nothing outside it', () => {
    expect(createCampaign('a', 0).entryLevel).toBe(0);
    expect(createCampaign('a', 11).entryLevel).toBe(11);
    expect(() => createCampaign('a', -1)).toThrow();
    expect(() => createCampaign('a', 12)).toThrow();
    expect(() => createCampaign('a', 2.5)).toThrow();
  });

  it('mints distinct ids', () => {
    expect(createCampaign('a', 0).id).not.toBe(createCampaign('a', 0).id);
  });
});

describe('roster mutations', () => {
  const base = () => createCampaign('a', 0);

  it('add appends a trimmed entry and leaves the original untouched', () => {
    const before = base();
    const after = addRosterEntry(before, '  Piotr ', ' Wulfric ');
    expect(before.roster).toEqual([]);
    expect(after.roster).toHaveLength(1);
    expect(after.roster[0].player).toBe('Piotr');
    expect(after.roster[0].character).toBe('Wulfric');
  });

  it('add allows a blank character but not a blank player', () => {
    expect(addRosterEntry(base(), 'Piotr', '').roster[0].character).toBe('');
    expect(() => addRosterEntry(base(), '   ', 'Wulfric')).toThrow();
  });

  it('update patches only the named entry', () => {
    let c = addRosterEntry(addRosterEntry(base(), 'Piotr', ''), 'Anna', '');
    c = updateRosterEntry(c, c.roster[0].id, { character: 'Wulfric' });
    expect(c.roster[0].character).toBe('Wulfric');
    expect(c.roster[1].character).toBe('');
  });

  it('remove drops the entry and leaves the rest', () => {
    let c = addRosterEntry(addRosterEntry(base(), 'Piotr', ''), 'Anna', '');
    c = removeRosterEntry(c, c.roster[0].id);
    expect(c.roster.map((r) => r.player)).toEqual(['Anna']);
  });

  it('update and remove throw on an unknown id', () => {
    expect(() => updateRosterEntry(base(), 'nope', { player: 'x' })).toThrow();
    expect(() => removeRosterEntry(base(), 'nope')).toThrow();
  });
});
