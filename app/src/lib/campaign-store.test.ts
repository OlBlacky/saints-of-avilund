// createCampaign is the validation backstop for the Campaign record
// (spec §13); the IndexedDB wrapper itself is a passthrough and gets no
// tests.

import { describe, expect, it } from 'vitest';

import {
  addGrant,
  addRosterEntry,
  addSession,
  createCampaign,
  removeGrant,
  removeRosterEntry,
  removeSession,
  updateRosterEntry,
  updateSession,
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

describe('session-log mutations', () => {
  const base = () => createCampaign('a', 0);

  it('add appends with the date, empty notes, and no mutation of the original', () => {
    const before = base();
    const after = addSession(before, '2026-08-18');
    expect(before.sessions).toEqual([]);
    expect(after.sessions).toHaveLength(1);
    expect(after.sessions[0]).toMatchObject({ date: '2026-08-18', notes: '' });
  });

  it('add rejects a blank date', () => {
    expect(() => addSession(base(), '  ')).toThrow();
  });

  it('update patches only the named Session', () => {
    let c = addSession(addSession(base(), '2026-08-18'), '2026-08-25');
    c = updateSession(c, c.sessions[1].id, { notes: 'the crypt' });
    expect(c.sessions[0].notes).toBe('');
    expect(c.sessions[1].notes).toBe('the crypt');
  });

  it('remove drops the Session; numbering is positional so the rest renumber', () => {
    let c = addSession(addSession(base(), '2026-08-18'), '2026-08-25');
    c = removeSession(c, c.sessions[0].id);
    expect(c.sessions.map((s) => s.date)).toEqual(['2026-08-25']);
  });

  it('update and remove throw on an unknown id', () => {
    expect(() => updateSession(base(), 'nope', { notes: 'x' })).toThrow();
    expect(() => removeSession(base(), 'nope')).toThrow();
  });
});

describe('grant-ledger mutations', () => {
  /** A campaign with two seats and one Session, for issuing against. */
  const seated = () => {
    let c = addRosterEntry(createCampaign('a', 0), 'Piotr', 'Wulfric');
    c = addRosterEntry(c, 'Anna', 'Elspeth');
    return addSession(c, '2026-08-18');
  };

  it('add appends the trimmed issue with its recipients, untethered from the input array', () => {
    const c = seated();
    const to = [c.roster[0].id];
    const after = addGrant(c, '  Milestone  ', to, c.sessions[0].id);
    to.push('tamper');
    expect(c.ledger).toEqual([]);
    expect(after.ledger).toHaveLength(1);
    expect(after.ledger[0]).toMatchObject({
      what: 'Milestone',
      to: [c.roster[0].id],
      sessionId: c.sessions[0].id,
    });
  });

  it('add works without a Session and omits the field', () => {
    const c = seated();
    expect(addGrant(c, 'K-17', [c.roster[1].id]).ledger[0].sessionId).toBeUndefined();
  });

  it('add rejects blank contents, no recipients, and unknown ids', () => {
    const c = seated();
    expect(() => addGrant(c, '   ', [c.roster[0].id])).toThrow();
    expect(() => addGrant(c, 'Milestone', [])).toThrow();
    expect(() => addGrant(c, 'Milestone', ['nope'])).toThrow();
    expect(() => addGrant(c, 'Milestone', [c.roster[0].id], 'nope')).toThrow();
  });

  it('remove drops the grant and throws on an unknown id', () => {
    let c = seated();
    c = addGrant(c, 'Milestone', [c.roster[0].id]);
    expect(removeGrant(c, c.ledger[0].id).ledger).toEqual([]);
    expect(() => removeGrant(c, 'nope')).toThrow();
  });
});
