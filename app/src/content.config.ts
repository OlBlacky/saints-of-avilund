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

export const collections = { library };
