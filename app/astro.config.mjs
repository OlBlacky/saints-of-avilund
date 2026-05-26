import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';
import { remarkCrossLink } from './src/lib/crosslink';

// The site is published to GitHub Pages under the repo name.
export default defineConfig({
  site: 'https://olblacky.github.io',
  base: '/saints-of-avilund/',
  integrations: [mdx(), pagefind()],
  markdown: {
    // Auto-link the first mention of each saint across all markdown content.
    remarkPlugins: [remarkCrossLink],
  },
});
