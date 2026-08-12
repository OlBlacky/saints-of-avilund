// The Characters roster (builder spec §12): every Character in the
// browser-account, with state badges, New Character, open, export,
// import, and a deliberately hard delete (an export always happens
// first — §3: memorials, not garbage).

import { useEffect, useState } from 'preact/hooks';

import { classById } from '../../lib/classes';
import { levelFor, replay } from '../../lib/record/replay';
import type { RecordEvent } from '../../lib/record/events';
import {
  exportFile,
  importFile,
  listCharacters,
  migrateLegacyDraft,
  newCharacter,
  putCharacter,
  deleteCharacter,
} from '../../lib/store';
import type { CharacterRecord } from '../../lib/store';

const BASE = import.meta.env.BASE_URL;

interface Row {
  record: CharacterRecord;
  name: string;
  line: string;
  state: 'In Creation' | 'Complete';
  portrait?: string;
}

function toRow(record: CharacterRecord): Row {
  const draft = record.versions[0].draft;
  const { state } = replay(draft.events as RecordEvent[]);
  const cls = state.classId ? classById(state.classId) : undefined;
  const sub = cls?.subclasses.find((s) => s.id === state.subclassId);
  const level = levelFor(state.milestones, state.crystallized);
  const line = cls
    ? `${cls.name}${sub ? ` · ${sub.name}` : ''}${state.crystallized ? ` · Level ${level}` : ''}`
    : 'Nothing chosen yet';
  return {
    record,
    name: draft.identity?.name || 'Unnamed',
    line,
    state: state.crystallized ? 'Complete' : 'In Creation',
    portrait: draft.identity?.portrait,
  };
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${name.replace(/[^\w\- ]+/g, '').trim() || 'character'}.avilund.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Roster() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [note, setNote] = useState('');

  const refresh = async () => {
    const records = await listCharacters();
    records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setRows(records.map(toRow));
  };

  useEffect(() => {
    (async () => {
      if (await migrateLegacyDraft()) setNote('Your draft character moved into the roster.');
      await refresh();
    })();
  }, []);

  const openHref = (id: string) => `${BASE}builder/?c=${id}`;

  const create = async () => {
    const record = newCharacter({
      identity: { name: '', origin: '', age: '', heightFt: '', heightIn: '', weight: '', notes: '' },
      events: [],
      rerollsLeft: 2,
      basket: [],
    });
    await putCharacter(record);
    location.href = openHref(record.id);
  };

  const doImport = (file: File) => {
    file.text().then(
      async (text) => {
        try {
          await importFile(text);
          setNote(`Imported ${file.name}.`);
          await refresh();
        } catch {
          setNote(`${file.name} is not a character file.`);
        }
      },
    );
  };

  const doDelete = async (row: Row) => {
    const typed = prompt(
      `Deleting is forever. A backup file will download first.\n\nType the character's name (${row.name}) to continue:`,
    );
    if (typed !== row.name) return;
    download(row.name, exportFile(row.record));
    await deleteCharacter(row.record.id);
    await refresh();
  };

  if (rows === null) return <p class="cf-loading">…</p>;

  return (
    <div class="roster">
      {note && <p class="roster-note">{note}</p>}

      {rows.length === 0 ? (
        <p class="cf-how">No characters yet. Make your first.</p>
      ) : (
        <table class="cf-shop-table sheet-table roster-table">
          <thead>
            <tr><th></th><th>Character</th><th>Build</th><th>State</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.record.id}>
                <td class="roster-face">
                  <a href={openHref(r.record.id)}>
                    {r.portrait
                      ? <img src={r.portrait} alt="" />
                      : <span class="roster-face--empty" />}
                  </a>
                </td>
                <td><a href={openHref(r.record.id)}><strong>{r.name}</strong></a></td>
                <td>{r.line}</td>
                <td>{r.state}</td>
                <td class="act">
                  <a class="buy" href={openHref(r.record.id)}>Open</a>
                  <button type="button" class="buy" onClick={() => download(r.name, exportFile(r.record))}>
                    Export
                  </button>
                  <button type="button" class="undo" title="delete (a backup downloads first)" onClick={() => doDelete(r)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div class="cf-line roster-actions">
        <button type="button" class="cf-crystallize" onClick={create}>New Character</button>
        <label class="cf-roll roster-import">
          Import a character file
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
