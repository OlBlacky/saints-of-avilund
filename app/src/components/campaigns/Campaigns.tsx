// The Campaigns area (builder spec §13): the DM's tool. This first slice
// is the shell — the campaign list with create, open, and delete, and a
// campaign home behind ?id=. The Roster, Session log, and grant ledger
// land as the next increments.

import { useEffect, useState } from 'preact/hooks';

import {
  addGrant,
  addRosterEntry,
  addSession,
  createCampaign,
  deleteCampaign,
  exportCampaignFile,
  getCampaign,
  importCampaignFile,
  listCampaigns,
  putCampaign,
  removeGrant,
  removeRosterEntry,
  removeSession,
  renameCampaign,
  updateRosterEntry,
  updateSession,
} from '../../lib/campaign-store';
import type { CampaignRecord } from '../../lib/campaign-store';
import BookView from './BookView';
import ModuleEditor from './ModuleEditor';

const BASE = import.meta.env.BASE_URL;

const openHref = (id: string) => `${BASE}campaigns/?id=${id}`;

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[^\w\- ]+/g, '').trim() || 'campaign'}.avilund-campaign.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** The Session log — the meta-Chronicle. Newest shown first; the Session
 * number is the entry's chronological position, so it renders from the
 * array index. */
function SessionLog({
  campaign,
  save,
}: {
  campaign: CampaignRecord;
  save: (next: CampaignRecord) => Promise<void>;
}) {
  const log = () => save(addSession(campaign, new Date().toISOString().slice(0, 10)));

  return (
    <div class="session-log">
      <h3>Session log</h3>
      {campaign.sessions.length === 0 && <p class="cf-how">No Sessions yet.</p>}
      {campaign.sessions
        .map((s, i) => ({ s, number: i + 1 }))
        .reverse()
        .map(({ s, number }) => (
          <div class="session" key={s.id}>
            <div class="session-head">
              <strong>Session {number}</strong>
              <input
                class="roster-field"
                type="date"
                value={s.date}
                onChange={(e) => {
                  const typed = (e.target as HTMLInputElement).value;
                  if (typed) save(updateSession(campaign, s.id, { date: typed }));
                }}
              />
              <button
                type="button"
                class="undo"
                onClick={() => {
                  if (confirm(`Remove Session ${number}? Its notes go with it.`)) {
                    save(removeSession(campaign, s.id));
                  }
                }}
              >
                Remove
              </button>
            </div>
            <textarea
              class="roster-field session-notes"
              placeholder="Notes"
              value={s.notes}
              onChange={(e) =>
                save(updateSession(campaign, s.id, {
                  notes: (e.target as HTMLTextAreaElement).value,
                }))}
            />
          </div>
        ))}
      <div class="roster-actions">
        <button type="button" class="cf-crystallize" onClick={log}>Log a Session</button>
      </div>
    </div>
  );
}

/** A roster entry's display name: the character if named, else the player. */
function seatName(campaign: CampaignRecord, rosterId: string): string {
  const seat = campaign.roster.find((r) => r.id === rosterId);
  if (!seat) return '(no longer on the Roster)';
  return seat.character || seat.player;
}

/** The grant ledger — the DM's record of what was issued, to whom, in
 * which Session. The players' sheets are updated at the table (spec §13);
 * this is the DM's side of the wire. */
