// createCampaign is the validation backstop for the Campaign record
// (spec §13); the IndexedDB wrapper itself is a passthrough and gets no
// tests.

import { describe, expect, it } from 'vitest';

import {
  addAppendixSection,
  addBook,
  addCE,
  addChapter,
  addEncounter,
  addGrant,
  addMap,
  addRosterEntry,
  addSession,
  attachModule,
  createCampaign,
  ensureModule,
  exportCampaignFile,
  exportModuleFile,
  moveChapter,
  parseCampaignFile,
  parseModuleFile,
  removeAppendixSection,
  removeBook,
  removeCE,
  removeChapter,
  removeEncounter,
  removeGrant,
  removeMap,
  removeRosterEntry,
  removeSession,
  renameCampaign,
  setChapterBook,
  updateAppendixSection,
  updateBook,
  updateBookCover,
  updateBookInsideCover,
  updateBookReward,
  updateCE,
  updateChapter,
  updateCover,
  updateEncounter,
  updateInsideCover,
  updateMap,
  updateReward,
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
    expect(c.module).toBeUndefined();
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

describe('campaign file', () => {
  it('round-trips through export and parse', () => {
    let c = addRosterEntry(createCampaign('The Femur', 0), 'Piotr', 'Wulfric');
    c = addSession(c, '2026-08-18');
    expect(parseCampaignFile(exportCampaignFile(c))).toEqual(c);
  });

  it('rejects a character file and garbage', () => {
    const characterFile = JSON.stringify({
      id: 'x',
      schemaVersion: 1,
      versions: [{ id: 'v1', draft: { events: [] } }],
    });
    expect(() => parseCampaignFile(characterFile)).toThrow();
    expect(() => parseCampaignFile('nonsense')).toThrow();
  });
});

describe('module mutations', () => {
  const withModule = () => ensureModule(createCampaign('The Femur', 0));

  it('ensureModule starts once, titled after the campaign, and is idempotent', () => {
    const c = withModule();
    expect(c.module!.title).toBe('The Femur');
    expect(c.module!.chapters).toEqual([]);
    expect(ensureModule(c)).toBe(c);
  });

  it('chapter edits require a Module', () => {
    expect(() => addChapter(createCampaign('a', 0))).toThrow();
  });

  it('adds, updates, and removes Chapters without mutating the original', () => {
    const before = withModule();
    let c = addChapter(before);
    expect(before.module!.chapters).toEqual([]);
    c = updateChapter(c, c.module!.chapters[0].id, { title: 'The Road', summary: 'To Vyshgorod' });
    expect(c.module!.chapters[0]).toMatchObject({ title: 'The Road', summary: 'To Vyshgorod' });
    expect(removeChapter(c, c.module!.chapters[0].id).module!.chapters).toEqual([]);
    expect(() => updateChapter(c, 'nope', { title: 'x' })).toThrow();
    expect(() => removeChapter(c, 'nope')).toThrow();
  });

  it('moves Chapters and stops at the edges', () => {
    let c = addChapter(addChapter(addChapter(withModule())));
    const [a, b, third] = c.module!.chapters.map((ch) => ch.id);
    c = moveChapter(c, third, -1);
    expect(c.module!.chapters.map((ch) => ch.id)).toEqual([a, third, b]);
    expect(moveChapter(c, a, -1).module!.chapters[0].id).toBe(a);
    expect(() => moveChapter(c, 'nope', 1)).toThrow();
  });

  it('a new Chapter carries an empty Reward', () => {
    const c = addChapter(withModule());
    expect(c.module!.chapters[0].reward).toEqual({
      milestones: 0, gear: [], ceIds: [], mapIds: [], marks: [],
    });
  });
});

describe('cover mutations', () => {
  it('merge field patches, keep earlier fields, and require a Module', () => {
    let c = ensureModule(createCampaign('a', 0));
    c = updateCover(c, { title: 'The Femur' });
    c = updateCover(c, { banner: 'Level 0 · one night' });
    expect(c.module!.cover).toEqual({ title: 'The Femur', banner: 'Level 0 · one night' });
    c = updateInsideCover(c, { playtestedBy: 'the Tuesday table' });
    c = updateInsideCover(c, { editing: 'G. Plent' });
    expect(c.module!.insideCover).toEqual({ playtestedBy: 'the Tuesday table', editing: 'G. Plent' });
    expect(() => updateCover(createCampaign('a', 0), { title: 'x' })).toThrow();
    expect(() => updateInsideCover(createCampaign('a', 0), { editing: 'x' })).toThrow();
  });
});

describe('CEs, maps, and encounters', () => {
  const twoChapters = () => addChapter(addChapter(ensureModule(createCampaign('a', 0))));

  it('CEs land in the front matter or a Chapter, with unique minted codes', () => {
    let c = twoChapters();
    const [ch1, ch2] = c.module!.chapters.map((x) => x.id);
    c = addCE(c, 'front');
    c = addCE(c, { chapterId: ch1 });
    c = addCE(c, { chapterId: ch2 });
    expect(c.module!.frontCes).toHaveLength(1);
    expect(c.module!.frontCes[0].reveal).toBe('on-attach');
    expect(c.module!.chapters[0].ces[0].reveal).toBe('held');
    const codes = [c.module!.frontCes[0].code, c.module!.chapters[0].ces[0].code, c.module!.chapters[1].ces[0].code];
    expect(new Set(codes).size).toBe(3);
    for (const code of codes) expect(code).toMatch(/^[A-Z]-\d\d$/);
  });

  it('CE updates and removals find the entry wherever it sits', () => {
    let c = twoChapters();
    c = addCE(c, 'front');
    c = addCE(c, { chapterId: c.module!.chapters[1].id });
    const frontId = c.module!.frontCes[0].id;
    const deepId = c.module!.chapters[1].ces[0].id;
    c = updateCE(c, frontId, { title: 'The Commission' });
    c = updateCE(c, deepId, { title: 'The Crypt Ledger', reveal: 'on-attach' });
    expect(c.module!.frontCes[0].title).toBe('The Commission');
    expect(c.module!.chapters[1].ces[0]).toMatchObject({ title: 'The Crypt Ledger', reveal: 'on-attach' });
    c = removeCE(c, deepId);
    expect(c.module!.chapters[1].ces).toEqual([]);
    expect(() => updateCE(c, deepId, { title: 'x' })).toThrow();
    expect(() => removeCE(c, deepId)).toThrow();
  });

  it('maps default their reveal by place and update anywhere', () => {
    let c = twoChapters();
    c = addMap(c, 'front');
    c = addMap(c, { chapterId: c.module!.chapters[0].id });
    expect(c.module!.frontMaps[0].reveal).toBe('on-enrollment');
    expect(c.module!.chapters[0].maps[0].reveal).toBe('dm-activated');
    const id = c.module!.chapters[0].maps[0].id;
    c = updateMap(c, id, { title: 'Vyshgorod', reveal: 'dm-only' });
    expect(c.module!.chapters[0].maps[0]).toMatchObject({ title: 'Vyshgorod', reveal: 'dm-only' });
    c = removeMap(c, id);
    expect(c.module!.chapters[0].maps).toEqual([]);
    expect(() => removeMap(c, id)).toThrow();
  });

  it('encounters live in Chapters only', () => {
    let c = twoChapters();
    const ch = c.module!.chapters[0].id;
    c = addEncounter(c, ch);
    const id = c.module!.chapters[0].encounters[0].id;
    c = updateEncounter(c, id, { title: 'The riverside ambush', text: 'DC cues' });
    expect(c.module!.chapters[0].encounters[0].title).toBe('The riverside ambush');
    c = removeEncounter(c, id);
    expect(c.module!.chapters[0].encounters).toEqual([]);
    expect(() => addEncounter(c, 'nope')).toThrow();
    expect(() => updateEncounter(c, id, { title: 'x' })).toThrow();
  });
});

describe('updateReward', () => {
  const ready = () => {
    let c = addChapter(addChapter(ensureModule(createCampaign('a', 0))));
    c = addCE(c, { chapterId: c.module!.chapters[0].id });
    c = addMap(c, { chapterId: c.module!.chapters[1].id });
    return c;
  };

  it('patches the bundle piecewise and validates what it names', () => {
    let c = ready();
    const ch = c.module!.chapters[0].id;
    const ceId = c.module!.chapters[0].ces[0].id;
    const mapId = c.module!.chapters[1].maps[0].id;
    c = updateReward(c, ch, { milestones: 2, gear: ['the carved femur'] });
    c = updateReward(c, ch, { ceIds: [ceId], mapIds: [mapId] });
    c = updateReward(c, ch, { marks: [{ name: 'Friend of the College', rule: '10% at the College market' }] });
    expect(c.module!.chapters[0].reward).toEqual({
      milestones: 2,
      gear: ['the carved femur'],
      ceIds: [ceId],
      mapIds: [mapId],
      marks: [{ name: 'Friend of the College', rule: '10% at the College market' }],
    });
  });

  it('rejects bad milestones, unknown ids, and a missing Chapter', () => {
    const c = ready();
    const ch = c.module!.chapters[0].id;
    expect(() => updateReward(c, ch, { milestones: -1 })).toThrow();
    expect(() => updateReward(c, ch, { milestones: 1.5 })).toThrow();
    expect(() => updateReward(c, ch, { ceIds: ['nope'] })).toThrow();
    expect(() => updateReward(c, ch, { mapIds: ['nope'] })).toThrow();
    expect(() => updateReward(c, 'nope', { milestones: 1 })).toThrow();
  });
});

describe('Books and the Appendix', () => {
  const ready = () => addChapter(addChapter(ensureModule(createCampaign('a', 0))));

  it('Books hold Chapters by assignment, and removal frees them', () => {
    let c = addBook(ready());
    const bookId = c.module!.books[0].id;
    const [ch1, ch2] = c.module!.chapters.map((x) => x.id);
    c = updateBook(c, bookId, { title: 'Book One' });
    c = setChapterBook(c, ch1, bookId);
    c = setChapterBook(c, ch2, bookId);
    expect(c.module!.chapters.every((x) => x.bookId === bookId)).toBe(true);
    c = setChapterBook(c, ch2, undefined);
    expect(c.module!.chapters[1].bookId).toBeUndefined();
    c = removeBook(c, bookId);
    expect(c.module!.books).toEqual([]);
    expect(c.module!.chapters[0].bookId).toBeUndefined();
    expect(() => setChapterBook(ready(), 'nope', undefined)).toThrow();
    expect(() => setChapterBook(c, ch1, 'nope')).toThrow();
    expect(() => removeBook(c, 'nope')).toThrow();
  });

  it('a Book carries its own covers and a validated Reward', () => {
    let c = addBook(ready());
    const bookId = c.module!.books[0].id;
    c = updateBookCover(c, bookId, { title: 'Book One' });
    c = updateBookInsideCover(c, bookId, { playtestedBy: 'the Tuesday table' });
    c = updateBookReward(c, bookId, { milestones: 3 });
    expect(c.module!.books[0].cover).toEqual({ title: 'Book One' });
    expect(c.module!.books[0].insideCover).toEqual({ playtestedBy: 'the Tuesday table' });
    expect(c.module!.books[0].reward.milestones).toBe(3);
    expect(() => updateBookReward(c, bookId, { milestones: -1 })).toThrow();
    expect(() => updateBookReward(c, bookId, { ceIds: ['nope'] })).toThrow();
  });

  it('Appendix sections add, update, and remove', () => {
    let c = addAppendixSection(ready());
    const id = c.module!.appendix[0].id;
    c = updateAppendixSection(c, id, { title: 'Pregenerated characters', text: 'the four' });
    expect(c.module!.appendix[0]).toMatchObject({ title: 'Pregenerated characters', text: 'the four' });
    c = removeAppendixSection(c, id);
    expect(c.module!.appendix).toEqual([]);
    expect(() => updateAppendixSection(c, id, { title: 'x' })).toThrow();
    expect(() => removeAppendixSection(c, id)).toThrow();
  });
});

describe('module file', () => {
  it('round-trips through export and parse, and attaches', () => {
    let c = addChapter(ensureModule(createCampaign('The Femur', 0)));
    const parsed = parseModuleFile(exportModuleFile(c.module!));
    expect(parsed).toEqual(c.module);
    const other = attachModule(createCampaign('Another table', 2), parsed);
    expect(other.module).toEqual(parsed);
  });

  it('rejects a campaign file and garbage', () => {
    const campaignFile = exportCampaignFile(createCampaign('a', 0));
    expect(() => parseModuleFile(campaignFile)).toThrow();
    expect(() => parseModuleFile('nonsense')).toThrow();
  });
});

describe('renameCampaign', () => {
  it('trims, rejects blank, and leaves the original untouched', () => {
    const before = createCampaign('A mist over St. Carpathi', 0);
    const after = renameCampaign(before, '  The Shinbones of St. Carpathi ');
    expect(after.name).toBe('The Shinbones of St. Carpathi');
    expect(before.name).toBe('A mist over St. Carpathi');
    expect(() => renameCampaign(before, '   ')).toThrow();
  });
});
