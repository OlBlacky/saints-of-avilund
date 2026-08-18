// The Campaign Builder's Module editor (spec §13), bite one: the Module
// identity, the Campaign Summary overview with its assembled outline,
// and Chapters — title, summary line, DM text — with reorder and remove.
// Covers, CEs, maps, Rewards, and Books follow as the next bites.

import { useState } from 'preact/hooks';

import {
  addChapter,
  ensureModule,
  moveChapter,
  removeChapter,
  updateChapter,
  updateModule,
} from '../../lib/campaign-store';
import type { CampaignRecord } from '../../lib/campaign-store';

export default function ModuleEditor({
  campaign,
  stage,
  save,
}: {
  campaign: CampaignRecord;
  /** Update the working copy only — keystrokes. */
  stage: (next: CampaignRecord) => void;
  /** Update and persist — commits, on leaving a field. */
  save: (next: CampaignRecord) => Promise<void>;
}) {
  const [confirmRemove, setConfirmRemove] = useState('');
  const m = campaign.module;

  if (!m) {
    return (
      <div class="module">
        <button type="button" class="cf-crystallize" onClick={() => save(ensureModule(campaign))}>
          Start the Module
        </button>
      </div>
    );
  }

  const field = (
    value: string,
    patch: (v: string) => CampaignRecord,
  ) => ({
    value,
    onInput: (e: Event) => stage(patch((e.target as HTMLInputElement).value)),
    onChange: (e: Event) => save(patch((e.target as HTMLInputElement).value)),
  });

  return (
    <div class="module">
      <div class="module-identity">
        <label class="sheet-statelabel module-wide">
          Title
          <input class="roster-field" type="text" {...field(m.title, (v) => updateModule(campaign, { title: v }))} />
        </label>
        <label class="sheet-statelabel">
          Author
          <input class="roster-field" type="text" {...field(m.author, (v) => updateModule(campaign, { author: v }))} />
        </label>
        <label class="sheet-statelabel">
          Version
          <input class="roster-field" type="text" {...field(m.version, (v) => updateModule(campaign, { version: v }))} />
        </label>
      </div>

      <h3>Campaign Summary</h3>
      <textarea
        class="roster-field module-text"
        placeholder="Overview"
        {...field(m.overview, (v) => updateModule(campaign, { overview: v }))}
      />
      {m.chapters.length > 0 && (
        <table class="roster-table module-outline">
          <thead>
            <tr><th>Chapter</th><th>Title</th><th>Summary</th></tr>
          </thead>
          <tbody>
            {m.chapters.map((ch, i) => (
              <tr key={ch.id}>
                <td>{i + 1}</td>
                <td>{ch.title}</td>
                <td>{ch.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {m.chapters.map((ch, i) => (
        <div class="module-chapter" key={ch.id}>
          <div class="module-chapter-head">
            <strong>Chapter {i + 1}</strong>
            <input
              class="roster-field module-grow"
              type="text"
              placeholder="Title"
              {...field(ch.title, (v) => updateChapter(campaign, ch.id, { title: v }))}
            />
            <button type="button" class="undo" disabled={i === 0} onClick={() => save(moveChapter(campaign, ch.id, -1))}>↑</button>
            <button type="button" class="undo" disabled={i === m.chapters.length - 1} onClick={() => save(moveChapter(campaign, ch.id, 1))}>↓</button>
            {confirmRemove === ch.id ? (
              <>
                <button type="button" class="buy" onClick={() => { setConfirmRemove(''); save(removeChapter(campaign, ch.id)); }}>
                  Remove it
                </button>
                <button type="button" class="undo" onClick={() => setConfirmRemove('')}>Keep it</button>
              </>
            ) : (
              <button type="button" class="undo" onClick={() => setConfirmRemove(ch.id)}>Remove</button>
            )}
          </div>
          <input
            class="roster-field module-wide"
            type="text"
            placeholder="Summary — one line, for the outline"
            {...field(ch.summary, (v) => updateChapter(campaign, ch.id, { summary: v }))}
          />
          <textarea
            class="roster-field module-text"
            placeholder="DM text"
            {...field(ch.dmText, (v) => updateChapter(campaign, ch.id, { dmText: v }))}
          />
        </div>
      ))}

      <div class="roster-actions">
        <button type="button" class="cf-crystallize" onClick={() => save(addChapter(campaign))}>Add a Chapter</button>
      </div>
    </div>
  );
}
