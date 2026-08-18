// Session Adjustment (builder spec §13): the paper-reconciliation draft.
// After a Session played on paper the player enters everything that
// changed — coin, things gained, things gone — and nothing touches the
// record until Commit writes the whole batch as one event. v1 is
// self-approved; the accounts era routes the same batch to the DM.

import { useState } from 'preact/hooks';

import type { OwnedItem } from '../../lib/record/replay';

export interface AdjustmentDraft {
  note?: string;
  coinSp?: number;
  gained?: { name?: string; qty?: number }[];
  lost?: { instanceId: string; qty?: number }[];
}

interface GainRow {
  name: string;
  qty: string;
}

interface LossRow {
  instanceId: string;
  qty: string;
}

export default function SessionAdjustment({
  inventory,
  onCommit,
  onClose,
}: {
  inventory: OwnedItem[];
  onCommit: (draft: AdjustmentDraft) => void;
  onClose: () => void;
}) {
  const [note, setNote] = useState('');
  const [coinSp, setCoinSp] = useState('');
  const [gains, setGains] = useState<GainRow[]>([]);
  const [losses, setLosses] = useState<LossRow[]>([]);
  const [problem, setProblem] = useState('');

  const stack = (id: string) => inventory.find((i) => i.instanceId === id);

  const commit = () => {
    const coin = coinSp.trim() === '' ? 0 : Number(coinSp);
    if (!Number.isInteger(coin)) { setProblem('Coin moves a whole number of silver.'); return; }
    const gained = gains
      .filter((g) => g.name.trim())
      .map((g) => ({ name: g.name.trim(), qty: Math.max(1, Number(g.qty) || 1) }));
    const lost = losses
      .filter((l) => stack(l.instanceId))
      .map((l) => {
        const qty = Number(l.qty);
        return Number.isInteger(qty) && qty >= 1 ? { instanceId: l.instanceId, qty } : { instanceId: l.instanceId };
      });
    if (coin === 0 && gained.length === 0 && lost.length === 0) {
      setProblem('Nothing entered yet.');
      return;
    }
    const draft: AdjustmentDraft = {
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(coin !== 0 ? { coinSp: coin } : {}),
      ...(gained.length ? { gained } : {}),
      ...(lost.length ? { lost } : {}),
    };
    onCommit(draft);
  };

  return (
    <div class="sheet-adjust">
      <h4>Session Adjustment</h4>
      {problem && <p class="sheet-adjust-problem">{problem}</p>}

      <div class="sheet-adjust-row">
        <label class="sheet-statelabel">
          Session
          <input
            class="sheet-move"
            type="text"
            placeholder="Which Session this reconciles"
            value={note}
            onInput={(e) => setNote((e.target as HTMLInputElement).value)}
          />
        </label>
        <label class="sheet-statelabel">
          Coin (sp)
          <input
            class="sheet-move"
            type="number"
            step="1"
            style="width: 7ch"
            placeholder="0"
            value={coinSp}
            onInput={(e) => setCoinSp((e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <div class="sheet-adjust-group">
        <strong>Gained</strong>
        {gains.map((g, i) => (
          <div class="sheet-adjust-row" key={i}>
            <input
              class="sheet-move"
              type="text"
              placeholder="Item"
              value={g.name}
              onInput={(e) =>
                setGains(gains.map((x, j) => (j === i ? { ...x, name: (e.target as HTMLInputElement).value } : x)))}
            />
            <input
              class="sheet-move"
              type="number"
              min="1"
              style="width: 6ch"
              value={g.qty}
              onInput={(e) =>
                setGains(gains.map((x, j) => (j === i ? { ...x, qty: (e.target as HTMLInputElement).value } : x)))}
            />
            <button type="button" class="undo" onClick={() => setGains(gains.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <button type="button" class="buy" onClick={() => setGains([...gains, { name: '', qty: '1' }])}>
          Add gained item
        </button>
      </div>

      <div class="sheet-adjust-group">
        <strong>Removed</strong>
        {losses.map((l, i) => {
          const s = stack(l.instanceId);
          return (
            <div class="sheet-adjust-row" key={i}>
              <select
                class="sheet-move"
                value={l.instanceId}
                onChange={(e) =>
                  setLosses(losses.map((x, j) => (j === i ? { ...x, instanceId: (e.target as HTMLSelectElement).value } : x)))}
              >
                {inventory.map((item) => (
                  <option key={item.instanceId} value={item.instanceId}>
                    {item.customName || item.name}{item.qty > 1 ? ` (${item.qty})` : ''}
                  </option>
                ))}
              </select>
              <input
                class="sheet-move"
                type="number"
                min="1"
                max={s?.qty ?? 1}
                style="width: 6ch"
                title="How many; blank for the whole stack"
                value={l.qty}
                onInput={(e) =>
                  setLosses(losses.map((x, j) => (j === i ? { ...x, qty: (e.target as HTMLInputElement).value } : x)))}
              />
              <button type="button" class="undo" onClick={() => setLosses(losses.filter((_, j) => j !== i))}>×</button>
            </div>
          );
        })}
        <button
          type="button"
          class="buy"
          disabled={inventory.length === 0}
          onClick={() => setLosses([...losses, { instanceId: inventory[0].instanceId, qty: '' }])}
        >
          Add removed item
        </button>
      </div>

      <div class="sheet-adjust-row">
        <button type="button" class="cf-crystallize" onClick={commit}>Commit the batch</button>
        <button type="button" class="undo" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
