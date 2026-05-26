// The Library's multi-part works — the registry that drives the paged reader.
//
// Each work is a subfolder of src/content/texts/ whose name is the `slug` here;
// the markdown files inside are its parts (ordered by their `order` frontmatter).
// This file holds the work-level metadata (author, kind, blurbs) that the
// contents page and the Library index display. To add a new multi-part text:
// create src/content/texts/<slug>/ with ordered part files, then add an entry
// here. Single, one-page texts stay in src/content/library/ as before.

export interface Work {
  slug: string;      // folder under content/texts/ and first URL segment
  title: string;
  author?: string;
  kind?: string;     // shown as the eyebrow, e.g. "A travel journal, 1746–1747"
  summary: string;   // one-line blurb for the Library index
  lede?: string;     // longer intro shown on the work's contents page
  order: number;     // position in the Library index (shared with single docs)
}

export const WORKS: Work[] = [
  {
    slug: 'on-the-side-of-heaven',
    title: 'On the Side of Heaven',
    author: 'Dr. Archibald Beaumont, Doctor of Sacred Letters of Lord’s University',
    kind: 'An Account of the Lives of the Imperial Saints',
    summary: 'The authoritative account of the saints — the four orders, the eleven offices, and the nine sects of the Church.',
    lede: 'Beaumont’s account of the saints: the four orders, the eleven offices, and the nine sects of the Church — in a preface and four books.',
    order: 1,
  },
  {
    slug: 'journal',
    title: 'From the Journal of Brother Stephan Dunmorrow',
    author: 'Brother Stephan Dunmorrow, Envoy of St. Ignatius',
    kind: 'A travel journal, 1746–1747',
    summary: 'An account of the journey to the Valdenwail and the long incarceration there — in fifteen entries.',
    lede: 'Envoy of Prelate Calvin Van Miserly of St. Ignatius — an account of his journey through the Hedge to the Valdenwail, and his long, strange incarceration within its sunless walls.',
    order: 4,
  },
];

export function getWork(slug: string): Work | undefined {
  return WORKS.find((w) => w.slug === slug);
}
