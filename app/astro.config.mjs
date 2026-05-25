import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import pagefind from 'astro-pagefind';

// The site is published to GitHub Pages under the repo name.
export default defineConfig({
  site: 'https://olblacky.github.io',
  base: '/saints-of-avilund/',
  integrations: [mdx(), pagefind()],
});
