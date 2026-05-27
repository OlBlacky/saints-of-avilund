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
  plate?: string;        // optional frontispiece (path under public/), shown on the contents page
  plateAlt?: string;
  plateCaption?: string;
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
  {
    slug: 'adnihilo-inter-nos',
    title: 'Adnihilo Inter Nos',
    author: 'Inquisitor-Cardinal Hanzig Van Tassel, Prelate of St. Kerrigan',
    kind: 'A treatise on demons and possession, 1347',
    summary: 'On the demons of the Abyss that walk among Men, and the rites for cases of possession.',
    lede: 'Inquisitor-Cardinal Van Tassel’s manual for the Ordo Calculus Veritas — on knowing a true demon from a frightened neighbour’s fancy, the forms and powers of the Abyss-born, and the rites by which they are put down. Cut with woodcuts by Albrecht Türmann of Waldheim.',
    plate: 'images/woodcuts/adnihilo-examination.png',
    plateAlt: 'Woodcut: a veiled woman seated and bound at a table, examined by a circle of hooded clergy by lamplight.',
    plateCaption: 'An examination for the signs of possession. Woodcut by Albrecht Türmann of Waldheim, from the first impression.',
    order: 6,
  },
];

export function getWork(slug: string): Work | undefined {
  return WORKS.find((w) => w.slug === slug);
}
