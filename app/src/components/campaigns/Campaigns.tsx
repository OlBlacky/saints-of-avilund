// The Campaigns area (builder spec §13): the DM's tool. This first slice
// is the shell — the campaign list with create, open, and delete, and a
// campaign home behind ?id=. The Roster, Session log, and grant ledger
// land as the next increments.

import { useEffect, useState } from 'preact/hooks';

import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  putCampaign,
} from '../../lib/campaign-store';
import type { CampaignRecord } from '../../lib/campaign-store';

const BASE = import.meta.env.BASE_URL;

const openHref = (id: string) => `${BASE}campaigns/?id=${id}`;

function CampaignHome({ campaign }: { campaign: CampaignRecord }) {
  return (
    <div class="roster">
      <h2>{campaign.name}</h2>
      <p>Entry Level {campaign.entryLevel}</p>
      <p class="cf-how">The Roster, Session log, and grant ledger are the next pieces to arrive.</p>
      <p><a href={`${BASE}campaigns/`}>&larr; All campaigns</a></p>
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
    const typed = prompt(`Deleting is forever.\n\nType the campaign's name (${c.name}) to continue:`);
    if (typed !== c.name) return;
    await deleteCampaign(c.id);
    await refresh();
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
                  <button type="button" class="undo" onClick={() => doDelete(c)}>Delete</button>
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
