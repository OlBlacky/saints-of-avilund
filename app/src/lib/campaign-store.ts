// Campaign storage (builder spec §13): a Campaign is the DM's record,
// kept in its own object store beside the character roster. Characters
// never depend on it — grants copy into character logs as gm-sourced
// events; the Campaign keeps its own ledger. The table is the wire in
// v1, so the roster is a list of names, not links to records.

import { CAMPAIGN_STORE, tx } from './store';

/** The level cap (play begins at Level 0, cap Level 11). */
const LEVEL_CAP = 11;

/** One seat at the table. The characters live on the players' devices,
 * so a roster row is the DM's list of who is playing, not a link. */
export interface RosterEntry {
  id: string;
  /** The person. */
  player: string;
  /** Their character's name. */
  character: string;
}

/** One entry in the Session log — the meta-Chronicle (spec §5). The
 * Session number is its 1-based position in the list, derived at render,
 * so the log never carries a stale numbering. */
export interface SessionEntry {
  id: string;
  /** ISO date the Session was played. */
  date: string;
  /** The DM's notes. */
  notes: string;
}

/** One issue in the grant ledger: what the DM handed out, to whom, when.
 * The players record it on their own sheets; this is the DM's side. */
export interface GrantEntry {
  id: string;
  /** ISO timestamp when the grant was recorded. */
  at: string;
  /** Roster-entry ids of the recipients. */
  to: string[];
  /** What was issued — codes, gear, Milestones, Marks — as text in v1. */
  what: string;
  /** The Session it belongs to, once one is logged. */
  sessionId?: string;
}

/** The DM-togglable rule modules (spec §12); more members expected. */
export interface CampaignOptions {
  partyInventory: boolean;
}

// ── The Adventure Module (spec §13) ─────────────────────────────────────
// One file shape whether we shipped it, the DM authored it here in the
// Campaign Builder, or it was bought. Authored modules live embedded in
// the campaign record.

/** A Chronicle Entry authored in the Module (spec §4). */
export interface ModuleCE {
  id: string;
  title: string;
  /** The entry code the table speaks aloud ("K-17"). */
  code: string;
  text: string;
  /** When players get it: on attach/enrollment, or held for a Reward. */
  reveal: 'on-attach' | 'held';
}

/** A Map Book entry; the image travels as a data URL, like the portrait. */
export interface ModuleMap {
  id: string;
  title: string;
  image?: string;
  reveal: 'on-enrollment' | 'dm-activated' | 'dm-only';
}

/** A prepared set piece. Text until the bestiary lands. */
export interface ModuleEncounter {
  id: string;
  title: string;
  text: string;
}

/** A Mark: name + rule text (spec §13; display-only on the sheet, Market
 * access and standing discounts the enforced exceptions — later). */
export interface Mark {
  name: string;
  rule: string;
}

/** The Reward bundle at a Chapter's or Book's end — any part empty. */
export interface Reward {
  milestones: number;
  /** Gear and treasure, as text lines in v1. */
  gear: string[];
  /** Held-back CEs and maps this Reward pays out, by id. */
  ceIds: string[];
  mapIds: string[];
  marks: Mark[];
}

export function newReward(): Reward {
  return { milestones: 0, gear: [], ceIds: [], mapIds: [], marks: [] };
}

/** The constituent unit of a campaign. A one-off is one Chapter. */
export interface Chapter {
  id: string;
  title: string;
  /** One line; the Campaign Summary outline assembles from these. */
  summary: string;
  dmText: string;
  ces: ModuleCE[];
  maps: ModuleMap[];
  encounters: ModuleEncounter[];
  reward: Reward;
  /** Optional grouping (spec §13); absent = no Book. */
  bookId?: string;
}

/** An optional grouping of Chapters; Books may be sold separately. */
export interface Book {
  id: string;
  title: string;
  cover?: Cover;
  insideCover?: InsideCover;
  reward: Reward;
}

/** The physical book's face — every field optional (spec §13). */
export interface Cover {
  title?: string;
  subtitle?: string;
  /** Cover artwork as a data URL. */
  artwork?: string;
  artist?: string;
  medium?: string;
  /** Entry level · party size · play length. */
  banner?: string;
  seriesLine?: string;
  imprint?: string;
}

/** The title page and credits — every field optional (spec §13). */
export interface InsideCover {
  authors?: string;
  additionalDesign?: string;
  editing?: string;
  coverArtist?: string;
  interiorArtists?: string;
  cartography?: string;
  playtestedBy?: string;
  specialThanks?: string;
  dedication?: string;
  versionPrinting?: string;
  publicationDate?: string;
  publisher?: string;
  legalLine?: string;
  contentNotes?: string;
}

