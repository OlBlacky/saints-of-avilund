// Character storage (builder spec §10 & §12): the browser is the account.
// Characters live in IndexedDB — many of them, each autosaved as it
// changes — and travel as .avilund.json files (export/import, and one day
// the wire format). The old single localStorage draft migrates in as the
// first roster entry.
//
// The record models identity + versions from day one (§3); v1 presents
// exactly one version per Character. No external dependencies — a small
// promisified IndexedDB wrapper is all this needs.

import type { RecordEvent } from './record/events';

/** The character's table state. New has never seen a Play Session (and
 * cannot sell); In Play sits at the table; Downtime is between Sessions,
 * where Markets open. */
export type PlayState = 'new' | 'in-play' | 'downtime';

const DB_NAME = 'sova';
const DB_VERSION = 2;
const STORE = 'characters';
/** The Campaign object store (spec §13) — beside the roster, never inside
 * a character. Its record shape and CRUD live in campaign-store.ts. */
export const CAMPAIGN_STORE = 'campaigns';
export const LEGACY_DRAFT_KEY = 'sova-builder-draft-v1';

type StoreName = typeof STORE | typeof CAMPAIGN_STORE;

/** The version payload — exactly the builder's working draft. */
export interface VersionPayload {
  identity: {
    name: string;
    /** Legacy: the Place of Origin is a recorded creation choice now
     * (record/events.ts 'origin-chosen'). Retained for characters saved
     * before the move, which have it here and nowhere else. */
    origin: string;
    age: string;
    heightFt: string;
    heightIn: string;
    weight: string;
    notes: string;
    /** The character portrait as a small data URL — resized on upload so
     * the record stays light, and it travels in the .avilund.json file. */
    portrait?: string;
  };
  events: RecordEvent[];
  rerollsLeft: number;
  quirkText?: unknown;
  gearText?: unknown;
  basket?: unknown[];
  status?: PlayState;
  /** The player's box arrangement per sheet page. */
  boxOrder?: Record<string, string[]>;
}

export interface CharacterRecord {
  id: string;
  schemaVersion: 1;
  /** Modeled as a list from day one; v1 keeps exactly one. */
  versions: { id: string; draft: VersionPayload }[];
  createdAt: string;
  updatedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      for (const name of [STORE, CAMPAIGN_STORE]) {
        if (!req.result.objectStoreNames.contains(name)) {
          req.result.createObjectStore(name, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function tx<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = run(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

export function listCharacters(): Promise<CharacterRecord[]> {
  return tx(STORE, 'readonly', (s) => s.getAll() as IDBRequest<CharacterRecord[]>);
}

export function getCharacter(id: string): Promise<CharacterRecord | undefined> {
  return tx(STORE, 'readonly', (s) => s.get(id) as IDBRequest<CharacterRecord | undefined>);
}

export function putCharacter(record: CharacterRecord): Promise<unknown> {
  return tx(STORE, 'readwrite', (s) => s.put({ ...record, updatedAt: new Date().toISOString() }));
}

export function deleteCharacter(id: string): Promise<unknown> {
  return tx(STORE, 'readwrite', (s) => s.delete(id));
}

export function newCharacter(draft: VersionPayload): CharacterRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 1,
    versions: [{ id: 'v1', draft }],
    createdAt: now,
    updatedAt: now,
  };
}

/** The one localStorage draft of the pre-roster era becomes the first
 * roster entry, once. Returns true if a migration happened. */
export async function migrateLegacyDraft(): Promise<boolean> {
  try {
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw) as VersionPayload;
    if (!Array.isArray(draft.events) || draft.events.length === 0) {
      localStorage.removeItem(LEGACY_DRAFT_KEY);
      return false;
    }
    await putCharacter(newCharacter(draft));
    localStorage.removeItem(LEGACY_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Serialize for the .avilund.json file — §10's one export format. */
export function exportFile(record: CharacterRecord): string {
  return JSON.stringify(record, null, 2);
}

/** Parse an imported file; a colliding id gets a fresh one (a copy, not a
 * clobber). Throws on files that aren't character records. */
export async function importFile(text: string): Promise<CharacterRecord> {
  const parsed = JSON.parse(text) as CharacterRecord;
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.versions) || !parsed.versions[0]?.draft) {
    throw new Error('not a character file');
  }
  const existing = parsed.id ? await getCharacter(parsed.id) : undefined;
  const record: CharacterRecord = existing ? { ...parsed, id: crypto.randomUUID() } : parsed;
  await putCharacter(record);
  return record;
}