function GrantLedger({
  campaign,
  save,
}: {
  campaign: CampaignRecord;
  save: (next: CampaignRecord) => Promise<void>;
}) {
  const [what, setWhat] = useState('');
  const [to, setTo] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [note, setNote] = useState('');

  /** Session number by position (the log renumbers itself). */
  const sessionNumber = (id: string) => {
    const i = campaign.sessions.findIndex((s) => s.id === id);
    return i === -1 ? undefined : i + 1;
  };

  const toggle = (id: string) =>
    setTo(to.includes(id) ? to.filter((x) => x !== id) : [...to, id]);

  const issue = async () => {
    // Untouched checkboxes mean the whole party — the common case.
    const recipients = to.length > 0 ? to : campaign.roster.map((r) => r.id);
    try {
      await save(addGrant(campaign, what, recipients, sessionId || undefined));
    } catch (e) {
      setNote((e as Error).message);
      return;
    }
    setNote('');
    setWhat('');
    setTo([]);
  };

  return (
    <div class="session-log">
      <h3>Grant ledger</h3>
      {note && <p class="roster-note">{note}</p>}
      {campaign.ledger.length === 0 ? (
        <p class="cf-how">Nothing issued yet.</p>
      ) : (
        <table class="roster-table">
          <thead>
            <tr><th>Issued</th><th>To</th><th>Session</th><th></th></tr>
          </thead>
          <tbody>
            {[...campaign.ledger].reverse().map((g) => (
              <tr key={g.id}>
                <td>{g.what}</td>
                <td>{g.to.map((id) => seatName(campaign, id)).join(', ')}</td>
                <td>{g.sessionId && sessionNumber(g.sessionId) ? `Session ${sessionNumber(g.sessionId)}` : ''}</td>
                <td class="act">
                  <button type="button" class="undo" onClick={() => save(removeGrant(campaign, g.id))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {campaign.roster.length === 0 ? (
        <p class="cf-how">Grants need recipients — fill the Roster first.</p>
      ) : (
        <div class="grant-form">
          <input
            class="roster-field grant-what"
            type="text"
            placeholder="What was issued — a Milestone, gear, a Mark, an entry code"
            value={what}
            onInput={(e) => setWhat((e.target as HTMLInputElement).value)}
          />
          <div class="grant-recipients">
            {campaign.roster.map((r) => (
              <label key={r.id} class="grant-recipient">
                <input
                  type="checkbox"
                  checked={to.includes(r.id)}
                  onChange={() => toggle(r.id)}
                />{' '}
                {r.character || r.player}
              </label>
            ))}
            <span class="cf-how">Nobody ticked = everybody.</span>
          </div>
          <div class="roster-actions">
            <select
              class="roster-field"
              value={sessionId}
              onChange={(e) => setSessionId((e.target as HTMLSelectElement).value)}
            >
              <option value="">No Session</option>
              {campaign.sessions.map((s, i) => (
                <option key={s.id} value={s.id}>Session {i + 1} · {s.date}</option>
              ))}
            </select>
            <button type="button" class="cf-crystallize" onClick={issue}>Issue</button>
          </div>
        </div>
      )}
    </div>
  );
}

function CampaignHome({ campaign: initial }: { campaign: CampaignRecord }) {
  const [campaign, setCampaign] = useState(initial);
  const [nameDraft, setNameDraft] = useState(initial.name);
  const [view, setView] = useState<'table' | 'module' | 'book'>('table');
  const [player, setPlayer] = useState('');
  const [character, setCharacter] = useState('');
  const [note, setNote] = useState('');

  /** Local state first (keystrokes stay cheap), persisted on commit. */
  const save = async (next: CampaignRecord) => {
    setCampaign(next);
    await putCampaign(next);
  };

  const add = async () => {
    try {
      await save(addRosterEntry(campaign, player, character));
    } catch (e) {
      setNote((e as Error).message);
      return;
    }
    setNote('');
    setPlayer('');
    setCharacter('');
  };

  return (
    <div class="roster">
      <input
        class="campaign-name"
        type="text"
        value={nameDraft}
        onInput={(e) => setNameDraft((e.target as HTMLInputElement).value)}
        onChange={(e) => {
          const typed = (e.target as HTMLInputElement).value.trim();
          if (typed) {
            setNameDraft(typed);
            save(renameCampaign(campaign, typed));
          } else {
            // A blank name reverts to the saved one.
            setNameDraft(campaign.name);
          }
        }}
      />
      <p>Entry Level {campaign.entryLevel}</p>

      <div class="campaign-tabs">
        <button
          type="button"
          class={view === 'table' ? 'buy campaign-tab on' : 'buy campaign-tab'}
          onClick={() => setView('table')}
        >
          The Table
        </button>
        <button
          type="button"
          class={view === 'module' ? 'buy campaign-tab on' : 'buy campaign-tab'}
          onClick={() => setView('module')}
        >
          The Module
        </button>
        <button
          type="button"
          class={view === 'book' ? 'buy campaign-tab on' : 'buy campaign-tab'}
          onClick={() => setView('book')}
        >
          The Book
        </button>
      </div>

      {view === 'module' && <ModuleEditor campaign={campaign} stage={setCampaign} save={save} />}
      {view === 'book' && <BookView campaign={campaign} />}

      {view === 'table' && (<>
      <h3>Roster</h3>
      {note && <p class="roster-note">{note}</p>}
      {campaign.roster.length === 0 ? (
        <p class="cf-how">Nobody at the table yet.</p>
      ) : (
        <table class="roster-table">
          <thead>
            <tr><th>Player</th><th>Character</th><th></th></tr>
          </thead>
          <tbody>
            {campaign.roster.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    class="roster-field"
                    type="text"
                    value={r.player}
                    onInput={(e) =>
                      setCampaign(updateRosterEntry(campaign, r.id, {
                        player: (e.target as HTMLInputElement).value,
                      }))}
                    onChange={(e) =>
                      save(updateRosterEntry(campaign, r.id, {
                        player: (e.target as HTMLInputElement).value.trim(),
                      }))}
                  />
                </td>
                <td>
                  <input
                    class="roster-field"
                    type="text"
                    value={r.character}
                    onInput={(e) =>
                      setCampaign(updateRosterEntry(campaign, r.id, {
                        character: (e.target as HTMLInputElement).value,
                      }))}
                    onChange={(e) =>
                      save(updateRosterEntry(campaign, r.id, {
                        character: (e.target as HTMLInputElement).value.trim(),
                      }))}
                  />
                </td>
                <td class="act">
                  <button type="button" class="undo" onClick={() => save(removeRosterEntry(campaign, r.id))}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div class="roster-actions">
        <input
          class="roster-field"
          type="text"
          placeholder="Player"
          value={player}
          onInput={(e) => setPlayer((e.target as HTMLInputElement).value)}
        />
        <input
          class="roster-field"
          type="text"
          placeholder="Character"
          value={character}
          onInput={(e) => setCharacter((e.target as HTMLInputElement).value)}
        />
        <button type="button" class="cf-crystallize" onClick={add}>Add to Roster</button>
      </div>

      <SessionLog campaign={campaign} save={save} />

      <GrantLedger campaign={campaign} save={save} />
      </>)}

      <p style="margin-top:1.6rem;"><a href={`${BASE}campaigns/`}>&larr; All campaigns</a></p>
    </div>
  );
}

function CampaignList({
  campaigns,
  refresh,
}: {
  campaigns: CampaignRecord[];
  refresh: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [entryLevel, setEntryLevel] = useState('0');
  const [note, setNote] = useState('');

  const create = async () => {
    let record: CampaignRecord;
    try {
      record = createCampaign(name, Number(entryLevel));
    } catch (e) {
      setNote((e as Error).message);
      return;
    }
    await putCampaign(record);
    location.href = openHref(record.id);
  };

  const doDelete = async (c: CampaignRecord) => {
    const typed = prompt(
      `Deleting is forever. A backup file will download first.\n\nType the campaign's name (${c.name}) to continue:`,
    );
    if (typed !== c.name) return;
    download(c.name, exportCampaignFile(c));
    await deleteCampaign(c.id);
    await refresh();
  };

  const doImport = (file: File) => {
    file.text().then(async (text) => {
      try {
        await importCampaignFile(text);
        setNote(`Imported ${file.name}.`);
        await refresh();
      } catch {
        setNote(`${file.name} is not a campaign file.`);
      }
    });
  };

  return (
    <div class="roster">
      {note && <p class="roster-note">{note}</p>}

      {campaigns.length === 0 ? (
        <p class="cf-how">No campaigns yet. Start your first.</p>
      ) : (
        <table class="roster-table">
          <thead>
            <tr><th>Campaign</th><th>Entry Level</th><th></th></tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td><a href={openHref(c.id)}><strong>{c.name}</strong></a></td>
                <td>{c.entryLevel}</td>
                <td class="act">
                  <a class="buy" href={openHref(c.id)}>Open</a>
                  <button type="button" class="buy" onClick={() => download(c.name, exportCampaignFile(c))}>
                    Export
                  </button>
                  <button type="button" class="undo" title="delete (a backup downloads first)" onClick={() => doDelete(c)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div class="roster-actions">
        <input
          class="roster-field"
          type="text"
          placeholder="Campaign name"
          value={name}
          onInput={(e) => setName((e.target as HTMLInputElement).value)}
        />
        <label class="cf-how">
          Entry Level{' '}
          <input
            class="roster-field roster-field--level"
            type="number"
            min={0}
            max={11}
            value={entryLevel}
            onInput={(e) => setEntryLevel((e.target as HTMLInputElement).value)}
          />
        </label>
        <button type="button" class="cf-crystallize" onClick={create}>New Campaign</button>
        <label class="cf-roll roster-import">
          Import a campaign file
          <input
            type="file"
            accept=".json,application/json"
            style="display:none"
            onChange={(e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) doImport(file);
              (e.target as HTMLInputElement).value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[] | null>(null);
  const [open, setOpen] = useState<CampaignRecord | null>(null);

  const refresh = async () => {
    const records = await listCampaigns();
    records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setCampaigns(records);
  };

  useEffect(() => {
    (async () => {
      const id = new URLSearchParams(location.search).get('id');
      if (id) {
        const found = await getCampaign(id);
        if (found) {
          setOpen(found);
          return;
        }
      }
      await refresh();
    })();
  }, []);

  if (open) return <CampaignHome campaign={open} />;
  if (campaigns === null) return <p class="cf-loading">…</p>;
  return <CampaignList campaigns={campaigns} refresh={refresh} />;
}