export interface AdventureModule {
  id: string;
  title: string;
  author: string;
  version: string;
  cover?: Cover;
  insideCover?: InsideCover;
  /** The Campaign Summary's overview prose; its outline assembles from
   * the Chapters' summary lines and is never stored. */
  overview: string;
  /** Front matter: the DM introduction, and the CEs and maps revealed on
   * enrollment. */
  dmIntro: string;
  frontCes: ModuleCE[];
  frontMaps: ModuleMap[];
  chapters: Chapter[];
  books: Book[];
  appendix: { id: string; title: string; text: string }[];
}

export interface CampaignRecord {
  id: string;
  schemaVersion: 1;
  name: string;
  /** The Level characters join at: 0 to the cap. */
  entryLevel: number;
  /** The Adventure Module — authored here, shipped, or bought. */
  module?: AdventureModule;
  roster: RosterEntry[];
  sessions: SessionEntry[];
  ledger: GrantEntry[];
  options: CampaignOptions;
  createdAt: string;
  updatedAt: string;
}

/** Build a fresh Campaign. Throws on a blank name or an entry level
 * outside 0..11 — the callers validate first; this is the backstop. */
export function createCampaign(name: string, entryLevel: number): CampaignRecord {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('a Campaign needs a name');
  if (!Number.isInteger(entryLevel) || entryLevel < 0 || entryLevel > LEVEL_CAP) {
    throw new Error(`entry level must be a whole number from 0 to ${LEVEL_CAP}`);
  }
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    name: trimmed,
    entryLevel,
    roster: [],
    sessions: [],
    ledger: [],
    options: { partyInventory: false },
    createdAt: now,
    updatedAt: now,
  };
}

/** Rename the campaign. The Module's title is its own field — a table
 * and its book may be named differently. */
export function renameCampaign(c: CampaignRecord, name: string): CampaignRecord {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('a Campaign needs a name');
  return { ...c, name: trimmed };
}

/** Roster mutations are pure — a new record out, the original untouched —
 * so the UI writes through putCampaign and the logic tests without a DB. */
export function addRosterEntry(c: CampaignRecord, player: string, character: string): CampaignRecord {
  const trimmed = player.trim();
  if (!trimmed) throw new Error('a roster entry needs a player');
  const entry: RosterEntry = { id: crypto.randomUUID(), player: trimmed, character: character.trim() };
  return { ...c, roster: [...c.roster, entry] };
}

