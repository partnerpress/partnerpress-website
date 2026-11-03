// @ts-check
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { isIndexable } from './src/lib/indexing.mjs';

const indexable = isIndexable();

/**
 * Keeps non-live builds out of search results. Pages also get a robots meta tag
 * (see BaseLayout); this header covers every file, sitemap and images included.
 * @returns {import('astro').AstroIntegration}
 */
function searchVisibility() {
  return {
    name: 'partnerpress:search-visibility',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (indexable) {
          logger.info('search engines: allowed (live site)');
          return;
        }
        // Goes inside the existing /* rule from public/_headers: Cloudflare lets a
        // second /* rule replace the first, which would drop the security headers.
        const file = fileURLToPath(new URL('_headers', dir));
        const headers = await readFile(file, 'utf8');
        await writeFile(file, headers.replace(/^\/\*\n/m, '/*\n  X-Robots-Tag: noindex, nofollow\n'));
        logger.info('search engines: blocked with noindex (not the live site)');
      },
    },
  };
}

export default defineConfig({
  site: 'https://partnerpress.net',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Inline all CSS so no stylesheet blocks the first render.
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/thank-you/') && !page.includes('/404'),
    }),
    searchVisibility(),
  ],
});
