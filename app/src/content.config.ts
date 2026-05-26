import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// In-world texts and documents — the Library.
const library = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/library' }),
  schema: z.object({
    title: z.string(),
    author: z.string().optional(),
    kind: z.string().optional(), // e.g. "Ecclesiastical history", "Primer"
    order: z.number().default(100),
    summary: z.string().optional(),
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
  }),
});

export const collections = { library, scriptorium, texts };