export function updateRosterEntry(
  c: CampaignRecord,
  id: string,
  patch: Partial<Pick<RosterEntry, 'player' | 'character'>>,
): CampaignRecord {
  if (!c.roster.some((r) => r.id === id)) throw new Error('no such roster entry');
  return { ...c, roster: c.roster.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
}

export function removeRosterEntry(c: CampaignRecord, id: string): CampaignRecord {
  if (!c.roster.some((r) => r.id === id)) throw new Error('no such roster entry');
  return { ...c, roster: c.roster.filter((r) => r.id !== id) };
}

/** Session-log mutations — pure, like the roster's. */
export function addSession(c: CampaignRecord, date: string): CampaignRecord {
  if (!date.trim()) throw new Error('a Session needs a date');
  const entry: SessionEntry = { id: crypto.randomUUID(), date: date.trim(), notes: '' };
  return { ...c, sessions: [...c.sessions, entry] };
}

export function updateSession(
  c: CampaignRecord,
  id: string,
  patch: Partial<Pick<SessionEntry, 'date' | 'notes'>>,
): CampaignRecord {
  if (!c.sessions.some((s) => s.id === id)) throw new Error('no such Session');
  return { ...c, sessions: c.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
}

export function removeSession(c: CampaignRecord, id: string): CampaignRecord {
  if (!c.sessions.some((s) => s.id === id)) throw new Error('no such Session');
  return { ...c, sessions: c.sessions.filter((s) => s.id !== id) };
}

/** Module mutations — pure, like the roster's. ensureModule starts the
 * authored Module; the rest require one and throw without it. */
export function ensureModule(c: CampaignRecord): CampaignRecord {
  if (c.module) return c;
  return {
    ...c,
    module: {
      id: crypto.randomUUID(),
      title: c.name,
      author: '',
      version: 'draft',
      overview: '',
      dmIntro: '',
      frontCes: [],
      frontMaps: [],
      chapters: [],
      books: [],
      appendix: [],
    },
  };
}

function withModule(c: CampaignRecord): AdventureModule {
  if (!c.module) throw new Error('no Module to edit');
  return c.module;
}

export function updateModule(
  c: CampaignRecord,
  patch: Partial<Pick<AdventureModule, 'title' | 'author' | 'version' | 'overview' | 'dmIntro'>>,
): CampaignRecord {
  return { ...c, module: { ...withModule(c), ...patch } };
}

export function updateCover(c: CampaignRecord, patch: Partial<Cover>): CampaignRecord {
  const m = withModule(c);
  return { ...c, module: { ...m, cover: { ...m.cover, ...patch } } };
}

export function updateInsideCover(c: CampaignRecord, patch: Partial<InsideCover>): CampaignRecord {
  const m = withModule(c);
  return { ...c, module: { ...m, insideCover: { ...m.insideCover, ...patch } } };
}

export function addChapter(c: CampaignRecord): CampaignRecord {
  const m = withModule(c);
  const chapter: Chapter = {
    id: crypto.randomUUID(),
    title: '',
    summary: '',
    dmText: '',
    ces: [],
    maps: [],
    encounters: [],
    reward: newReward(),
  };
  return { ...c, module: { ...m, chapters: [...m.chapters, chapter] } };
}

export function updateChapter(
  c: CampaignRecord,
  id: string,
  patch: Partial<Pick<Chapter, 'title' | 'summary' | 'dmText'>>,
): CampaignRecord {
  const m = withModule(c);
  if (!m.chapters.some((ch) => ch.id === id)) throw new Error('no such Chapter');
  return {
    ...c,
    module: { ...m, chapters: m.chapters.map((ch) => (ch.id === id ? { ...ch, ...patch } : ch)) },
  };
}

export function removeChapter(c: CampaignRecord, id: string): CampaignRecord {
  const m = withModule(c);
  if (!m.chapters.some((ch) => ch.id === id)) throw new Error('no such Chapter');
  return { ...c, module: { ...m, chapters: m.chapters.filter((ch) => ch.id !== id) } };
}

/** Move a Chapter one place up (-1) or down (+1); at the edge, no move. */
export function moveChapter(c: CampaignRecord, id: string, dir: -1 | 1): CampaignRecord {
  const m = withModule(c);
  const from = m.chapters.findIndex((ch) => ch.id === id);
  if (from === -1) throw new Error('no such Chapter');
  const to = from + dir;
  if (to < 0 || to >= m.chapters.length) return c;
  const chapters = [...m.chapters];
  const [moved] = chapters.splice(from, 1);
  chapters.splice(to, 0, moved);
  return { ...c, module: { ...m, chapters } };
}

// ── CEs, maps, and encounters ───────────────────────────────────────────
// CEs and maps live in the front matter or in a Chapter; encounters live
// in Chapters only. Updates and removals find the entry wherever it sits.

/** Where a CE or map lives: the front matter, or a named Chapter. */
export type ModulePlace = 'front' | { chapterId: string };

/** Mint a short entry code ("K-17"), unique within the Module. */
function mintCode(m: AdventureModule): string {
  const used = new Set(
    [...m.frontCes, ...m.chapters.flatMap((ch) => ch.ces)].map((ce) => ce.code),
  );
  for (;;) {
    const code = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${10 + Math.floor(Math.random() * 90)}`;
    if (!used.has(code)) return code;
  }
}

function patchChapter(c: CampaignRecord, chapterId: string, patch: (ch: Chapter) => Chapter): CampaignRecord {
  const m = withModule(c);
  if (!m.chapters.some((ch) => ch.id === chapterId)) throw new Error('no such Chapter');
  return {
    ...c,
    module: { ...m, chapters: m.chapters.map((ch) => (ch.id === chapterId ? patch(ch) : ch)) },
  };
}

export function addCE(c: CampaignRecord, place: ModulePlace): CampaignRecord {
  const m = withModule(c);
  const ce: ModuleCE = {
    id: crypto.randomUUID(),
    title: '',
    code: mintCode(m),
    text: '',
    reveal: place === 'front' ? 'on-attach' : 'held',
  };
  if (place === 'front') return { ...c, module: { ...m, frontCes: [...m.frontCes, ce] } };
  return patchChapter(c, place.chapterId, (ch) => ({ ...ch, ces: [...ch.ces, ce] }));
}

export function updateCE(
  c: CampaignRecord,
  id: string,
  patch: Partial<Pick<ModuleCE, 'title' | 'code' | 'text' | 'reveal'>>,
): CampaignRecord {
  const m = withModule(c);
  if (m.frontCes.some((ce) => ce.id === id)) {
    return {
      ...c,
      module: { ...m, frontCes: m.frontCes.map((ce) => (ce.id === id ? { ...ce, ...patch } : ce)) },
    };
  }
  const ch = m.chapters.find((x) => x.ces.some((ce) => ce.id === id));
  if (!ch) throw new Error('no such CE');
  return patchChapter(c, ch.id, (x) => ({
    ...x,
    ces: x.ces.map((ce) => (ce.id === id ? { ...ce, ...patch } : ce)),
  }));
}

export function removeCE(c: CampaignRecord, id: string): CampaignRecord {
  const m = withModule(c);
  if (m.frontCes.some((ce) => ce.id === id)) {
    return { ...c, module: { ...m, frontCes: m.frontCes.filter((ce) => ce.id !== id) } };
  }
  const ch = m.chapters.find((x) => x.ces.some((ce) => ce.id === id));
  if (!ch) throw new Error('no such CE');
  return patchChapter(c, ch.id, (x) => ({ ...x, ces: x.ces.filter((ce) => ce.id !== id) }));
}

export function addMap(c: CampaignRecord, place: ModulePlace): CampaignRecord {
  const m = withModule(c);
  const map: ModuleMap = {
    id: crypto.randomUUID(),
    title: '',
    reveal: place === 'front' ? 'on-enrollment' : 'dm-activated',
  };
  if (place === 'front') return { ...c, module: { ...m, frontMaps: [...m.frontMaps, map] } };
  return patchChapter(c, place.chapterId, (ch) => ({ ...ch, maps: [...ch.maps, map] }));
}

export function updateMap(
  c: CampaignRecord,
  id: string,
  patch: Partial<Pick<ModuleMap, 'title' | 'image' | 'reveal'>>,
): CampaignRecord {
  const m = withModule(c);
  if (m.frontMaps.some((x) => x.id === id)) {
    return {
      ...c,
      module: { ...m, frontMaps: m.frontMaps.map((x) => (x.id === id ? { ...x, ...patch } : x)) },
    };
  }
  const ch = m.chapters.find((x) => x.maps.some((map) => map.id === id));
  if (!ch) throw new Error('no such map');
  return patchChapter(c, ch.id, (x) => ({
    ...x,
    maps: x.maps.map((map) => (map.id === id ? { ...map, ...patch } : map)),
  }));
}

export function removeMap(c: CampaignRecord, id: string): CampaignRecord {
  const m = withModule(c);
  if (m.frontMaps.some((x) => x.id === id)) {
    return { ...c, module: { ...m, frontMaps: m.frontMaps.filter((x) => x.id !== id) } };
  }
  const ch = m.chapters.find((x) => x.maps.some((map) => map.id === id));
  if (!ch) throw new Error('no such map');
  return patchChapter(c, ch.id, (x) => ({ ...x, maps: x.maps.filter((map) => map.id !== id) }));
}

export function addEncounter(c: CampaignRecord, chapterId: string): CampaignRecord {
  const enc: ModuleEncounter = { id: crypto.randomUUID(), title: '', text: '' };
  return patchChapter(c, chapterId, (ch) => ({ ...ch, encounters: [...ch.encounters, enc] }));
}

export function updateEncounter(
  c: CampaignRecord,
  id: string,
  patch: Partial<Pick<ModuleEncounter, 'title' | 'text'>>,
): CampaignRecord {
  const m = withModule(c);
  const ch = m.chapters.find((x) => x.encounters.some((enc) => enc.id === id));
  if (!ch) throw new Error('no such encounter');
  return patchChapter(c, ch.id, (x) => ({
    ...x,
    encounters: x.encounters.map((enc) => (enc.id === id ? { ...enc, ...patch } : enc)),
  }));
}

export function removeEncounter(c: CampaignRecord, id: string): CampaignRecord {
  const m = withModule(c);
  const ch = m.chapters.find((x) => x.encounters.some((enc) => enc.id === id));
  if (!ch) throw new Error('no such encounter');
  return patchChapter(c, ch.id, (x) => ({
    ...x,
    encounters: x.encounters.filter((enc) => enc.id !== id),
  }));
}

/** Milestones are whole and never negative; paid-out CEs and maps must
 * exist in the Module. Shared by Chapter and Book Rewards. */
function validateRewardPatch(m: AdventureModule, patch: Partial<Reward>): void {
  if (patch.milestones !== undefined && (!Number.isInteger(patch.milestones) || patch.milestones < 0)) {
    throw new Error('Milestones are a whole number');
  }
  const ceIds = new Set([...m.frontCes, ...m.chapters.flatMap((ch) => ch.ces)].map((ce) => ce.id));
  for (const id of patch.ceIds ?? []) {
    if (!ceIds.has(id)) throw new Error('no such CE');
  }
  const mapIds = new Set([...m.frontMaps, ...m.chapters.flatMap((ch) => ch.maps)].map((x) => x.id));
  for (const id of patch.mapIds ?? []) {
    if (!mapIds.has(id)) throw new Error('no such map');
  }
}

/** Patch a Chapter's Reward. */
export function updateReward(
  c: CampaignRecord,
  chapterId: string,
  patch: Partial<Reward>,
): CampaignRecord {
  validateRewardPatch(withModule(c), patch);
  return patchChapter(c, chapterId, (ch) => ({ ...ch, reward: { ...ch.reward, ...patch } }));
}

// ── Books & the Appendix ────────────────────────────────────────────────

export function addBook(c: CampaignRecord): CampaignRecord {
  const m = withModule(c);
  const book: Book = { id: crypto.randomUUID(), title: '', reward: newReward() };
  return { ...c, module: { ...m, books: [...m.books, book] } };
}

function patchBook(c: CampaignRecord, bookId: string, patch: (b: Book) => Book): CampaignRecord {
  const m = withModule(c);
  if (!m.books.some((b) => b.id === bookId)) throw new Error('no such Book');
  return {
    ...c,
    module: { ...m, books: m.books.map((b) => (b.id === bookId ? patch(b) : b)) },
  };
}

export function updateBook(c: CampaignRecord, id: string, patch: Partial<Pick<Book, 'title'>>): CampaignRecord {
  return patchBook(c, id, (b) => ({ ...b, ...patch }));
}

export function updateBookCover(c: CampaignRecord, id: string, patch: Partial<Cover>): CampaignRecord {
  return patchBook(c, id, (b) => ({ ...b, cover: { ...b.cover, ...patch } }));
}

export function updateBookInsideCover(c: CampaignRecord, id: string, patch: Partial<InsideCover>): CampaignRecord {
  return patchBook(c, id, (b) => ({ ...b, insideCover: { ...b.insideCover, ...patch } }));
}

/** Patch a Book's Reward — the bigger one at the Book's end. Same
 * validation as the Chapter's. */
export function updateBookReward(c: CampaignRecord, id: string, patch: Partial<Reward>): CampaignRecord {
  validateRewardPatch(withModule(c), patch);
  return patchBook(c, id, (b) => ({ ...b, reward: { ...b.reward, ...patch } }));
}

/** Removing a Book frees its Chapters; they stay in the spine. */
export function removeBook(c: CampaignRecord, id: string): CampaignRecord {
  const m = withModule(c);
  if (!m.books.some((b) => b.id === id)) throw new Error('no such Book');
  return {
    ...c,
    module: {
      ...m,
      books: m.books.filter((b) => b.id !== id),
      chapters: m.chapters.map((ch) =>
        ch.bookId === id ? { ...ch, bookId: undefined } : ch,
      ),
    },
  };
}

/** Put a Chapter in a Book, or take it out (bookId undefined). */
export function setChapterBook(c: CampaignRecord, chapterId: string, bookId?: string): CampaignRecord {
  const m = withModule(c);
  if (bookId && !m.books.some((b) => b.id === bookId)) throw new Error('no such Book');
  return patchChapter(c, chapterId, (ch) => ({ ...ch, bookId }));
}

export function addAppendixSection(c: CampaignRecord): CampaignRecord {
  const m = withModule(c);
  const section = { id: crypto.randomUUID(), title: '', text: '' };
  return { ...c, module: { ...m, appendix: [...m.appendix, section] } };
}

export function updateAppendixSection(
  c: CampaignRecord,
  id: string,
  patch: Partial<{ title: string; text: string }>,
): CampaignRecord {
  const m = withModule(c);
  if (!m.appendix.some((s) => s.id === id)) throw new Error('no such Appendix section');
  return {
    ...c,
    module: { ...m, appendix: m.appendix.map((s) => (s.id === id ? { ...s, ...patch } : s)) },
  };
}

export function removeAppendixSection(c: CampaignRecord, id: string): CampaignRecord {
  const m = withModule(c);
  if (!m.appendix.some((s) => s.id === id)) throw new Error('no such Appendix section');
  return { ...c, module: { ...m, appendix: m.appendix.filter((s) => s.id !== id) } };
}

/** Grant-ledger mutations — pure, like the roster's. The ledger is the
 * DM's record of what was issued; a wrong entry is removed and re-issued,
 * not edited. */
export function addGrant(
  c: CampaignRecord,
  what: string,
  to: string[],
  sessionId?: string,
): CampaignRecord {
  const trimmed = what.trim();
  if (!trimmed) throw new Error('a grant needs contents');
  if (to.length === 0) throw new Error('a grant needs at least one recipient');
  for (const id of to) {
    if (!c.roster.some((r) => r.id === id)) throw new Error('no such roster entry');
  }
  if (sessionId && !c.sessions.some((s) => s.id === sessionId)) {
    throw new Error('no such Session');
  }
  const entry: GrantEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    to: [...to],
    what: trimmed,
    ...(sessionId ? { sessionId } : {}),
  };
  return { ...c, ledger: [...c.ledger, entry] };
}

export function removeGrant(c: CampaignRecord, id: string): CampaignRecord {
  if (!c.ledger.some((g) => g.id === id)) throw new Error('no such grant');
  return { ...c, ledger: c.ledger.filter((g) => g.id !== id) };
}

export function listCampaigns(): Promise<CampaignRecord[]> {
  return tx(CAMPAIGN_STORE, 'readonly', (s) => s.getAll() as IDBRequest<CampaignRecord[]>);
}

export function getCampaign(id: string): Promise<CampaignRecord | undefined> {
  return tx(CAMPAIGN_STORE, 'readonly', (s) => s.get(id) as IDBRequest<CampaignRecord | undefined>);
}

export function putCampaign(record: CampaignRecord): Promise<unknown> {
  return tx(CAMPAIGN_STORE, 'readwrite', (s) =>
    s.put({ ...record, updatedAt: new Date().toISOString() }),
  );
}

export function deleteCampaign(id: string): Promise<unknown> {
  return tx(CAMPAIGN_STORE, 'readwrite', (s) => s.delete(id));
}

/** Serialize the Module alone — the .avilund-module.json file, the one
 * format whether we shipped it, the DM authored it, or it was bought. */
export function exportModuleFile(m: AdventureModule): string {
  return JSON.stringify(m, null, 2);
}

/** Parse a module file, throwing on anything that isn't one. */
export function parseModuleFile(text: string): AdventureModule {
  const parsed = JSON.parse(text) as AdventureModule;
  if (
    typeof parsed.id !== 'string' ||
    typeof parsed.title !== 'string' ||
    !Array.isArray(parsed.chapters) ||
    !Array.isArray(parsed.books) ||
    !Array.isArray(parsed.appendix) ||
    !Array.isArray(parsed.frontCes) ||
    !Array.isArray(parsed.frontMaps)
  ) {
    throw new Error('not a module file');
  }
  return parsed;
}

/** Attach a Module to the campaign — how a shipped or bought module
 * arrives. Replaces whatever was attached; callers confirm first. */
export function attachModule(c: CampaignRecord, m: AdventureModule): CampaignRecord {
  return { ...c, module: m };
}

/** Serialize for the .avilund-campaign.json file — the campaign's travel
 * format, mirroring the character's (§10). */
export function exportCampaignFile(record: CampaignRecord): string {
  return JSON.stringify(record, null, 2);
}

/** Parse a campaign file, throwing on anything that isn't one — including
 * a character file. Pure, so the check is testable without a database. */
export function parseCampaignFile(text: string): CampaignRecord {
  const parsed = JSON.parse(text) as CampaignRecord;
  if (
    parsed.schemaVersion !== 1 ||
    typeof parsed.name !== 'string' ||
    !Array.isArray(parsed.roster) ||
    !Array.isArray(parsed.sessions) ||
    !Array.isArray(parsed.ledger)
  ) {
    throw new Error('not a campaign file');
  }
  return parsed;
}

/** Import a campaign file; a colliding id gets a fresh one (a copy, not a
 * clobber), matching the character import. */
export async function importCampaignFile(text: string): Promise<CampaignRecord> {
  const parsed = parseCampaignFile(text);
  const existing = parsed.id ? await getCampaign(parsed.id) : undefined;
  const record: CampaignRecord = existing || !parsed.id ? { ...parsed, id: crypto.randomUUID() } : parsed;
  await putCampaign(record);
  return record;
}
