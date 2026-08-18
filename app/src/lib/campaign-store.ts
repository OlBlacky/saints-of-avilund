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

/** One entry in the Session log — the meta-Chronicle (spec §5). */
export interface SessionEntry {
  id: string;
  /** Session number, 1-based, assigned when logged. */
  number: number;
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

export interface CampaignRecord {
  id: string;
  schemaVersion: 1;
  name: string;
  /** The Level characters join at: 0 to the cap. */
  entryLevel: number;
  /** The attached Adventure Module's id; absent = no Module. */
  moduleId?: string;
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
