import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// In-world texts and documents — the Library.
const library = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/library' }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    date: z.string().optional(),    // publication date (a string — covers ranges like "1746–1747")
    kind: z.string().optional(),    // optional Context — rendered as the eyebrow above the title
    artist: z.string().optional(),  // illustrator credited at the top, in the same fashion as the author
    medium: z.string().optional(),  // the art medium (e.g. "Woodcut"), noted beside the artist
    order: z.number().default(100),
    summary: z.string().optional(),
    // Optional leading illustration (a "plate"). `plate` is a path under
    // public/, e.g. "images/woodcuts/foo.jpg" — resolved through url() in the route.
    plate: z.string().optional(),
    plateAlt: z.string().optional(),
    plateCaption: z.string().optional(),
  }),
});

// Rough working drafts and uncertain texts — the Scriptorium (for collaborators).
const scriptorium = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/scriptorium' }),
  schema: z.object({
    title: z.string(),
    source: z.string().optional(),
    order: z.number().default(100),
  }),
});

// Long in-world texts split into navigable parts — the paged reader. Each work
// is a subfolder of src/content/texts/ (e.g. on-the-side-of-heaven/, journal/);
// each file is one part. Work-level metadata lives in src/lib/texts.ts.
const texts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/texts' }),
  schema: z.object({
    title: z.string(),
    order: z.number().default(0),
    // Optional per-part illustration (a "plate"); see the library collection above.
    plate: z.string().optional(),
    plateAlt: z.string().optional(),
    plateCaption: z.string().optional(),
  }),
});

// Character Classes — the rules layer (The System). Each file is one class.
const classes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/classes' }),
  schema: z.object({
    title: z.string(),
    portfolio: z.string().optional(),   // the Saint Portfolio this class is styled to
    summary: z.string().optional(),
    order: z.number().default(100),
  }),
});

// Rules-system prose — one markdown file per System section, named by the
// section's slug (e.g. character-creation.md). Section title/blurb/status live
// in src/lib/system.ts; this collection supplies the body.
const rules = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/rules' }),
  schema: z.object({
    title: z.string().optional(),
    summary: z.string().optional(),
  }),
});

export const collections = { library, scriptorium, texts, classes, rules };
