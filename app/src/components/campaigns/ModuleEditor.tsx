// The Campaign Builder's Module editor (spec §13), bite one: the Module
// identity, the Campaign Summary overview with its assembled outline,
// and Chapters — title, summary line, DM text — with reorder and remove.
// Covers, CEs, maps, Rewards, and Books follow as the next bites.

import { useState } from 'preact/hooks';

import {
  addAppendixSection,
  addBook,
  addCE,
  exportModuleFile,
  addChapter,
  addEncounter,
  addMap,
  ensureModule,
  moveChapter,
  removeAppendixSection,
  removeBook,
  removeCE,
  removeChapter,
  removeEncounter,
  removeMap,
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
  updateModule,
  updateReward,
} from '../../lib/campaign-store';
import type {
  CampaignRecord,
  Cover,
  InsideCover,
  ModuleCE,
  ModuleEncounter,
  ModuleMap,
  Reward,
} from '../../lib/campaign-store';

const CE_REVEALS: { value: ModuleCE['reveal']; label: string }[] = [
  { value: 'on-attach', label: 'On enrollment' },
  { value: 'held', label: 'Held — granted in play or by Reward' },
];

const MAP_REVEALS: { value: ModuleMap['reveal']; label: string }[] = [
  { value: 'on-enrollment', label: 'On enrollment' },
  { value: 'dm-activated', label: 'DM-activated' },
  { value: 'dm-only', label: 'DM-only' },
];

/** Shrink uploaded cover art to a bounded JPEG data URL, portrait-style —
 * it lives in the campaign record, so storage stays modest. */
function resizeArtwork(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('not an image'));
    };
    img.src = url;
  });
}

const COVER_FIELDS: { key: keyof Cover; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle / tagline' },
  { key: 'artist', label: 'Artist' },
  { key: 'medium', label: 'Medium' },
  { key: 'banner', label: 'Banner (entry level · party size · play length)' },
  { key: 'seriesLine', label: 'Series line' },
  { key: 'imprint', label: 'Imprint' },
];

