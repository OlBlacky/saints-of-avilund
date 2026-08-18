// createCampaign is the validation backstop for the Campaign record
// (spec §13); the IndexedDB wrapper itself is a passthrough and gets no
// tests.

import { describe, expect, it } from 'vitest';

import { createCampaign } from './campaign-store';

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
