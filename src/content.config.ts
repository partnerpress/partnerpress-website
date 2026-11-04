import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string().default('Shane Barnes'),
      tags: z.array(z.string()).default([]),
      /** Featured image, used only for social sharing (og:image) and schema. */
      heroImage: image().optional(),
      /** Drafts build in local dev only and never appear on the live site. */
      draft: z.boolean().default(false),
    }),
});

const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { blog, legal };