const INSIDE_COVER_FIELDS: { key: keyof InsideCover; label: string }[] = [
  { key: 'authors', label: 'Author(s)' },
  { key: 'additionalDesign', label: 'Additional design' },
  { key: 'editing', label: 'Editing' },
  { key: 'coverArtist', label: 'Cover artist' },
  { key: 'interiorArtists', label: 'Interior artists' },
  { key: 'cartography', label: 'Cartography' },
  { key: 'playtestedBy', label: 'Playtested By' },
  { key: 'specialThanks', label: 'Special thanks' },
  { key: 'dedication', label: 'Dedication' },
  { key: 'versionPrinting', label: 'Version / printing' },
  { key: 'publicationDate', label: 'Publication date' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'legalLine', label: 'Legal line' },
  { key: 'contentNotes', label: 'Content notes' },
];

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

  // Plain render helpers, invoked as {helper(x)} — never as components, so
  // inputs keep focus across keystrokes (LESSONS.md).
  const coverGrid = (cover: Cover | undefined, apply: (patch: Partial<Cover>) => CampaignRecord) => (
    <div class="module-fields">
      {COVER_FIELDS.map((f) => (
        <label class="sheet-statelabel module-field" key={f.key}>
          {f.label}
          <input
            class="roster-field"
            type="text"
            {...field(cover?.[f.key] ?? '', (v) => apply({ [f.key]: v }))}
          />
        </label>
      ))}
      <div class="module-field module-artwork">
        {cover?.artwork && <img src={cover.artwork} alt="" />}
        <label class="cf-roll roster-import">
          {cover?.artwork ? 'Replace the cover artwork' : 'Upload cover artwork'}
          <input
            type="file"
            accept="image/*"
            style="display:none"
            onChange={async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              (e.target as HTMLInputElement).value = '';
              if (!file) return;
              try {
                save(apply({ artwork: await resizeArtwork(file) }));
              } catch { /* not an image; nothing to store */ }
            }}
          />
        </label>
        {cover?.artwork && (
          <button type="button" class="undo" onClick={() => save(apply({ artwork: undefined }))}>
            Remove it
          </button>
        )}
      </div>
    </div>
  );

  const insideCoverGrid = (ic: InsideCover | undefined, apply: (patch: Partial<InsideCover>) => CampaignRecord) => (
    <div class="module-fields">
      {INSIDE_COVER_FIELDS.map((f) => (
        <label class="sheet-statelabel module-field" key={f.key}>
          {f.label}
          <input
            class="roster-field"
            type="text"
            {...field(ic?.[f.key] ?? '', (v) => apply({ [f.key]: v }))}
          />
        </label>
      ))}
    </div>
  );

  const ceBlock = (ce: ModuleCE) => (
    <div class="module-item" key={ce.id}>
      <div class="module-chapter-head">
        <input
          class="roster-field module-code"
          type="text"
          title="Entry code"
          {...field(ce.code, (v) => updateCE(campaign, ce.id, { code: v }))}
        />
        <input
          class="roster-field module-grow"
          type="text"
          placeholder="CE title"
          {...field(ce.title, (v) => updateCE(campaign, ce.id, { title: v }))}
        />
        <select
          class="roster-field"
          value={ce.reveal}
          onChange={(e) =>
            save(updateCE(campaign, ce.id, { reveal: (e.target as HTMLSelectElement).value as ModuleCE['reveal'] }))}
        >
          {CE_REVEALS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button type="button" class="undo" onClick={() => save(removeCE(campaign, ce.id))}>Remove</button>
      </div>
      <textarea
        class="roster-field module-text"
        placeholder="The entry's text"
        {...field(ce.text, (v) => updateCE(campaign, ce.id, { text: v }))}
      />
    </div>
  );

  const mapBlock = (map: ModuleMap) => (
    <div class="module-item" key={map.id}>
      <div class="module-chapter-head">
        <input
          class="roster-field module-grow"
          type="text"
          placeholder="Map title"
          {...field(map.title, (v) => updateMap(campaign, map.id, { title: v }))}
        />
        <select
          class="roster-field"
          value={map.reveal}
          onChange={(e) =>
            save(updateMap(campaign, map.id, { reveal: (e.target as HTMLSelectElement).value as ModuleMap['reveal'] }))}
        >
          {MAP_REVEALS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <button type="button" class="undo" onClick={() => save(removeMap(campaign, map.id))}>Remove</button>
      </div>
      <div class="module-artwork">
        {map.image && <img src={map.image} alt="" />}
        <label class="cf-roll roster-import">
          {map.image ? 'Replace the map image' : 'Upload the map image'}
          <input
            type="file"
            accept="image/*"
            style="display:none"
            onChange={async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              (e.target as HTMLInputElement).value = '';
              if (!file) return;
              try {
                save(updateMap(campaign, map.id, { image: await resizeArtwork(file) }));
              } catch { /* not an image; nothing to store */ }
            }}
          />
        </label>
      </div>
    </div>
  );

  const encounterBlock = (enc: ModuleEncounter) => (
    <div class="module-item" key={enc.id}>
      <div class="module-chapter-head">
        <input
          class="roster-field module-grow"
          type="text"
          placeholder="Encounter title"
          {...field(enc.title, (v) => updateEncounter(campaign, enc.id, { title: v }))}
        />
        <button type="button" class="undo" onClick={() => save(removeEncounter(campaign, enc.id))}>Remove</button>
      </div>
      <textarea
        class="roster-field module-text"
        placeholder="The set piece"
        {...field(enc.text, (v) => updateEncounter(campaign, enc.id, { text: v }))}
      />
    </div>
  );

  // The Reward Builder (spec §13): the bundle at a Chapter's or Book's end.
  const rewardBlock = (r: Reward, apply: (patch: Partial<Reward>) => CampaignRecord) => {
    const heldCes = [
      ...m.frontCes.map((ce) => ({ ce, where: 'Starting Handouts' })),
      ...m.chapters.flatMap((x, i) => x.ces.map((ce) => ({ ce, where: `Chapter ${i + 1}` }))),
    ].filter(({ ce }) => ce.reveal === 'held');
    const payableMaps = [
      ...m.frontMaps.map((map) => ({ map, where: 'Starting Handouts' })),
      ...m.chapters.flatMap((x, i) => x.maps.map((map) => ({ map, where: `Chapter ${i + 1}` }))),
    ].filter(({ map }) => map.reveal === 'dm-activated');
    const toggle = (list: string[], id: string) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

    return (
      <div class="module-group module-reward">
        <strong>Reward</strong>
        <div class="module-chapter-head">
          <label class="sheet-statelabel">
            Milestones
            <input
              class="roster-field"
              type="number"
              min="0"
              style="width: 5ch"
              value={String(r.milestones)}
              onChange={(e) => {
                const n = Number((e.target as HTMLInputElement).value);
                if (Number.isInteger(n) && n >= 0) save(apply({ milestones: n }));
              }}
            />
          </label>
        </div>

        <div class="module-reward-part">
          <span class="module-reward-label">Gear & treasure</span>
          {r.gear.map((line, i) => (
            <div class="module-chapter-head" key={i}>
              <input
                class="roster-field module-grow"
                type="text"
                value={line}
                onInput={(e) =>
                  stage(apply({
                    gear: r.gear.map((x, j) => (j === i ? (e.target as HTMLInputElement).value : x)),
                  }))}
                onChange={(e) =>
                  save(apply({
                    gear: r.gear.map((x, j) => (j === i ? (e.target as HTMLInputElement).value : x)),
                  }))}
              />
              <button
                type="button"
                class="undo"
                onClick={() => save(apply({ gear: r.gear.filter((_, j) => j !== i) }))}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" class="buy" onClick={() => save(apply({ gear: [...r.gear, ''] }))}>
            Add a line
          </button>
        </div>

        {heldCes.length > 0 && (
          <div class="module-reward-part">
            <span class="module-reward-label">CEs paid out</span>
            {heldCes.map(({ ce, where }) => (
              <label class="grant-recipient" key={ce.id}>
                <input
                  type="checkbox"
                  checked={r.ceIds.includes(ce.id)}
                  onChange={() => save(apply({ ceIds: toggle(r.ceIds, ce.id) }))}
                />{' '}
                {ce.code} · {ce.title || 'Untitled'} ({where})
              </label>
            ))}
          </div>
        )}

        {payableMaps.length > 0 && (
          <div class="module-reward-part">
            <span class="module-reward-label">Maps paid out</span>
            {payableMaps.map(({ map, where }) => (
              <label class="grant-recipient" key={map.id}>
                <input
                  type="checkbox"
                  checked={r.mapIds.includes(map.id)}
                  onChange={() => save(apply({ mapIds: toggle(r.mapIds, map.id) }))}
                />{' '}
                {map.title || 'Untitled'} ({where})
              </label>
            ))}
          </div>
        )}

        <div class="module-reward-part">
          <span class="module-reward-label">Marks</span>
          {r.marks.map((mark, i) => (
            <div class="module-item" key={i}>
              <div class="module-chapter-head">
                <input
                  class="roster-field module-grow"
                  type="text"
                  placeholder="Name"
                  value={mark.name}
                  onInput={(e) =>
                    stage(apply({
                      marks: r.marks.map((x, j) => (j === i ? { ...x, name: (e.target as HTMLInputElement).value } : x)),
                    }))}
                  onChange={(e) =>
                    save(apply({
                      marks: r.marks.map((x, j) => (j === i ? { ...x, name: (e.target as HTMLInputElement).value } : x)),
                    }))}
                />
                <button
                  type="button"
                  class="undo"
                  onClick={() => save(apply({ marks: r.marks.filter((_, j) => j !== i) }))}
                >
                  Remove
                </button>
              </div>
              <textarea
                class="roster-field module-text module-mark-rule"
                placeholder="Rule text"
                value={mark.rule}
                onInput={(e) =>
                  stage(apply({
                    marks: r.marks.map((x, j) => (j === i ? { ...x, rule: (e.target as HTMLTextAreaElement).value } : x)),
                  }))}
                onChange={(e) =>
                  save(apply({
                    marks: r.marks.map((x, j) => (j === i ? { ...x, rule: (e.target as HTMLTextAreaElement).value } : x)),
                  }))}
              />
            </div>
          ))}
          <button
            type="button"
            class="buy"
            onClick={() => save(apply({ marks: [...r.marks, { name: '', rule: '' }] }))}
          >
            Add a Mark
          </button>
        </div>
      </div>
    );
  };

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

      <details class="module-section">
        <summary>Cover</summary>
        {coverGrid(m.cover, (p) => updateCover(campaign, p))}
      </details>

      <details class="module-section">
        <summary>Inside Cover</summary>
        {insideCoverGrid(m.insideCover, (p) => updateInsideCover(campaign, p))}
      </details>

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

      <h3>DM Introduction</h3>
      <textarea
        class="roster-field module-text"
        placeholder="For the DM's eyes, before play begins"
        {...field(m.dmIntro, (v) => updateModule(campaign, { dmIntro: v }))}
      />

      <h3>Starting Handouts</h3>
      <div class="module-group">
        <strong>CEs</strong>
        {m.frontCes.map(ceBlock)}
        <button type="button" class="buy" onClick={() => save(addCE(campaign, 'front'))}>Add a CE</button>
      </div>
      <div class="module-group">
        <strong>Maps</strong>
        {m.frontMaps.map(mapBlock)}
        <button type="button" class="buy" onClick={() => save(addMap(campaign, 'front'))}>Add a map</button>
      </div>

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
            {m.books.length > 0 && (
              <select
                class="roster-field"
                title="Book"
                value={ch.bookId ?? ''}
                onChange={(e) =>
                  save(setChapterBook(campaign, ch.id, (e.target as HTMLSelectElement).value || undefined))}
              >
                <option value="">No Book</option>
                {m.books.map((b, bi) => (
                  <option key={b.id} value={b.id}>{b.title || `Book ${bi + 1}`}</option>
                ))}
              </select>
            )}
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
          <div class="module-group">
            <strong>CEs</strong>
            {ch.ces.map(ceBlock)}
            <button type="button" class="buy" onClick={() => save(addCE(campaign, { chapterId: ch.id }))}>Add a CE</button>
          </div>
          <div class="module-group">
            <strong>Maps</strong>
            {ch.maps.map(mapBlock)}
            <button type="button" class="buy" onClick={() => save(addMap(campaign, { chapterId: ch.id }))}>Add a map</button>
          </div>
          <div class="module-group">
            <strong>Encounters</strong>
            {ch.encounters.map(encounterBlock)}
            <button type="button" class="buy" onClick={() => save(addEncounter(campaign, ch.id))}>Add an encounter</button>
          </div>
          {rewardBlock(ch.reward, (p) => updateReward(campaign, ch.id, p))}
        </div>
      ))}

      <div class="roster-actions">
        <button type="button" class="cf-crystallize" onClick={() => save(addChapter(campaign))}>Add a Chapter</button>
      </div>

      <h3>Books</h3>
      {m.books.map((b, bi) => (
        <div class="module-chapter" key={b.id}>
          <div class="module-chapter-head">
            <strong>Book {bi + 1}</strong>
            <input
              class="roster-field module-grow"
              type="text"
              placeholder="Title"
              {...field(b.title, (v) => updateBook(campaign, b.id, { title: v }))}
            />
            <button
              type="button"
              class="undo"
              onClick={() => save(removeBook(campaign, b.id))}
              title="Its Chapters stay in the spine"
            >
              Remove
            </button>
          </div>
          <p class="cf-how">
            {(() => {
              const inBook = m.chapters
                .map((ch, ci) => ({ ch, ci }))
                .filter(({ ch }) => ch.bookId === b.id);
              return inBook.length === 0
                ? 'No Chapters assigned. Pick this Book on a Chapter.'
                : `Chapters: ${inBook.map(({ ch, ci }) => ch.title || `Chapter ${ci + 1}`).join(' · ')}`;
            })()}
          </p>
          <details class="module-section">
            <summary>Cover</summary>
            {coverGrid(b.cover, (p) => updateBookCover(campaign, b.id, p))}
          </details>
          <details class="module-section">
            <summary>Inside Cover</summary>
            {insideCoverGrid(b.insideCover, (p) => updateBookInsideCover(campaign, b.id, p))}
          </details>
          {rewardBlock(b.reward, (p) => updateBookReward(campaign, b.id, p))}
        </div>
      ))}
      <div class="roster-actions">
        <button type="button" class="cf-roll" onClick={() => save(addBook(campaign))}>Add a Book</button>
      </div>

      <h3>Appendix</h3>
      {m.appendix.map((s) => (
        <div class="module-item" key={s.id}>
          <div class="module-chapter-head">
            <input
              class="roster-field module-grow"
              type="text"
              placeholder="Section title"
              {...field(s.title, (v) => updateAppendixSection(campaign, s.id, { title: v }))}
            />
            <button type="button" class="undo" onClick={() => save(removeAppendixSection(campaign, s.id))}>Remove</button>
          </div>
          <textarea
            class="roster-field module-text"
            placeholder="Text"
            {...field(s.text, (v) => updateAppendixSection(campaign, s.id, { text: v }))}
          />
        </div>
      ))}
      <div class="roster-actions">
        <button type="button" class="cf-roll" onClick={() => save(addAppendixSection(campaign))}>Add a section</button>
      </div>

      <div class="roster-actions">
        <button
          type="button"
          class="cf-roll"
          onClick={() => {
            const blob = new Blob([exportModuleFile(m)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${m.title.replace(/[^\w\- ]+/g, '').trim() || 'module'}.avilund-module.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
        >
          Export the Module
        </button>
      </div>
    </div>
  );
}
