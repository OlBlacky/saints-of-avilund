// The book view (spec §13): the Module read as a book — covers, Table of
// Contents, DM Introduction, Starting Handouts, Chapters under their Books,
// with a scope picker, printing to PDF through the browser. A draft
// module carries its watermark on every page.

import { useEffect, useState } from 'preact/hooks';
import type { JSX } from 'preact';

import type {
  CampaignRecord,
  Chapter,
  Cover,
  InsideCover,
  ModuleCE,
  ModuleMap,
  Reward,
} from '../../lib/campaign-store';

const INSIDE_LABELS: { key: keyof InsideCover; label: string }[] = [
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

const CE_REVEAL_LABEL: Record<ModuleCE['reveal'], string> = {
  'on-attach': 'On enrollment',
  held: 'Held',
};

const MAP_REVEAL_LABEL: Record<ModuleMap['reveal'], string> = {
  'on-enrollment': 'On enrollment',
  'dm-activated': 'DM-activated',
  'dm-only': 'DM-only',
};

type Scope = 'all' | `book:${string}` | `chapter:${string}`;

function rewardEmpty(r: Reward): boolean {
  return r.milestones === 0 && r.gear.every((g) => !g.trim()) && r.ceIds.length === 0 &&
    r.mapIds.length === 0 && r.marks.length === 0;
}

export default function BookView({ campaign }: { campaign: CampaignRecord }) {
  const [scope, setScope] = useState<Scope>('all');
  const m = campaign.module;

  // Print isolation: while the book view is open, printing renders it
  // alone (the campaigns page CSS keys off this class).
  useEffect(() => {
    document.documentElement.classList.add('book-mode');
    return () => document.documentElement.classList.remove('book-mode');
  }, []);

  if (!m) return <p class="cf-how">No Module yet — start it on The Module.</p>;

  const draft = /draft/i.test(m.version);
  const chapterNumber = (ch: Chapter) => m.chapters.indexOf(ch) + 1;

  const chaptersInScope: Chapter[] =
    scope === 'all'
      ? m.chapters
      : scope.startsWith('book:')
        ? m.chapters.filter((ch) => ch.bookId === scope.slice(5))
        : m.chapters.filter((ch) => ch.id === scope.slice(8));
  const bookInScope = scope.startsWith('book:') ? m.books.find((b) => b.id === scope.slice(5)) : undefined;
  const whole = scope === 'all';

  const ceTitle = (id: string) => {
    const ce = [...m.frontCes, ...m.chapters.flatMap((ch) => ch.ces)].find((x) => x.id === id);
    return ce ? `${ce.code} · ${ce.title || 'Untitled'}` : '';
  };
  const mapTitle = (id: string) => {
    const map = [...m.frontMaps, ...m.chapters.flatMap((ch) => ch.maps)].find((x) => x.id === id);
    return map?.title || (map ? 'Untitled' : '');
  };

  // Plain render helpers invoked as {helper(x)} (LESSONS.md).
  const coverPage = (cover: Cover | undefined, fallbackTitle: string) => (
    <section class="book-page book-cover">
      {cover?.artwork && <img class="book-cover-art" src={cover.artwork} alt="" />}
      <h1>{cover?.title || fallbackTitle}</h1>
      {cover?.subtitle && <p class="book-subtitle">{cover.subtitle}</p>}
      {cover?.banner && <p class="book-banner">{cover.banner}</p>}
      {cover?.seriesLine && <p class="book-series">{cover.seriesLine}</p>}
      {(cover?.artist || cover?.medium) && (
        <p class="book-artcredit">{[cover.artist, cover.medium].filter(Boolean).join(' · ')}</p>
      )}
      {cover?.imprint && <p class="book-imprint">{cover.imprint}</p>}
    </section>
  );

  const insidePage = (ic: InsideCover | undefined) => {
    const rows = INSIDE_LABELS.filter(({ key }) => ic?.[key]?.trim());
    if (rows.length === 0) return null;
    return (
      <section class="book-page book-inside">
        <dl>
          {rows.map(({ key, label }) => (
            <div key={key}><dt>{label}</dt><dd>{ic![key]}</dd></div>
          ))}
        </dl>
      </section>
    );
  };

  const ceEntry = (ce: ModuleCE) => (
    <div class="book-entry" key={ce.id}>
      <h4>{ce.code} · {ce.title || 'Untitled'} <span class="book-tag">{CE_REVEAL_LABEL[ce.reveal]}</span></h4>
      {ce.text && <p class="book-prose">{ce.text}</p>}
    </div>
  );

  const mapEntry = (map: ModuleMap) => (
    <div class="book-entry" key={map.id}>
      <h4>{map.title || 'Untitled'} <span class="book-tag">{MAP_REVEAL_LABEL[map.reveal]}</span></h4>
      {map.image && <img class="book-map" src={map.image} alt={map.title} />}
    </div>
  );

  const rewardEntry = (r: Reward, heading: string) => {
    if (rewardEmpty(r)) return null;
    return (
      <div class="book-reward">
        <h4>{heading}</h4>
        {r.milestones > 0 && <p>Milestones: {r.milestones}</p>}
        {r.gear.filter((g) => g.trim()).length > 0 && (
          <ul>{r.gear.filter((g) => g.trim()).map((g, i) => <li key={i}>{g}</li>)}</ul>
        )}
        {r.ceIds.length > 0 && <p>CEs: {r.ceIds.map(ceTitle).filter(Boolean).join(' · ')}</p>}
        {r.mapIds.length > 0 && <p>Maps: {r.mapIds.map(mapTitle).filter(Boolean).join(' · ')}</p>}
        {r.marks.map((mark, i) => (
          <p key={i}><strong>{mark.name}</strong>{mark.rule ? ` — ${mark.rule}` : ''}</p>
        ))}
      </div>
    );
  };

  const chapterPages = (ch: Chapter) => (
    <section class="book-page" key={ch.id}>
      <h2>Chapter {chapterNumber(ch)}{ch.title ? ` — ${ch.title}` : ''}</h2>
      {ch.summary && <p class="book-summaryline">{ch.summary}</p>}
      {ch.dmText && <p class="book-prose">{ch.dmText}</p>}
      {ch.ces.map(ceEntry)}
      {ch.maps.map(mapEntry)}
      {ch.encounters.map((enc) => (
        <div class="book-entry" key={enc.id}>
          <h4>{enc.title || 'Untitled'}</h4>
          {enc.text && <p class="book-prose">{enc.text}</p>}
        </div>
      ))}
      {rewardEntry(ch.reward, 'Reward')}
    </section>
  );

  // Chapters render in spine order; a Book's cover pages appear before its
  // first Chapter, its Reward after its last.
  const spine: JSX.Element[] = [];
  chaptersInScope.forEach((ch) => {
    const book = whole && ch.bookId ? m.books.find((b) => b.id === ch.bookId) : undefined;
    if (book && chaptersInScope.find((x) => x.bookId === book.id) === ch) {
      spine.push(coverPage(book.cover, book.title || 'Untitled Book'));
      const inside = insidePage(book.insideCover);
      if (inside) spine.push(inside);
    }
    spine.push(chapterPages(ch));
    if (book) {
      const last = [...chaptersInScope].reverse().find((x) => x.bookId === book.id);
      if (last === ch) {
        const r = rewardEntry(book.reward, `${book.title || 'The Book'} — Reward`);
        if (r) spine.push(<section class="book-page" key={`${book.id}-reward`}>{r}</section>);
      }
    }
  });

  return (
    <div class="book-wrap">
      <div class="book-controls">
        <select
          class="roster-field"
          value={scope}
          onChange={(e) => setScope((e.target as HTMLSelectElement).value as Scope)}
        >
          <option value="all">Everything</option>
          {m.books.map((b, i) => (
            <option key={b.id} value={`book:${b.id}`}>{b.title || `Book ${i + 1}`}</option>
          ))}
          {m.chapters.map((ch, i) => (
            <option key={ch.id} value={`chapter:${ch.id}`}>Chapter {i + 1}{ch.title ? ` — ${ch.title}` : ''}</option>
          ))}
        </select>
        <button type="button" class="cf-crystallize" onClick={() => print()}>Print</button>
      </div>

      <div class="book-view">
        {draft && <div class="book-watermark">DRAFT - Players Please do not Read</div>}

        {whole && coverPage(m.cover, m.title)}
        {bookInScope && coverPage(bookInScope.cover, bookInScope.title || 'Untitled Book')}
        {whole && insidePage(m.insideCover)}
        {bookInScope && insidePage(bookInScope.insideCover)}

        {whole && (m.chapters.length > 0 || m.appendix.length > 0) && (
          <section class="book-page">
            <h2>Table of Contents</h2>
            <ol class="book-toc">
              {m.chapters.flatMap((ch) => {
                const book = ch.bookId ? m.books.find((b) => b.id === ch.bookId) : undefined;
                const first = book && m.chapters.find((x) => x.bookId === book.id) === ch;
                const rows = [
                  <li key={ch.id}>Chapter {chapterNumber(ch)}{ch.title ? ` — ${ch.title}` : ''}</li>,
                ];
                if (first) {
                  rows.unshift(<li class="book-toc-book" key={book!.id}>{book!.title || 'Untitled Book'}</li>);
                }
                return rows;
              })}
              {m.appendix.length > 0 && <li>Appendix</li>}
            </ol>
          </section>
        )}

        {whole && (m.overview || m.chapters.some((ch) => ch.summary)) && (
          <section class="book-page">
            <h2>Campaign Summary</h2>
            {m.overview && <p class="book-prose">{m.overview}</p>}
            {m.chapters.some((ch) => ch.summary) && (
              <table class="roster-table">
                <tbody>
                  {m.chapters.map((ch) => (
                    <tr key={ch.id}>
                      <td>Chapter {chapterNumber(ch)}</td>
                      <td>{ch.title}</td>
                      <td>{ch.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {whole && m.dmIntro && (
          <section class="book-page">
            <h2>DM Introduction</h2>
            <p class="book-prose">{m.dmIntro}</p>
          </section>
        )}

        {whole && (m.frontCes.length > 0 || m.frontMaps.length > 0) && (
          <section class="book-page">
            <h2>Starting Handouts</h2>
            {m.frontCes.map(ceEntry)}
            {m.frontMaps.map(mapEntry)}
          </section>
        )}

        {spine}

        {whole && m.appendix.length > 0 && (
          <section class="book-page">
            <h2>Appendix</h2>
            {m.appendix.map((s) => (
              <div class="book-entry" key={s.id}>
                <h4>{s.title || 'Untitled'}</h4>
                {s.text && <p class="book-prose">{s.text}</p>}
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
